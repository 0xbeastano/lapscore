import axios from 'axios';

const BASE = "";

function handleError(err) {
  if (err.response && err.response.status === 404) {
    return null;
  }
  if (!err.response && err.message === 'Network Error') {
    throw new Error("LapScore server not reachable. Is the server running?");
  }
  throw new Error(err.response?.data?.error || err.message);
}

export async function fetchLatestScan() {
  try {
    const res = await axios.get(`${BASE}/api/scan/latest`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchBatteryIntelligence() {
  try {
    const res = await axios.get(`${BASE}/api/battery/intelligence`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchBatterySamples(limit = 60) {
  try {
    const res = await axios.get(`${BASE}/api/battery/samples?limit=${limit}`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchScanHistory() {
  try {
    const res = await axios.get(`${BASE}/api/scan/history`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchBatteryTrend() {
  try {
    const res = await axios.get(`${BASE}/api/battery/trend`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchScanById(id) {
  try {
    const res = await axios.get(`${BASE}/api/scan/${id}`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function triggerExport() {
  try {
    const res = await axios.get(`${BASE}/api/export/json`, { responseType: 'blob' });
    return res.data;
  } catch (err) {
    throw new Error("Export failed");
  }
}

// ── CPU Throttle Radar APIs ──────────────────────────────────

export async function fetchThrottleStatus() {
  try {
    const res = await axios.get(`${BASE}/api/cpu/throttle/status`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchThrottleHistory(minutes = 60) {
  try {
    const res = await axios.get(`${BASE}/api/cpu/throttle/history?minutes=${minutes}`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchThrottleEvents(limit = 10) {
  try {
    const res = await axios.get(`${BASE}/api/cpu/throttle/events?limit=${limit}`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchThrottleSummary() {
  try {
    const res = await axios.get(`${BASE}/api/cpu/throttle/summary`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function killProcess(pid, name) {
  try {
    const res = await axios.post(`${BASE}/api/process/kill`, { pid, name });
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 403) {
      throw new Error(err.response.data.error);
    }
    throw new Error(err.response?.data?.error || err.message);
  }
}

// ── Disk SMART API ───────────────────────────────────────────

export async function fetchDiskSmart() {
  try {
    const res = await axios.get(`${BASE}/api/disk/smart`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ── Fleet API ────────────────────────────────────────────────

export async function fetchPeers() {
  try {
    const res = await axios.get(`${BASE}/api/fleet/peers`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchPeerDetails(ip) {
  try {
    const res = await axios.get(`${BASE}/api/fleet/peers/${ip}`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchDeviceSummary(id) {
  try {
    const res = await axios.get(`${BASE}/api/devices/${id}/summary`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ── Report API ────────────────────────────────────────────────

export async function generateReport() {
  try {
    const res = await axios.post(`${BASE}/api/report/generate`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ── Phase 3 APIs ─────────────────────────────────────────────

export async function fetchScoreHistory() {
  try {
    const res = await axios.get(`${BASE}/api/score/history`);
    return res.data;
  } catch (err) {
    return { history: [] };
  }
}

export async function fetchActiveAlerts() {
  try {
    const res = await axios.get(`${BASE}/api/alerts/active`);
    return res.data;
  } catch (err) {
    return { alerts: [] };
  }
}

export async function dismissAlert(id) {
  try {
    const res = await axios.post(`${BASE}/api/alerts/${id}/dismiss`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function fetchRamProcesses() {
  try {
    const res = await axios.get(`${BASE}/api/ram/processes`);
    return res.data;
  } catch (err) {
    return [];
  }
}

export async function fetchSchedulerStatus() {
  try {
    const res = await axios.get(`${BASE}/api/scheduler/status`);
    return res.data;
  } catch (err) {
    return { enabled: false };
  }
}

export async function enableScheduler(intervalMinutes = 60) {
  try {
    const res = await axios.post(`${BASE}/api/scheduler/enable`, { intervalMinutes });
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function disableScheduler() {
  try {
    const res = await axios.post(`${BASE}/api/scheduler/disable`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ── AI ERA FEATURES ─────────────────────────────────────────

export async function fetchAISessions() {
  try {
    const res = await axios.get(`${BASE}/api/ai/sessions`);
    return res.data;
  } catch (err) {
    return { active: null, history: [] };
  }
}

export async function fetchAIRamCalculator() {
  try {
    const res = await axios.get(`${BASE}/api/ai/ram-calculator`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ── POWER TRACKING ──────────────────────────────────────────

export async function fetchPowerStats() {
  try {
    const res = await axios.get(`${BASE}/api/power/stats`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function setPowerTariff(ratePerKwh, currency) {
  try {
    const res = await axios.post(`${BASE}/api/power/set-tariff`, { ratePerKwh, currency });
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

// ── SETTINGS API ─────────────────────────────────────────────

export async function fetchSettings() {
  try {
    const res = await axios.get(`${BASE}/api/settings`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function saveSettings(settings) {
  try {
    const res = await axios.post(`${BASE}/api/settings`, settings);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}

export async function saveSettingsSection(section, data) {
  try {
    const res = await axios.post(`${BASE}/api/settings/${section}`, data);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
}
