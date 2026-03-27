const db = require('./db');

/**
 * Aggregates user charging habits from battery_cycles 
 * and battery_samples to generate actionable coaching.
 */
function aggregateHabits() {
  const samples = db.getBatterySamples(1000); // Analysis based on recent samples
  const cycles = db.getBatteryCycles(30);

  if (!samples.length) return { coaching: [], pattern: 'N/A' };

  // 1. Avg Charge Ceiling (how high do they charge?)
  let ceils = samples.filter(s => s.is_charging).map(s => s.soc);
  let avgCeiling = ceils.length ? ceils.reduce((a, b) => a + b, 0) / ceils.length : 100;

  // 2. Hot Charging Minutes (>40C while charging)
  let hotMins = samples.filter(s => s.is_charging && s.temp_c > 40).length * 2; // Each sample = 2 min

  // 3. Discharge Floor (how low do they drain?)
  let floors = samples.filter(s => !s.is_charging).map(s => s.soc);
  let avgFloor = floors.length ? floors.reduce((a, b) => a + b, 0) / floors.length : 100;

  // 4. Pattern Classification
  let pattern = 'Balanced';
  if (avgCeiling > 95 && avgFloor > 50) pattern = 'Top-up Charger';
  else if (avgFloor < 20) pattern = 'Full Cycler';

  // 5. Build coaching messages
  let coaching = [];
  if (avgCeiling > 95) {
    coaching.push({
      type: 'ceiling',
      severity: 'warning',
      message: 'Charging to 100% daily accelerates battery aging. Limit to 80% to extend life.'
    });
  }
  if (avgFloor < 15) {
    coaching.push({
      type: 'floor',
      severity: 'warning',
      message: 'Deep discharges below 15% wear the battery faster. Plug in at 20%.'
    });
  }
  if (hotMins > 10) {
    coaching.push({
      type: 'heat',
      severity: 'critical',
      message: `Your battery was hot (${hotMins} mins) while charging. Heat is a battery killer.`
    });
  }

  return {
    avgCeiling: Math.round(avgCeiling),
    avgFloor: Math.round(avgFloor),
    hotChargeMinutes: hotMins,
    pattern,
    coaching
  };
}

module.exports = { aggregateHabits };
