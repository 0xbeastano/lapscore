const db = require('./db');

/**
 * Computes Battery Stress Score (0-100)
 * 0 = Perfect, 100 = Critical Stress
 */
function computeIntelligence(battery) {
  const samples = db.getBatterySamples(200); // Last ~6 hours
  const cycles = db.getCycleCount();
  
  // 1. THERMAL STRESS (33% weighting)
  const highTempSamples = samples.filter(s => s.temp_c > 35).length;
  const criticalTempSamples = samples.filter(s => s.temp_c > 42).length;
  const thermalStress = Math.min(33, (highTempSamples * 2) + (criticalTempSamples * 10));

  // 2. DISCHARGE STRESS (33% weighting)
  const deepDischargeSamples = samples.filter(s => s.soc < 15).length;
  const dischargeStress = Math.min(33, deepDischargeSamples * 5);

  // 3. CYCLE INTENSITY (34% weighting)
  const history = db.getBatteryTrend();
  let cyclesPerDay = 0.5;
  if (history.length > 5) {
    const start = new Date(history[0].timestamp).getTime();
    const days = Math.max(1, (Date.now() - start) / (24 * 60 * 60 * 1000));
    cyclesPerDay = cycles / days;
  }
  const cycleStress = Math.min(34, Math.max(0, (cyclesPerDay - 0.5) * 20));

  const totalStress = Math.round(thermalStress + dischargeStress + cycleStress);
  
  let healthGrade = "EXCELLENT";
  if (totalStress > 60) healthGrade = "CRITICAL";
  else if (totalStress > 40) healthGrade = "WARNING";
  else if (totalStress > 20) healthGrade = "STRESSED";

  return {
    stressScore: totalStress,
    healthGrade,
    factors: {
      thermal: Math.round((thermalStress / 33) * 100),
      discharge: Math.round((dischargeStress / 33) * 100),
      intensity: Math.round((cycleStress / 34) * 100)
    },
    currentSoH: battery.maxCapacity && battery.designCapacity 
      ? Math.round((battery.maxCapacity / battery.designCapacity) * 100) 
      : 100
  };
}

module.exports = { computeIntelligence };
