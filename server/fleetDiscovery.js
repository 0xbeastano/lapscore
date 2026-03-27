const dgram = require('dgram');
const os = require('os');

const FLEET_PORT = 7822;
const BROADCAST_INTERVAL = 30000; // 30 seconds

const peers = new Map(); // ip → peerData

const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal)
        return net.address;
    }
  }
  return '127.0.0.1';
};

const startBroadcast = (localScanData) => {
  const socket = dgram.createSocket('udp4');
  
  const broadcast = () => {
    try {
      const raw = localScanData?.raw || localScanData;
      const scores = localScanData?.scores || {};
      
      const payload = JSON.stringify({
        type: 'LAPSCORE_HEARTBEAT',
        version: '1.0',
        hostname: os.hostname(),
        deviceModel: raw?.metadata?.Model || os.hostname(),
        ip: getLocalIP(),
        port: 7821,
        score: scores.total ?? null,
        grade: scores.grade ?? null,
        batteryHealth: raw?.battery?.cycleIntel?.zone?.label ?? null,
        cpuLoad: Math.round(raw?.cpu?.currentLoadPct ?? raw?.cpu?.LoadPercentage ?? 0),
        ramUsed: Math.round(((raw?.ram?.totalBytes - raw?.ram?.freeBytes) / raw?.ram?.totalBytes) * 100) || 0,
        issues: localScanData?.recommendations?.length ?? 0,
        ts: Date.now()
      });
      const buf = Buffer.from(payload);
      socket.send(buf, 0, buf.length, FLEET_PORT, '255.255.255.255');
    } catch (err) {
      console.error('[Fleet] Broadcast error:', err.message);
    }
  };

  socket.bind(() => {
    socket.setBroadcast(true);
    broadcast();
    setInterval(broadcast, BROADCAST_INTERVAL);
  });
  
  return socket;
};

const startListener = () => {
  const socket = dgram.createSocket('udp4');

  socket.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type !== 'LAPSCORE_HEARTBEAT') return;

      peers.set(rinfo.address, {
        ...data,
        ip: rinfo.address,
        lastSeen: Date.now(),
        online: true
      });
    } catch (err) { }
  });

  socket.on('error', (err) => {
    console.error('[Fleet] Listener error:', err.message);
  });

  socket.bind(FLEET_PORT, () => {
    try {
      socket.addMembership('224.0.0.1');
    } catch (e) {
      // Membership might fail on some networks/loopback, but broadcast usually works
    }
    console.log(`[Fleet] Discovery listener active on port ${FLEET_PORT}`);
  });

  // Mark peers offline after 90s of silence
  setInterval(() => {
    const now = Date.now();
    for (const [ip, peer] of peers) {
      peer.online = (now - peer.lastSeen < 90000);
    }
  }, 15000);

  return socket;
};

const getPeers = () => Array.from(peers.values());
const getPeer = (ip) => peers.get(ip);

module.exports = { 
  startBroadcast, 
  startListener,
  getPeers, 
  getPeer 
};
