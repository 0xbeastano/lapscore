function scoreScan(scanJson) {
  let battery = 100;
  let power = 100;
  let cpu = 100;
  let ram = 100;
  let disk = 100;
  let drivers = 100;
  let gpu = 100;

  // BATTERY SCORE
  if (!scanJson.battery) {
    battery = 100;
  } else {
    const full = parseInt(scanJson.battery.FullChargeCapacity, 10);
    const design = parseInt(scanJson.battery.DesignCapacity, 10);
    if (!isNaN(full) && !isNaN(design) && design > 0) {
      battery = (full / design) * 100;
    }
    const cycles = parseInt(scanJson.battery.CycleCount, 10);
    if (!isNaN(cycles)) {
      if (cycles > 700) battery -= 20;
      else if (cycles > 500) battery -= 10;
      else if (cycles > 300) battery -= 5;
    }
  }

  // POWER SCORE
  if (!scanJson.powerConfig || !scanJson.powerRequests) {
    power = 75;
  } else {
    const execs = scanJson.powerRequests.EXECUTION || [];
    power -= execs.length * 25;

    const minStateDc = scanJson.powerConfig?.PROCTHROTTLEMIN?.DC;
    if (minStateDc !== undefined && minStateDc !== null) {
      if (minStateDc > 50) power -= 35;
      else if (minStateDc > 20) power -= 20;
      else if (minStateDc > 10) power -= 10;
    }
  }

  // CPU SCORE
  if (!scanJson.cpu) {
    cpu = null;
  } else {
    const load = scanJson.cpu.LoadPercentage;
    if (load > 20) cpu -= 25;
    else if (load > 10) cpu -= 15;
    else if (load > 5) cpu -= 5;
  }

  // RAM SCORE
  if (!scanJson.ram) {
    ram = null;
  } else {
    const total = parseInt(scanJson.ram.TotalVisibleMemorySize, 10);
    const free = parseInt(scanJson.ram.FreePhysicalMemory, 10);
    if (!isNaN(total) && !isNaN(free) && total > 0) {
      const usedPct = ((total - free) / total) * 100;
      if (usedPct > 90) ram -= 40;
      else if (usedPct > 75) ram -= 20;
      else if (usedPct > 60) ram -= 10;
    }
  }

  // DISK SCORE
  if (!scanJson.disks) {
    disk = null;
  } else {
    (scanJson.disks.Physical || []).forEach(d => {
      if (d.HealthStatus !== "Healthy") disk -= 35;
      if (d.OperationalStatus !== "OK") disk -= 20;
    });
    (scanJson.disks.Logical || []).forEach(d => {
      const free = parseInt(d.FreeSpace, 10);
      const size = parseInt(d.Size, 10);
      if (!isNaN(free) && !isNaN(size) && size > 0) {
        const freePct = (free / size) * 100;
        if (freePct < 5) disk -= 25;
        else if (freePct < 10) disk -= 15;
      }
    });
  }

  // DRIVER SCORE
  if (scanJson.brokenDrivers) {
    scanJson.brokenDrivers.forEach(d => {
      drivers -= 12;
      if (d.ConfigManagerErrorCode === 10 || d.ConfigManagerErrorCode === 43) {
        drivers -= 5;
      }
    });
  }

  // GPU SCORE
  if (scanJson.gpu && scanJson.gpu.length > 0) {
    scanJson.gpu.forEach(g => {
      if (g.ConfigManagerErrorCode !== 0) gpu -= 40;
      if (g.Status !== "OK") gpu -= 20;
    });
  } else if (!scanJson.gpu || scanJson.gpu.length === 0) {
    gpu = null;
  }

  // MINIMUMS
  battery = battery !== null ? Math.max(0, battery) : null;
  power = power !== null ? Math.max(0, power) : null;
  cpu = cpu !== null ? Math.max(0, cpu) : null;
  ram = ram !== null ? Math.max(0, ram) : null;
  disk = disk !== null ? Math.max(0, disk) : null;
  drivers = drivers !== null ? Math.max(0, drivers) : null;
  gpu = gpu !== null ? Math.max(0, gpu) : null;

  // WEIGHTED TOTAL
  const weights = {
    battery: 0.25,
    power: 0.20,
    cpu: 0.15,
    ram: 0.05,
    disk: 0.20,
    drivers: 0.10,
    gpu: 0.05
  };
  
  let validWeightSum = 0;
  if (battery !== null) validWeightSum += weights.battery;
  if (power !== null) validWeightSum += weights.power;
  if (cpu !== null) validWeightSum += weights.cpu;
  if (ram !== null) validWeightSum += weights.ram;
  if (disk !== null) validWeightSum += weights.disk;
  if (drivers !== null) validWeightSum += weights.drivers;
  if (gpu !== null) validWeightSum += weights.gpu;

  let totalNum = 0;
  if (validWeightSum > 0) {
    if (battery !== null) totalNum += battery * (weights.battery / validWeightSum);
    if (power !== null) totalNum += power * (weights.power / validWeightSum);
    if (cpu !== null) totalNum += cpu * (weights.cpu / validWeightSum);
    if (ram !== null) totalNum += ram * (weights.ram / validWeightSum);
    if (disk !== null) totalNum += disk * (weights.disk / validWeightSum);
    if (drivers !== null) totalNum += drivers * (weights.drivers / validWeightSum);
    if (gpu !== null) totalNum += gpu * (weights.gpu / validWeightSum);
  }

  const total = Math.round(totalNum);
  
  // GRADE MAP
  let grade = "F";
  let gradeLabel = "Critical";
  let gradeColor = "#ef4444";

  if (total >= 90) { grade = "A"; gradeLabel = "Excellent"; gradeColor = "#22c55e"; }
  else if (total >= 75) { grade = "B"; gradeLabel = "Good"; gradeColor = "#84cc16"; }
  else if (total >= 60) { grade = "C"; gradeLabel = "Fair"; gradeColor = "#eab308"; }
  else if (total >= 40) { grade = "D"; gradeLabel = "Poor"; gradeColor = "#f97316"; }

  // BREAKDOWN for "Why this score?"
  const mkReason = (cat, score, max) => {
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    if (pct >= 90) return { impact: 'low', note: 'Excellent' };
    if (pct >= 70) return { impact: 'low', note: 'Minor issue' };
    if (pct >= 50) return { impact: 'medium', note: 'Needs attention' };
    return { impact: 'high', note: 'Critical problem' };
  };

  const batScore = battery !== null ? Math.round(battery * 0.25) : 0;
  const cpuScore = cpu !== null ? Math.round(cpu * 0.15) : 0;
  const ramScore = ram !== null ? Math.round(ram * 0.05) : 0;
  const dskScore = disk !== null ? Math.round(disk * 0.20) : 0;
  const pwrScore = power !== null ? Math.round(power * 0.20) : 0;
  const drvScore = drivers !== null ? Math.round(drivers * 0.10) : 0;
  const gpuScore = gpu !== null ? Math.round(gpu * 0.05) : 0;

  const batReason = battery !== null
    ? (battery >= 90 ? 'Battery in excellent condition' : battery >= 70 ? `Battery health at ${Math.round(battery)}% — minor capacity loss` : `Battery degraded to ${Math.round(battery)}%`)
    : 'No battery detected';
  const cpuReason = cpu !== null
    ? (scanJson.cpu?.LoadPercentage > 40 ? `CPU load ${scanJson.cpu.LoadPercentage}% at idle — too high` : scanJson.cpu?.LoadPercentage > 20 ? `CPU load ${scanJson.cpu.LoadPercentage}% — slightly elevated` : 'CPU load normal')
    : 'CPU data unavailable';
  const ramReason = ram !== null
    ? (() => { const t = parseInt(scanJson.ram?.TotalVisibleMemorySize,10)||1; const f = parseInt(scanJson.ram?.FreePhysicalMemory,10)||0; const u = Math.round(((t-f)/t)*100); return u > 85 ? `${u}% RAM in use — memory pressure` : u > 65 ? `${u}% RAM in use — moderate` : `${u}% RAM in use — healthy`; })()
    : 'RAM data unavailable';
  const dskReason = disk !== null
    ? (disk >= 90 ? 'All drives SMART healthy' : disk >= 60 ? 'SMART caution on one or more drives' : 'Drive health critical')
    : 'Disk data unavailable';

  const breakdown = [
    { category: 'Battery', score: batScore, maxScore: 25, weight: 25, reason: batReason, impact: mkReason('bat', batScore, 25).impact },
    { category: 'Power',   score: pwrScore, maxScore: 20, weight: 20, reason: power !== null ? (power >= 80 ? 'Power config optimal' : 'Power plan not optimized') : 'N/A', impact: mkReason('pwr', pwrScore, 20).impact },
    { category: 'CPU',     score: cpuScore, maxScore: 15, weight: 15, reason: cpuReason, impact: mkReason('cpu', cpuScore, 15).impact },
    { category: 'Storage', score: dskScore, maxScore: 20, weight: 20, reason: dskReason, impact: mkReason('dsk', dskScore, 20).impact },
    { category: 'Drivers', score: drvScore, maxScore: 10, weight: 10, reason: drivers !== null ? (drivers >= 90 ? 'All drivers healthy' : `${Math.round(100 - drivers)}% driver issues`) : 'N/A', impact: mkReason('drv', drvScore, 10).impact },
    { category: 'Memory',  score: ramScore, maxScore: 5,  weight: 5,  reason: ramReason, impact: mkReason('ram', ramScore, 5).impact },
    { category: 'GPU',     score: gpuScore, maxScore: 5,  weight: 5,  reason: gpu !== null ? (gpu >= 90 ? 'GPU operational' : 'GPU error detected') : 'No discrete GPU', impact: mkReason('gpu', gpuScore, 5).impact },
  ];

  return {
    battery, power, cpu, ram, disk, drivers, gpu, total, grade, gradeLabel, gradeColor, breakdown
  };
}

module.exports = { scoreScan };
