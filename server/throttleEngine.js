/**
 * Throttle Engine — aggregation & recommendations
 * Reads cpu_samples + throttle_events to produce live status & history
 */
const db = require('./db');

const RECOMMENDATIONS = {
  thermal: {
    title: 'Thermal Throttling Detected',
    message: 'Your CPU is reducing clock speed due to heat. Common causes: blocked vents, high ambient temperature, or sustained heavy load.',
    fix: 'Elevate the PC for airflow. If this recurs, clean the vents or consider reapplying thermal paste.',
  },
  power_battery: {
    title: 'Power Throttling (Battery)',
    message: 'Windows is limiting CPU speed to preserve battery life. This is normal behavior on battery power.',
    fix: 'Plug in your charger to restore full CPU performance.',
  },
  power_plugged: {
    title: 'Power Throttling (Plugged In)',
    message: 'CPU is running below rated speed despite being plugged in. This may indicate a weak/mismatched charger or restrictive power plan.',
    fix: 'Check that your charger matches your PC\'s wattage requirement. Switch power plan to "High Performance" in Windows settings.',
  },
  both: {
    title: 'Combined Thermal + Power Throttle',
    message: 'CPU is throttling due to heat AND power limits simultaneously. Performance is severely reduced.',
    fix: 'Plug in to full-wattage charger, move to a cooler location, and close heavy background apps immediately.',
  },
};

function getCurrentThrottleStatus() {
  const latest = db.getLatestCpuSample();
  if (!latest) {
    return {
      status: 'unknown',
      type: null,
      severity: null,
      currentSpeedGHz: null,
      ratedMaxGHz: null,
      speedLossPct: null,
      currentTempC: null,
      isOnBattery: null,
      message: 'Collecting CPU data... (updates every 30 seconds)',
      recommendation: null,
      since: null,
    };
  }

  const isThrottling = latest.throttle_type !== null;
  const speedLoss = latest.speed_max_ghz > 0
    ? Math.round((1 - latest.speed_ghz / latest.speed_max_ghz) * 100)
    : 0;

  let rec = null;
  if (isThrottling) {
    if (latest.throttle_type === 'both') {
      rec = RECOMMENDATIONS.both;
    } else if (latest.throttle_type === 'thermal') {
      rec = RECOMMENDATIONS.thermal;
    } else if (latest.throttle_type === 'power') {
      rec = latest.is_on_battery
        ? RECOMMENDATIONS.power_battery
        : RECOMMENDATIONS.power_plugged;
    }
  }

  // Find when this throttle started (if active)
  let since = null;
  if (isThrottling) {
    const activeEvent = db.getActiveThrottleEvent();
    if (activeEvent) since = activeEvent.started_at;
  }

  return {
    status: isThrottling ? 'throttling' : 'ok',
    type: latest.throttle_type,
    severity: latest.throttle_severity,
    currentSpeedGHz: latest.speed_ghz,
    ratedMaxGHz: latest.speed_max_ghz,
    speedLossPct: speedLoss,
    currentTempC: latest.temp_main,
    isOnBattery: latest.is_on_battery === 1,
    message: isThrottling
      ? `CPU is ${latest.throttle_type} throttling — running at ${100 - speedLoss}% of rated speed`
      : `CPU running normally at ${latest.speed_ghz} GHz`,
    recommendation: rec,
    since,
  };
}

function getThrottleHistory(minutes = 60) {
  const cutoff = Date.now() - (minutes * 60 * 1000);
  const rows = db.getCpuSamplesSince(cutoff);

  // Downsample to max 120 points
  if (rows.length <= 120) return rows;
  const step = Math.ceil(rows.length / 120);
  return rows.filter((_, i) => i % step === 0);
}

function getThrottleEvents(limit = 10) {
  return db.getThrottleEvents(limit);
}

function getThrottleSummary() {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const events = db.getThrottleEventsSince(sevenDaysAgo);

  if (events.length === 0) {
    return {
      totalEvents: 0,
      totalThrottledMinutes: 0,
      mostCommonType: null,
      avgSpeedLossPct: 0,
      worstEvent: null,
      percentTimeThrottled: 0,
    };
  }

  const totalMinutes = events.reduce((s, e) => s + (e.duration_sec || 0), 0) / 60;
  const typeCounts = {};
  let worst = events[0];

  for (const e of events) {
    typeCounts[e.throttle_type] = (typeCounts[e.throttle_type] || 0) + 1;
    if ((e.speed_loss_pct || 0) > (worst.speed_loss_pct || 0)) worst = e;
  }

  const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const avgLoss = events.reduce((s, e) => s + (e.speed_loss_pct || 0), 0) / events.length;
  const totalSevenDayMinutes = 7 * 24 * 60;
  const pctThrottled = (totalMinutes / totalSevenDayMinutes) * 100;

  return {
    totalEvents: events.length,
    totalThrottledMinutes: Math.round(totalMinutes),
    mostCommonType: mostCommon,
    avgSpeedLossPct: Math.round(avgLoss),
    worstEvent: worst,
    percentTimeThrottled: Math.round(pctThrottled * 10) / 10,
    efficiency: getThermalEfficiency(events)
  };
}

function getThermalEfficiency(samples = []) {
  if (!samples.length) return {
    score: 100,
    label: 'Excellent',
    interpretation: 'CPU runs at full speed. AI tasks run optimally.',
    aiImpact: 'AI running at rated performance'
  };
  
  const throttledSamples = samples.filter(s => (s.speed_loss_pct || 0) > 5).length;
  const score = Math.round(100 - (throttledSamples / samples.length) * 100);
  
  return {
    score,
    label: score >= 90 ? 'Excellent'
         : score >= 75 ? 'Good'
         : score >= 50 ? 'Fair'
         : 'Throttling Heavily',
    interpretation: score >= 90
      ? 'CPU runs at full speed. AI tasks run optimally.'
      : score >= 75
      ? 'Minor throttling. AI inference slightly slower.'
      : score >= 50
      ? 'Moderate throttling. Consider a cooling pad.'
      : 'Heavy throttling. AI tasks may run 2-3x slower.',
    aiImpact: score < 100
      ? `AI inference approx. ${Math.round((100/Math.max(1, score) - 1) * 100)}% slower than rated speed`
      : 'AI running at rated performance'
  };
}

module.exports = {
  getCurrentThrottleStatus,
  getThrottleHistory,
  getThrottleEvents,
  getThrottleSummary,
  getThermalEfficiency,
};
