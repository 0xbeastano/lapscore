function generateRecommendations(scanJson, scores) {
  const issues = [];

  // POWER: EXECUTION blocker exists
  if (scanJson.powerRequests && scanJson.powerRequests.EXECUTION) {
    scanJson.powerRequests.EXECUTION.forEach(proc => {
      issues.push({
        module: "power",
        severity: "critical",
        title: `${proc} is blocking CPU sleep`,
        impact: "This app is keeping your CPU awake and draining battery even when your PC is idle.",
        fix_type: "powershell",
        fix_instruction: `powercfg /requestsoverride PROCESS ${proc} EXECUTION`,
        fixId: "execution_blocker_override"
      });
    });
  }

  // POWER: CPU minimum state
  const minStateDc = scanJson.powerConfig?.PROCTHROTTLEMIN?.DC;
  if (minStateDc !== undefined && minStateDc !== null && minStateDc > 10) {
    issues.push({
      module: "power",
      severity: minStateDc > 50 ? "critical" : "warning",
      title: `CPU minimum state is ${minStateDc}% — should be 5%`,
      impact: "Your CPU never fully idles on battery, wasting power continuously.",
      fix_type: "gui",
      fix_instruction: "Control Panel → Power Options → Change Plan Settings → Advanced Power Settings → Processor Power Management → Minimum Processor State → set On Battery to 5%",
      fixId: "cpu_min_state_5pct"
    });
  }

  // BATTERY: Health
  if (scanJson.battery) {
    const full = parseInt(scanJson.battery.FullChargeCapacity, 10);
    const design = parseInt(scanJson.battery.DesignCapacity, 10);
    if (!isNaN(full) && !isNaN(design) && design > 0) {
      const healthPct = Math.round((full / design) * 100);
      if (healthPct < 80) {
        issues.push({
          module: "battery",
          severity: healthPct < 70 ? "critical" : "warning",
          title: `Battery health at ${healthPct}% — degraded`,
          impact: "Your battery holds less charge than when new, reducing how long your PC lasts per charge.",
          fix_type: "info",
          fix_instruction: "Keep charge between 20-80% and avoid heat to slow further degradation. Replace battery when below 70%."
        });
      }
    }

    // BATTERY: Cycle Count
    const cycles = parseInt(scanJson.battery.CycleCount, 10);
    if (!isNaN(cycles) && cycles > 500) {
      issues.push({
        module: "battery",
        severity: cycles > 700 ? "critical" : "warning",
        title: `Battery has ${cycles} charge cycles — aging`,
        impact: "High cycle count accelerates wear. Plan for replacement within the next 6-12 months.",
        fix_type: "info",
        fix_instruction: "Use PC plugged in for heavy tasks to preserve remaining battery cycles."
      });
    }
  }

  // DRIVERS
  if (scanJson.brokenDrivers) {
    scanJson.brokenDrivers.forEach(d => {
      const code = parseInt(d.ConfigManagerErrorCode, 10);
      if (code === 10 || code === 43) {
        issues.push({
          module: "drivers",
          severity: "critical",
          title: `Driver not working: ${d.Name}`,
          impact: "A broken driver generates wake events that prevent your CPU from resting, increasing power usage.",
          fix_type: "download",
          fix_instruction: `Open Device Manager → find ${d.Name} → right-click → Update Driver. Or download the latest driver from your manufacturer's support site.`
        });
      } else {
        issues.push({
          module: "drivers",
          severity: "warning",
          title: `Driver issue detected: ${d.Name}`,
          impact: "Misconfigured drivers can cause power inefficiency and occasional system instability.",
          fix_type: "gui",
          fix_instruction: `Device Manager → ${d.Name} → right-click → Update Driver → Search automatically for drivers`
        });
      }
    });
  }

  // DISK
  if (scanJson.disks) {
    (scanJson.disks.Logical || []).forEach(d => {
      const free = parseInt(d.FreeSpace, 10);
      const size = parseInt(d.Size, 10);
      if (!isNaN(free) && !isNaN(size) && size > 0) {
        const freePct = Math.round((free / size) * 100);
        if (freePct < 10) {
          issues.push({
            module: "disk",
            severity: "warning",
            title: `Drive ${d.DeviceID} is almost full (${freePct}% free)`,
            impact: "Low disk space causes Windows to slow down and prevents system operations like updates and sleep restore.",
            fix_type: "gui",
            fix_instruction: "Settings → System → Storage → Storage Sense → Run Storage Sense now. Also check Downloads and Temp folders."
          });
        }
      }
    });

    (scanJson.disks.Physical || []).forEach(d => {
      if (d.HealthStatus !== "Healthy") {
        issues.push({
          module: "disk",
          severity: "critical",
          title: `Disk health warning: ${d.FriendlyName}`,
          impact: "A failing disk risks permanent data loss with no warning before failure.",
          fix_type: "powershell",
          fix_instruction: "Run: chkdsk C: /f /r in PowerShell as Administrator. Back up important data immediately."
        });
      }
    });
  }

  // CPU
  if (scanJson.cpu) {
    const load = parseInt(scanJson.cpu.LoadPercentage, 10);
    if (!isNaN(load) && load > 10) {
      issues.push({
        module: "cpu",
        severity: "warning",
        title: `CPU load is ${load}% at idle — too high`,
        impact: "High idle CPU load drains battery and generates heat even when you are not actively working.",
        fix_type: "gui",
        fix_instruction: "Open Task Manager → Processes → sort by CPU → identify and close heavy background processes. Check Startup tab and disable unnecessary apps."
      });
    }
  }

  // GPU
  if (scanJson.gpu) {
    scanJson.gpu.forEach(g => {
      if (parseInt(g.ConfigManagerErrorCode, 10) !== 0) {
        issues.push({
          module: "gpu",
          severity: "warning",
          title: "GPU driver issue detected",
          impact: "A GPU driver error can cause display problems and prevent GPU power saving.",
          fix_type: "download",
          fix_instruction: "Download the latest GPU driver from nvidia.com/drivers or amd.com/support depending on your GPU manufacturer."
        });
      }
    });
  }

  // SORT: critical first, warning, info
  const severityRank = { critical: 1, warning: 2, info: 3 };
  issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return issues;
}

module.exports = { generateRecommendations };
