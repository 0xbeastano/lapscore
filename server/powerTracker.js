const si = require('systeminformation');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.LAPSCORE_DATA_DIR || path.join(__dirname, '..', 'data');
const POWER_LOG_FILE = path.join(DATA_DIR, 'power_log.json');

const estimateWatts = (cpuLoad) => {
  const baseTDP = 15; // Ryzen 5 5600H: 15W TDP base
  const maxTDP = 45; // boost TDP
  const loadFactor = cpuLoad / 100;
  const estimatedWatts = baseTDP + (maxTDP - baseTDP) * loadFactor;
  return Math.round(estimatedWatts * 10) / 10;
};

let dailyWhUsed = 0;
let tariffRate = 8;
let currency = 'INR';

function ensurePowerLogDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(POWER_LOG_FILE)) fs.writeFileSync(POWER_LOG_FILE, JSON.stringify([], null, 2));
}

function getLog() {
  ensurePowerLogDir();
  try {
    const data = fs.readFileSync(POWER_LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) { return []; }
}

function saveLog(entry) {
  const log = getLog();
  const dateStr = new Date().toISOString().split('T')[0];
  const idx = log.findIndex(e => e.date === dateStr);
  if (idx !== -1) {
    log[idx] = entry;
  } else {
    log.unshift(entry);
  }
  fs.writeFileSync(POWER_LOG_FILE, JSON.stringify(log.slice(0, 30), null, 2));
}

async function updatePower() {
  try {
    const load = await si.currentLoad();
    const cpuLoad = load.currentLoad;
    const watts = estimateWatts(cpuLoad);
    
    // Wh accumulated in 1 minute (sampling frequency)
    const whAccumulated = (watts * (60 / 3600));
    dailyWhUsed += whAccumulated;

    const dateStr = new Date().toISOString().split('T')[0];
    const log = getLog();
    const today = log.find(e => e.date === dateStr) || { date: dateStr, whUsed: 0, cost: 0, peakLoad: 0 };
    
    today.whUsed += whAccumulated;
    today.cost = (today.whUsed / 1000) * tariffRate;
    today.peakLoad = Math.max(today.peakLoad, cpuLoad);
    
    saveLog(today);
  } catch (err) {
    console.error(`[Power] Tracking error: ${err.message}`);
  }
}

function getStats() {
  const log = getLog();
  const today = log[0] || { whUsed: 0, cost: 0 };
  const week = log.slice(0, 7).reduce((acc, e) => ({ whUsed: acc.whUsed + e.whUsed, cost: acc.cost + e.cost }), { whUsed: 0, cost: 0 });
  const month = log.slice(0, 30).reduce((acc, e) => ({ whUsed: acc.whUsed + e.whUsed, cost: acc.cost + e.cost }), { whUsed: 0, cost: 0 });

  return {
    todayWh: Math.round(today.whUsed),
    todayCost: parseFloat(today.cost.toFixed(2)),
    weekWh: Math.round(week.whUsed),
    weekCost: parseFloat(week.cost.toFixed(2)),
    monthWh: Math.round(month.whUsed),
    monthCost: parseFloat(month.cost.toFixed(2)),
    currency,
    ratePerKwh: tariffRate
  };
}

function setTariff(rate, curr) {
  tariffRate = rate || 8;
  currency = curr || 'INR';
}

// Update every minute
setInterval(updatePower, 60000);

module.exports = { getStats, setTariff, estimateWatts };
