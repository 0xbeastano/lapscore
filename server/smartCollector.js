/**
 * SMART Collector — NVMe Failure Guard
 * 
 * Strategy:
 *   1. Try smartctl binary if available (best data)
 *   2. Fallback to PowerShell Get-StorageReliabilityCounter + Get-PhysicalDisk
 *   3. Fallback to systeminformation si.diskLayout() (minimal data)
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const si = require('systeminformation');

const SMARTCTL_PATH = path.join(__dirname, 'bin', 'smartctl.exe');
const dataDir = process.env.LAPSCORE_DATA_DIR || path.join(__dirname, '..', 'data');

// ── Risk Classification ─────────────────────────────────────
function classifyRisk(drive) {
  // Critical
  if (drive.smartPassed === false) return 'critical';
  if (drive.criticalWarning > 0) return 'critical';
  if (drive.mediaErrors > 0) return 'critical';
  if (drive.reallocatedSectors > 5) return 'critical';
  if (drive.availableSpare != null && drive.availableSpareThreshold != null
      && drive.availableSpare < drive.availableSpareThreshold) return 'critical';
  if (drive.lifespanPct != null && drive.lifespanPct < 10) return 'critical';

  // Warning
  if (drive.lifespanPct != null && drive.lifespanPct < 25) return 'warning';
  if (drive.pctUsed != null && drive.pctUsed > 75) return 'warning';
  if (drive.pendingSectors > 0) return 'warning';
  if (drive.tempC != null && drive.tempC > 70) return 'warning';

  return 'healthy';
}

function getRecommendation(drive) {
  if (drive.riskLevel === 'critical') {
    return 'CRITICAL: This drive shows signs of imminent failure. Back up all data immediately. Replace drive within 1–2 weeks.';
  }
  if (drive.lifespanPct != null && drive.lifespanPct < 25) {
    return 'Drive endurance is below 25%. Plan replacement within 3–6 months. Back up data now.';
  }
  if (drive.lifespanPct != null && drive.lifespanPct < 50) {
    return 'Drive is past half its rated endurance. Monitor monthly. Plan replacement within 1 year.';
  }
  if (drive.tempC != null && drive.tempC > 70) {
    return 'Drive temperature is dangerously high. Check airflow. Sustained heat accelerates wear and causes data corruption.';
  }
  if (drive.lifespanPct != null) {
    return `Drive is healthy. ${drive.lifespanPct}% endurance remaining.`;
  }
  return 'Drive health appears normal based on available data.';
}

// ── Method 1: smartctl binary ───────────────────────────────
function trySmartctl(driveIndex) {
  if (!fs.existsSync(SMARTCTL_PATH)) return null;

  try {
    const devicePath = `\\\\.\\PhysicalDrive${driveIndex}`;
    const output = execSync(
      `"${SMARTCTL_PATH}" --json --all "${devicePath}"`,
      { timeout: 15000, encoding: 'utf-8', windowsHide: true }
    );
    const data = JSON.parse(output);

    const isNvme = data.device?.type === 'nvme';
    const nvme = data.nvme_smart_health_information_log || {};
    const attrs = {};
    
    // Parse SATA attributes by ID
    if (data.ata_smart_attributes?.table) {
      for (const attr of data.ata_smart_attributes.table) {
        attrs[attr.id] = attr;
      }
    }

    let lifespanPct = null;
    let pctUsed = null;

    if (isNvme) {
      pctUsed = nvme.percentage_used ?? null;
      lifespanPct = pctUsed != null ? Math.max(0, 100 - pctUsed) : null;
    } else if (attrs[177]) {
      // SATA SSD Wear Leveling Count
      lifespanPct = attrs[177]?.raw?.value ?? null;
    }

    return {
      source: 'smartctl',
      model: data.model_name || null,
      serial: data.serial_number || null,
      firmware: data.firmware_version || null,
      type: isNvme ? 'NVMe' : (data.rotation_rate === 0 ? 'SSD' : 'HDD'),
      smartPassed: data.smart_status?.passed ?? null,
      lifespanPct,
      pctUsed,
      availableSpare: nvme.available_spare ?? null,
      availableSpareThreshold: nvme.available_spare_threshold ?? null,
      criticalWarning: nvme.critical_warning ?? 0,
      tempC: nvme.temperature ?? (attrs[190]?.raw?.value ?? null),
      mediaErrors: nvme.media_errors ?? 0,
      reallocatedSectors: attrs[5]?.raw?.value ?? 0,
      pendingSectors: attrs[197]?.raw?.value ?? 0,
      powerOnHours: nvme.power_on_hours ?? (attrs[9]?.raw?.value ?? null),
      unsafeShutdowns: nvme.unsafe_shutdowns ?? null,
      dataUnitsWritten: nvme.data_units_written ?? null,
      dataUnitsRead: nvme.data_units_read ?? null,
    };
  } catch (err) {
    console.warn(`[SmartCollector] smartctl failed for drive ${driveIndex}:`, err.message);
    return null;
  }
}

// ── Method 2: PowerShell StorageReliabilityCounter ──────────
function tryPowerShell() {
  const os = require('os');
  const tmpFile = path.join(os.tmpdir(), 'lapscore_smart.ps1');

  try {
    const psScript = [
      '$disks = Get-PhysicalDisk | Select-Object DeviceId, FriendlyName, SerialNumber, MediaType, Size, HealthStatus, OperationalStatus',
      '$results = @()',
      'foreach ($d in $disks) {',
      '  $rel = Get-StorageReliabilityCounter -PhysicalDisk $d -ErrorAction SilentlyContinue',
      '  $obj = [PSCustomObject]@{',
      '    DeviceId = $d.DeviceId',
      '    FriendlyName = $d.FriendlyName',
      '    SerialNumber = $d.SerialNumber',
      '    MediaType = [string]$d.MediaType',
      '    SizeBytes = $d.Size',
      '    HealthStatus = [string]$d.HealthStatus',
      '    OperationalStatus = [string]$d.OperationalStatus',
      '    Temperature = if ($rel) { $rel.Temperature } else { $null }',
      '    Wear = if ($rel) { $rel.Wear } else { $null }',
      '    ReadErrorsTotal = if ($rel) { $rel.ReadErrorsTotal } else { $null }',
      '    WriteErrorsTotal = if ($rel) { $rel.WriteErrorsTotal } else { $null }',
      '    PowerOnHours = if ($rel) { $rel.PowerOnHours } else { $null }',
      '  }',
      '  $results += $obj',
      '}',
      '$results | ConvertTo-Json -Depth 3',
    ].join('\n');

    fs.writeFileSync(tmpFile, psScript, 'utf-8');

    const output = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 20000, encoding: 'utf-8', windowsHide: true }
    );

    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }

    const trimmed = output.trim();
    if (!trimmed) return null;

    let parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) parsed = [parsed]; // Single disk returns object

    return parsed.map(d => {
      const wear = d.Wear;
      const lifespanPct = wear != null ? Math.max(0, 100 - wear) : null;
      const pctUsed = wear ?? null;
      const totalErrors = (d.ReadErrorsTotal || 0) + (d.WriteErrorsTotal || 0);

      // Detect type: check model name for NVMe patterns
      const name = (d.FriendlyName || '').toUpperCase();
      const isNvme = name.includes('NVME') || name.includes('SSDPE') || name.includes('PCIE') || name.includes('M.2');
      const type = isNvme ? 'NVMe'
          : d.MediaType === '4' || d.MediaType === 'SSD' ? 'SSD'
          : d.MediaType === '3' || d.MediaType === 'HDD' ? 'HDD'
          : 'SSD'; // default to SSD for unrecognized solid-state

      return {
        source: 'powershell',
        model: d.FriendlyName || null,
        serial: d.SerialNumber || null,
        firmware: null,
        type,
        smartPassed: d.HealthStatus === 'Healthy',
        lifespanPct,
        pctUsed,
        availableSpare: null,
        availableSpareThreshold: null,
        criticalWarning: 0,
        tempC: d.Temperature || null,
        mediaErrors: totalErrors,
        reallocatedSectors: 0,
        pendingSectors: 0,
        powerOnHours: d.PowerOnHours || null,
        unsafeShutdowns: null,
        dataUnitsWritten: null,
        dataUnitsRead: null,
        sizeBytes: d.SizeBytes || null,
        healthStatus: d.HealthStatus || null,
        operationalStatus: d.OperationalStatus || null,
      };
    });
  } catch (err) {
    console.warn('[SmartCollector] PowerShell fallback failed:', err.message);
    try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
    return null;
  }
}


// ── Method 3: systeminformation fallback ────────────────────
async function trySysInfo() {
  try {
    const disks = await si.diskLayout();
    return disks.map(d => ({
      source: 'systeminformation',
      model: d.name || null,
      serial: d.serialNum || null,
      firmware: d.firmwareRevision || null,
      type: d.type === 'SSD' ? 'SSD' : d.type === 'HD' ? 'HDD' : 'NVMe',
      smartPassed: String(d.smartStatus).toLowerCase() === 'ok' ? true : null,
      lifespanPct: null,
      pctUsed: null,
      availableSpare: null,
      availableSpareThreshold: null,
      criticalWarning: 0,
      tempC: d.temperature || null,
      mediaErrors: 0,
      reallocatedSectors: 0,
      pendingSectors: 0,
      powerOnHours: null,
      unsafeShutdowns: null,
      dataUnitsWritten: null,
      dataUnitsRead: null,
      sizeBytes: d.size || null,
    }));
  } catch (err) {
    console.warn('[SmartCollector] si.diskLayout() failed:', err.message);
    return [];
  }
}

// ── Main Export ──────────────────────────────────────────────
async function getAllDisksSmart() {
  let drives = [];

  // Try smartctl first
  if (fs.existsSync(SMARTCTL_PATH)) {
    try {
      const layout = await si.diskLayout();
      for (let i = 0; i < layout.length; i++) {
        const result = trySmartctl(i);
        if (result) {
          result.name = layout[i].name || result.model;
          result.sizeBytes = result.sizeBytes || layout[i].size;
          drives.push(result);
        }
      }
    } catch (e) { /* fall through */ }
  }

  // Fallback to PowerShell if smartctl didn't work
  if (drives.length === 0) {
    const psResult = tryPowerShell();
    if (psResult && psResult.length > 0) {
      drives = psResult;
    }
  }

  // Final fallback to systeminformation
  if (drives.length === 0) {
    drives = await trySysInfo();
  }

  // Classify risk and add recommendations
  for (const d of drives) {
    d.riskLevel = classifyRisk(d);
    d.recommendation = getRecommendation(d);
  }

  return {
    drives,
    lastScanned: new Date().toISOString(),
    source: drives[0]?.source || 'none',
  };
}

module.exports = { getAllDisksSmart };
