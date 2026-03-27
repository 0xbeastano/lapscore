const db = require('./db');

// State machine for cycle detection
let currentState = 'IDLE'; // IDLE | CHARGING | DISCHARGING
let currentCycle = null;
let lastSample = null;

/**
 * Process a new battery sample to detect cycles.
 * Simplified rainflow logic: detect significant SoC changes
 * and group into discharge/charge events.
 */
function processSample(sample) {
  if (!lastSample) {
    lastSample = sample;
    return;
  }

  const socDiff = sample.soc - lastSample.soc;
  const chargingChanged = sample.is_charging !== lastSample.is_charging;

  // 1. Detect State Transitions
  if (chargingChanged) {
    if (sample.is_charging) {
      if (currentState === 'DISCHARGING') {
        finalizeDischarge(sample);
      }
      currentState = 'CHARGING';
      startCharge(sample);
    } else {
      if (currentState === 'CHARGING') {
        finalizeCharge(sample);
      }
      currentState = 'DISCHARGING';
      startDischarge(sample);
    }
  }

  // 2. Track extremes during current state
  if (currentCycle) {
    currentCycle.min_soc = Math.min(currentCycle.min_soc, sample.soc);
    currentCycle.max_soc = Math.max(currentCycle.max_soc, sample.soc);
    if (currentState === 'CHARGING') currentCycle.charged_to = Math.max(currentCycle.charged_to || 0, sample.soc);
    if (currentState === 'DISCHARGING') currentCycle.discharged_to = Math.min(currentCycle.discharged_to || 100, sample.soc);
  }

  lastSample = sample;
}

function startDischarge(sample) {
  currentCycle = {
    started_at: sample.timestamp,
    soc_start: sample.soc,
    min_soc: sample.soc,
    max_soc: sample.soc,
    discharged_to: sample.soc
  };
}

function finalizeDischarge(sample) {
  if (!currentCycle) return;
  const depth = currentCycle.soc_start - sample.soc;
  
  if (depth > 1) { // Ignore <1% jitters
    currentCycle.ended_at = sample.timestamp;
    currentCycle.soc_end = sample.soc;
    currentCycle.depth = depth;
    currentCycle.duration_min = Math.round((currentCycle.ended_at - currentCycle.started_at) / 60000);
    db.insertBatteryCycle(currentCycle);
  }
  currentCycle = null;
}

function startCharge(sample) {
  currentCycle = {
    started_at: sample.timestamp,
    soc_start: sample.soc,
    min_soc: sample.soc,
    max_soc: sample.soc,
    charged_to: sample.soc
  };
}

function finalizeCharge(sample) {
  // We primarily track discharge depth for cycle counts, 
  // but we can log peak charging too.
  currentCycle = null; 
}

function getCycleCount() {
  return db.getCycleCount();
}

function getCurrentState() {
  return currentState;
}

module.exports = {
  processSample,
  getCycleCount,
  getCurrentState
};
