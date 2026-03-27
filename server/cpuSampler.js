/**
 * CPU Frequency Sampler — 30-second background polling
 * Detects thermal and power throttling in real-time.
 */
const si = require('systeminformation');
const db = require('./db');

const INTERVAL_MS = 30_000; // 30 seconds
const THERMAL_TEMP_C = 85;

// Cached at startup — si.cpu() is slow, call once
let cpuMeta = {
  brand: 'Unknown',
  cores: 0,
  physicalCores: 0,
  ratedBaseGHz: 0,
  ratedMaxGHz: 0,
};

let intervalHandle = null;
let running = false;

// Throttle event state machine
let eventState = {
  inEvent: false,
  eventStartedAt: null,
  eventType: null,
  samples: [],    // samples during the current event
};

async function init() {
  try {
    const cpu = await si.cpu();
    cpuMeta = {
      brand: cpu.brand || 'Unknown',
      cores: cpu.cores || 0,
      physicalCores: cpu.physicalCores || 0,
      ratedBaseGHz: cpu.speed || 0,
      ratedMaxGHz: cpu.speedMax || cpu.speed || 0,
    };
    console.log(`[CpuSampler] CPU: ${cpuMeta.brand} | Base: ${cpuMeta.ratedBaseGHz} GHz | Max: ${cpuMeta.ratedMaxGHz} GHz`);
  } catch (err) {
    console.error('[CpuSampler] Failed to cache CPU meta:', err.message);
  }
}

function classifyThrottle(speedGHz, tempC, isOnBattery) {
  if (!cpuMeta.ratedMaxGHz || cpuMeta.ratedMaxGHz === 0) {
    return { type: null, severity: null };
  }

  const ratio = speedGHz / cpuMeta.ratedMaxGHz;

  // No throttle if within 15% of rated max
  if (ratio > 0.85) {
    return { type: null, severity: null };
  }

  // Determine severity
  let severity;
  if (ratio < 0.50) severity = 'severe';
  else if (ratio < 0.70) severity = 'moderate';
  else severity = 'mild';

  // Determine type
  let type;
  const isHot = tempC !== null && tempC > THERMAL_TEMP_C;

  if (isHot && isOnBattery) {
    type = 'both';
  } else if (isHot) {
    type = 'thermal';
  } else if (isOnBattery) {
    type = 'power';
  } else {
    type = 'power'; // plugged in but throttled = power limit policy
  }

  return { type, severity };
}

async function collectSample() {
  try {
    const [speed, load, temp, battery] = await Promise.all([
      si.cpuCurrentSpeed(),
      si.currentLoad(),
      si.cpuTemperature().catch(() => ({})),
      si.battery().catch(() => ({})),
    ]);

    const now = Date.now();
    const speedGHz = speed.avg || 0;
    const tempMain = temp.main || null;
    const tempMax = temp.max || tempMain;
    const loadPct = load.currentLoad || 0;
    const isOnBattery = battery.hasBattery && !battery.isCharging ? 1 : 0;

    const { type, severity } = classifyThrottle(speedGHz, tempMain, isOnBattery === 1);

    const sample = {
      timestamp: now,
      load_pct: Math.round(loadPct * 10) / 10,
      speed_ghz: Math.round(speedGHz * 100) / 100,
      speed_max_ghz: cpuMeta.ratedMaxGHz,
      temp_main: tempMain,
      temp_max: tempMax,
      is_on_battery: isOnBattery,
      throttle_type: type,
      throttle_severity: severity,
    };

    db.insertCpuSample(sample);

    // Throttle event state machine
    processEventStateMachine(sample);

  } catch (err) {
    console.error('[CpuSampler] Tick failed:', err.message);
  }
}

function processEventStateMachine(sample) {
  const isThrottling = sample.throttle_severity !== null;

  if (!eventState.inEvent && isThrottling) {
    // Start new event
    eventState.inEvent = true;
    eventState.eventStartedAt = sample.timestamp;
    eventState.eventType = sample.throttle_type;
    eventState.samples = [sample];

    db.insertThrottleEvent({
      started_at: sample.timestamp,
      ended_at: null,
      duration_sec: null,
      throttle_type: sample.throttle_type,
      severity: sample.throttle_severity,
      avg_speed_ghz: sample.speed_ghz,
      rated_speed_ghz: cpuMeta.ratedMaxGHz,
      speed_loss_pct: Math.round((1 - sample.speed_ghz / cpuMeta.ratedMaxGHz) * 100),
      max_temp: sample.temp_main,
      resolved_reason: null,
    });

  } else if (eventState.inEvent && !isThrottling) {
    // End current event
    const durationSec = Math.round((sample.timestamp - eventState.eventStartedAt) / 1000);
    const avgSpeed = eventState.samples.reduce((s, r) => s + r.speed_ghz, 0) / eventState.samples.length;
    const maxTemp = Math.max(...eventState.samples.map(r => r.temp_main || 0));
    const speedLoss = Math.round((1 - avgSpeed / cpuMeta.ratedMaxGHz) * 100);

    // Determine why it resolved
    let reason = 'cooled_down';
    if (eventState.eventType === 'power' && sample.is_on_battery === 0) {
      reason = 'plugged_in';
    }

    db.finalizeThrottleEvent(eventState.eventStartedAt, {
      ended_at: sample.timestamp,
      duration_sec: durationSec,
      avg_speed_ghz: Math.round(avgSpeed * 100) / 100,
      speed_loss_pct: speedLoss,
      max_temp: maxTemp,
      resolved_reason: reason,
    });

    eventState.inEvent = false;
    eventState.eventStartedAt = null;
    eventState.eventType = null;
    eventState.samples = [];

  } else if (eventState.inEvent && isThrottling) {
    // Update running event
    eventState.samples.push(sample);
    // Upgrade type if needed
    if (sample.throttle_type === 'both') eventState.eventType = 'both';
  }
}

async function start() {
  if (running) return;
  running = true;
  console.log('[CpuSampler] Starting — 30s interval');
  await init();
  collectSample(); // first sample immediately
  intervalHandle = setInterval(collectSample, INTERVAL_MS);
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  running = false;
  console.log('[CpuSampler] Stopped');
}

function isRunning() {
  return running;
}

function getCpuMeta() {
  return cpuMeta;
}

module.exports = { start, stop, isRunning, getCpuMeta };
