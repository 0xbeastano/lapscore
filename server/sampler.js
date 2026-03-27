const si = require('systeminformation');
const db = require('./db');

let intervalId = null;
const SAMPLE_INTERVAL_MS = 120000; // 2 minutes
let lastSamples = []; // In-memory buffer for last 60 samples (2 hours)

async function collectSample() {
  try {
    const battery = await si.battery();
    if (!battery || battery.hasBattery === false) return;

    const sample = {
      timestamp: Date.now(),
      soc: battery.percent,
      is_charging: battery.isCharging ? 1 : 0,
      voltage_mv: battery.voltage || null, // Might be in Volts, but db schema says mv
      temp_c: battery.temperature || null,
      time_remaining: battery.timeRemaining || null
    };

    // Voltage normalization: si often returns Volts (e.g. 15.4), convert to mV
    if (sample.voltage_mv && sample.voltage_mv < 100) {
      sample.voltage_mv = sample.voltage_mv * 1000;
    }

    db.insertBatterySample(sample);

    // Keep memory buffer fresh
    lastSamples.push(sample);
    if (lastSamples.length > 60) lastSamples.shift();

    const cycleCounter = require('./cycleCounter');
    cycleCounter.processSample(sample);

  } catch (err) {
    console.error('[Sampler] Tick failed:', err.message);
  }
}

function start() {
  if (intervalId) return;
  console.log('[Sampler] Starting life-cycle monitoring (2m interval)');
  
  // Collect first sample immediately
  collectSample();
  
  intervalId = setInterval(collectSample, SAMPLE_INTERVAL_MS);

  // Daily cleanup at roughly 24h interval
  setInterval(() => {
    try {
      const deleted = db.pruneBatterySamples(30);
      if (deleted.changes > 0) {
        console.log(`[Sampler] Pruned ${deleted.changes} old battery samples`);
      }
    } catch (e) {
      console.error('[Sampler] Cleanup failed:', e.message);
    }
  }, 24 * 60 * 60 * 1000);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Sampler] Stopped.');
  }
}

function getRecentSamples() {
  return lastSamples;
}

function isRunning() {
  return intervalId !== null;
}

module.exports = {
  start,
  stop,
  getRecentSamples,
  isRunning
};
