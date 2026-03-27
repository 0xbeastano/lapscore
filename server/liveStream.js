const { WebSocketServer } = require('ws');
const si = require('systeminformation');

let wss = null;
let intervalId = null;

function start(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    // We don't really need to do anything on connection other than wait for the interval to push data
    ws.on('error', console.error);
  });

  // 3-second interval
  intervalId = setInterval(async () => {
    // Only collect and broadcast if at least 1 client is connected
    if (!wss || wss.clients.size === 0) return;

    try {
      const [cpu, currentLoad, mem, battery, diskIO, netStats] = await Promise.all([
        si.cpu(),
        si.currentLoad(),
        si.mem(),
        si.battery(),
        si.disksIO(),
        si.networkStats(),
      ]);

      let tempMain = null;
      let fans = [];
      try {
        const thermal = await si.cpuTemperature();
        tempMain = thermal.main || null;
        fans = thermal.socket || [];
      } catch (e) {}

      // Disk IO
      let readMBs = null;
      let writeMBs = null;
      if (diskIO && diskIO.rIO_sec >= 0) {
        readMBs = (diskIO.rIO_sec * 512 / 1e6).toFixed(1);
        writeMBs = (diskIO.wIO_sec * 512 / 1e6).toFixed(1);
      }

      // Network stats
      let primaryNet = netStats ? netStats.find(n => n.operstate === 'up' && n.rx_sec > 0) : null;
      if (!primaryNet && netStats && netStats.length > 0) {
        primaryNet = netStats[0];
      }
      
      let rxMBs = null;
      let txMBs = null;
      if (primaryNet && typeof primaryNet.rx_sec === 'number') {
        rxMBs = (primaryNet.rx_sec / 1e6).toFixed(2);
        txMBs = (primaryNet.tx_sec / 1e6).toFixed(2);
      }

      const payload = {
        type: 'live_tick',
        ts: Date.now(),
        cpu: {
          loadPct: Math.round(currentLoad.currentLoad),
          currentSpeedGHz: cpu.speed,
          tempMain,
          fans
        },
        ram: {
          usedPct: Math.round((mem.active / mem.total) * 100),
          usedGB: (mem.active / 1e9).toFixed(1),
          totalGB: (mem.total / 1e9).toFixed(1)
        },
        battery: {
          percent: battery.percent,
          isCharging: battery.isCharging,
          powerConsumption: battery.powerConsumption || null
        },
        disk: {
          readMBs,
          writeMBs
        },
        network: {
          rxMBs,
          txMBs,
        }
      };

      const msg = JSON.stringify(payload);
      for (const client of wss.clients) {
        if (client.readyState === 1) { // OPEN
          client.send(msg);
        }
      }
    } catch (e) {
      console.warn('[LiveStream] Error collecting live tick:', e.message);
    }
  }, 3000);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (wss) {
    wss.close();
    wss = null;
  }
}

function emitAlert(alert) {
  if (!wss || wss.clients.size === 0) return;
  const msg = JSON.stringify({ type: 'critical_alert', ...alert });
  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  }
}

module.exports = { start, stop, emitAlert };
