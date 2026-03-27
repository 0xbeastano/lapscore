/**
 * Alert Engine — threshold-based proactive alerts
 */
const settingsManager = require('./settingsManager');
const liveStream = require('./liveStream');

let activeAlerts = [];

function checkAlerts(scanData) {
  const settings = settingsManager.getSettings();
  const thresholds = settings.alerts;
  const now = Date.now();
  const newAlerts = [];

  // CPU
  const cpuLoad = scanData.cpu?.LoadPercentage ? parseFloat(scanData.cpu.LoadPercentage) : null;
  if (cpuLoad !== null) {
    if (cpuLoad >= thresholds.cpu.critical) {
      newAlerts.push({ id: 'cpu-critical', severity: 'critical', message: `CPU at ${cpuLoad.toFixed(0)}% — critically high`, category: 'cpu', ts: now, fix: 'Close heavy background apps or check for malware.' });
    } else if (cpuLoad >= thresholds.cpu.warn) {
      newAlerts.push({ id: 'cpu-warn', severity: 'warning', message: `CPU at ${cpuLoad.toFixed(0)}% — too high at idle`, category: 'cpu', ts: now, fix: 'Consider closing background apps.' });
    }
  }

  // RAM
  if (scanData.ram) {
    const total = parseInt(scanData.ram.TotalVisibleMemorySize, 10) || 0;
    const free = parseInt(scanData.ram.FreePhysicalMemory, 10) || 0;
    const usedPct = total > 0 ? Math.round(((total - free) / total) * 100) : 0;
    if (usedPct >= thresholds.ram.critical) {
      newAlerts.push({ id: 'ram-critical', severity: 'critical', message: `RAM at ${usedPct}% — system may become unresponsive`, category: 'ram', ts: now, fix: 'Close applications to free memory.' });
    } else if (usedPct >= thresholds.ram.warn) {
      newAlerts.push({ id: 'ram-warn', severity: 'warning', message: `RAM at ${usedPct}% — running low`, category: 'ram', ts: now, fix: 'Consider closing unused tabs and applications.' });
    }
  }

  // Battery health
  if (scanData.battery) {
    const full = parseInt(scanData.battery.FullChargeCapacity, 10);
    const design = parseInt(scanData.battery.DesignCapacity, 10);
    if (!isNaN(full) && !isNaN(design) && design > 0) {
      const health = Math.round((full / design) * 100);
      if (health <= thresholds.battery.critical) {
        newAlerts.push({ id: 'battery-critical', severity: 'critical', message: `Battery health at ${health}% — consider replacement`, category: 'battery', ts: now, fix: 'Battery has degraded significantly. Consider replacement.' });
      } else if (health <= thresholds.battery.warn) {
        newAlerts.push({ id: 'battery-warn', severity: 'warning', message: `Battery health at ${health}% — degrading`, category: 'battery', ts: now, fix: 'Avoid keeping laptop plugged in at 100% for extended periods.' });
      }
    }
  }

  // Disk usage
  if (scanData.disks?.Logical) {
    for (const d of scanData.disks.Logical) {
      const free = parseInt(d.FreeSpace, 10);
      const size = parseInt(d.Size, 10);
      if (!isNaN(free) && !isNaN(size) && size > 0) {
        const usedPct = Math.round(((size - free) / size) * 100);
        if (usedPct >= thresholds.disk.critical) {
          newAlerts.push({ id: `disk-critical-${d.DeviceID}`, severity: 'critical', message: `Drive ${d.DeviceID || '?'} at ${usedPct}% full`, category: 'disk', ts: now, fix: 'Free up disk space immediately.' });
        } else if (usedPct >= thresholds.disk.warn) {
          newAlerts.push({ id: `disk-warn-${d.DeviceID}`, severity: 'warning', message: `Drive ${d.DeviceID || '?'} at ${usedPct}% full`, category: 'disk', ts: now, fix: 'Consider cleaning up unused files.' });
        }
      }
    }
  }

  // Emit critical OS notifications for NEW critical alerts
  const newlyCreatedCritical = newAlerts.filter(na => 
    na.severity === 'critical' && 
    !activeAlerts.find(oa => oa.id === na.id)
  );

  if (newlyCreatedCritical.length > 0 && settings.notifications.os && settings.notifications.critical) {
    newlyCreatedCritical.forEach(alert => {
      liveStream.emitAlert(alert);
    });
  }

  activeAlerts = newAlerts;
  return newAlerts;
}

function getActiveAlerts() {
  return activeAlerts;
}

function dismissAlert(id) {
  activeAlerts = activeAlerts.filter(a => a.id !== id);
}

module.exports = { checkAlerts, getActiveAlerts, dismissAlert };
