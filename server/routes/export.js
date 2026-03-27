const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/json', (req, res) => {
  try {
    const scanRow = db.getLatestScan();
    if (!scanRow || !scanRow.raw_json) {
      return res.status(404).json({ error: "No scan found to export" });
    }
    
    res.setHeader('Content-disposition', `attachment; filename=lapscore_export_${scanRow.id}.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(scanRow.raw_json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/csv', (req, res) => {
  try {
    const { type, days = 30, limit = 50 } = req.query;
    let data = [];
    let headers = '';
    const cutoff = Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000);

    if (type === 'battery') {
      data = db.prepare('SELECT * FROM battery_samples WHERE timestamp > ? ORDER BY timestamp ASC').all(cutoff);
      headers = 'timestamp,soc,isCharging,tempC,voltageMV\n';
      const body = data.map(r => `${new Date(r.timestamp).toISOString()},${r.soc},${r.is_charging},${r.temp_c},${r.voltage_mv}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="lapscore-battery-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(headers + body);
    } 
    
    if (type === 'cpu') {
      data = db.prepare('SELECT * FROM cpu_samples WHERE timestamp > ? ORDER BY timestamp ASC').all(cutoff);
      headers = 'timestamp,loadPct,speedGHz,tempMain,throttleType\n';
      const body = data.map(r => `${new Date(r.timestamp).toISOString()},${r.load_pct},${r.speed_ghz},${r.temp_main},${r.throttle_type || 'none'}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="lapscore-cpu-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(headers + body);
    }

    if (type === 'scans') {
      data = db.prepare('SELECT * FROM scans ORDER BY timestamp DESC LIMIT ?').all(parseInt(limit));
      headers = 'timestamp,score,grade,critical_issues,warnings,device_model\n';
      const body = data.map(r => `${new Date(r.timestamp).toISOString()},${r.score_total},${r.grade},${r.issue_count_critical},${r.issue_count_warning},"${r.device_model}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="lapscore-history-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(headers + body);
    }

    res.status(400).json({ error: "Invalid export type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

router.get('/html', (req, res) => {
  const scanRow = db.getLatestScan();
  if (!scanRow) return res.status(404).json({error: "No scans found"});
  
  const raw = JSON.parse(scanRow.raw_json);
  const issues = db.getIssuesByScanId(scanRow.id);
  const t = new Date(scanRow.timestamp).toISOString().split('T')[0];
  const model = raw.metadata?.Model || 'UnknownDevice';

  const payload = {
     scan: scanRow,
     raw,
     issues
  };

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>LapScore Report - ${model}</title>
<style>
  body { background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; padding: 20px; line-height: 1.5; }
  .card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
  .text-red { color: #ef4444; } .text-green { color: #22c55e; } .text-yellow { color: #eab308; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { padding: 10px; text-align: left; border-bottom: 1px solid #222; }
  th { color: #888; font-size: 12px; text-transform: uppercase; }
  @media print { body { background: #fff; color: #000; } .card { border: 1px solid #ccc; background: #fff; } table { border-color: #ddd; } }
</style>
</head>
<body>
  <h1>LapScore Health Report</h1>
  <p><strong>Device:</strong> ${model}</p>
  <p><strong>Date:</strong> ${new Date(scanRow.timestamp).toLocaleString()}</p>
  
  <div class="card">
    <h2>Overall Score: ${Math.round(scanRow.score_total)}/100 Grade: ${scanRow.grade}</h2>
    <p>Critical Issues: ${scanRow.issue_count_critical} | Warnings: ${scanRow.issue_count_warning}</p>
  </div>
  
  <script>
    const LAPSCORE_DATA = [${JSON.stringify(payload)}];
  </script>
  
  <div class="card">
    <h2>Issues</h2>
    <table>
      <tr><th>Severity</th><th>Module</th><th>Title</th></tr>
      ${issues.map(i => `<tr><td class="${i.severity === 'critical' ? 'text-red' : 'text-yellow'}">${i.severity.toUpperCase()}</td><td>${i.module}</td><td>${i.title}</td></tr>`).join('')}
    </table>
  </div>
  
  <script>window.print();</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="LapScore_${model.replace(/\s+/g, '_')}_${t}.html"`);
  res.send(html);
});
