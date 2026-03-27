const si = require('systeminformation');
const fs = require('fs');
const path = require('path');

const AI_PROCESSES = [
  'ollama', 'ollama_llama_server', 'llama-server', 'llama.cpp',
  'lmstudio', 'lms', 'python', 'python3', 'llamafile'
];

const DATA_DIR = process.env.LAPSCORE_DATA_DIR || path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'ai_sessions.json');

let activeSession = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));
}

function getSessions() {
  ensureDataDir();
  try {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) { return []; }
}

function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift(session);
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions.slice(0, 20), null, 2));
}

async function monitor() {
  try {
    const procs = await si.processes();
    const battery = await si.battery();
    
    // Detect AI active
    const activeAI = procs.list.filter(p => AI_PROCESSES.includes(p.name.toLowerCase()));
    const isAIActive = activeAI.length > 0;

    if (isAIActive) {
      const peakCpu = Math.max(...activeAI.map(p => p.cpu));
      const peakRam = activeAI.reduce((sum, p) => sum + p.memRss, 0) / (1024 * 1024); // GB

      if (!activeSession) {
        // Start Session
        activeSession = {
          model: activeAI[0].name,
          startTs: Date.now(),
          startBattery: battery.percent,
          peakCpuPct: peakCpu,
          peakRamGB: peakRam,
          samples: 1
        };
        console.log(`[AI] Session started: ${activeSession.model}`);
      } else {
        // Update stats
        activeSession.peakCpuPct = Math.max(activeSession.peakCpuPct, peakCpu);
        activeSession.peakRamGB = Math.max(activeSession.peakRamGB, peakRam);
        activeSession.samples++;
      }
    } else if (activeSession) {
      // End Session
      const durationMin = Math.round((Date.now() - activeSession.startTs) / 60000);
      const batteryDrained = activeSession.startBattery - battery.percent;
      
      const session = {
        model: activeSession.model,
        startTs: activeSession.startTs,
        endTs: Date.now(),
        durationMin,
        peakCpuPct: Math.round(activeSession.peakCpuPct),
        peakRamGB: parseFloat(activeSession.peakRamGB.toFixed(1)),
        batteryDrained: Math.max(0, batteryDrained),
        estimatedWhUsed: parseFloat((durationMin * 0.5).toFixed(1)) // heuristic: 0.5Wh/min for active AI
      };
      
      saveSession(session);
      console.log(`[AI] Session ended: ${session.model} (${durationMin} min)`);
      activeSession = null;
    }
  } catch (err) {
    console.warn(`[AI] Monitor error: ${err.message}`);
  }
}

function getActiveSession() {
  if (!activeSession) return null;
  const durationMin = Math.round((Date.now() - activeSession.startTs) / 60000);
  return { ...activeSession, durationMin };
}

// Start interval
setInterval(monitor, 5000);

module.exports = { getSessions, getActiveSession };
