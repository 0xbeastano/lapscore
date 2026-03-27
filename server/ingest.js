const db = require('./db');
const { scoreScan } = require('./scorer');
const { generateRecommendations } = require('./recommendations');

function ingest(jsonData) {
  // 1. Calculate scores and recommendations
  const scores = scoreScan(jsonData);
  const recommendations = generateRecommendations(jsonData, scores);

  let criticalCount = 0;
  let warningCount = 0;
  for (const rec of recommendations) {
    if (rec.severity === 'critical') criticalCount++;
    if (rec.severity === 'warning') warningCount++;
  }

  // 2. Store JSON and scores in scans table
  const scanRecord = {
    id: jsonData.scanId,
    timestamp: jsonData.timestamp,
    device_model: jsonData.metadata?.Model || 'Unknown',
    os_version: jsonData.metadata?.OSVersion || 'Unknown',
    raw_json: JSON.stringify(jsonData),
    score_total: scores.total,
    score_battery: scores.battery,
    score_power: scores.power,
    score_cpu: scores.cpu,
    score_disk: scores.disk,
    score_drivers: scores.drivers,
    grade: scores.grade,
    issue_count_critical: criticalCount,
    issue_count_warning: warningCount
  };
  
  db.insertScan(scanRecord);
  
  if (recommendations.length > 0) {
    db.insertIssues(jsonData.scanId, recommendations);
  }

  // 3. Extract battery data and insert into battery_history
  if (jsonData.battery) {
    const bat = jsonData.battery;
    const full = parseInt(bat.FullChargeCapacity, 10);
    const design = parseInt(bat.DesignCapacity, 10);
    let health_pct = null;
    if (!isNaN(full) && !isNaN(design) && design > 0) {
      health_pct = parseFloat(((full / design) * 100).toFixed(2));
    }
    
    let runtime_minutes = null;
    if (bat.EstimatedRunTime && !isNaN(bat.EstimatedRunTime)) {
      const val = parseInt(bat.EstimatedRunTime, 10);
      if (val < 70000000) {
        runtime_minutes = val;
      }
    }

    const batteryData = {
      timestamp: jsonData.timestamp,
      health_pct: health_pct,
      full_charge_mwh: isNaN(full) ? null : full,
      design_capacity_mwh: isNaN(design) ? null : design,
      cycle_count: bat.CycleCount ? parseInt(bat.CycleCount, 10) : null,
      estimated_runtime_minutes: runtime_minutes
    };
    db.insertBatteryHistory(jsonData.scanId, batteryData);
  }

  // 3.5 Write to score_history.json
  try {
    const fs = require('fs');
    const path = require('path');
    const dataDir = process.env.LAPSCORE_DATA_DIR || path.join(__dirname, '..', 'data');
    const historyPath = path.join(dataDir, 'score_history.json');
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    }
    const ts = new Date(jsonData.timestamp).getTime() || Date.now();
    // Compute extra metrics for history page
    let batteryHealth = null;
    if (jsonData.battery) {
      const fc = parseInt(jsonData.battery.FullChargeCapacity, 10);
      const dc = parseInt(jsonData.battery.DesignCapacity, 10);
      if (!isNaN(fc) && !isNaN(dc) && dc > 0) batteryHealth = Math.round((fc / dc) * 100);
    }
    const cpuLoad = jsonData.cpu?.LoadPercentage ? Math.round(parseFloat(jsonData.cpu.LoadPercentage)) : null;
    let ramUsed = null;
    if (jsonData.ram) {
      const t = parseInt(jsonData.ram.TotalVisibleMemorySize, 10) || 0;
      const f = parseInt(jsonData.ram.FreePhysicalMemory, 10) || 0;
      if (t > 0) ramUsed = Math.round(((t - f) / t) * 100);
    }
    const topIssue = recommendations.length > 0 ? recommendations[0].message || recommendations[0].title || 'Issue found' : null;
    history.push({
      ts, score: scores.total, grade: scores.grade,
      batteryHealth, cpuLoad, ramUsed,
      issueCount: criticalCount + warningCount,
      topIssue
    });
    if (history.length > 30) history = history.slice(-30);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write score history", err);
  }

  // 4. Return the full scored result
  return {
    scan: db.getScanById(jsonData.scanId),
    scores: scores,
    recommendations: recommendations,
    raw: jsonData
  };
}

module.exports = { ingest };
