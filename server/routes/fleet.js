const express = require('express');
const router = express.Router();
const fleet = require('../fleetDiscovery');
const axios = require('axios');

// GET /peers
// Returns all discovered peers on the network
router.get('/peers', (req, res) => {
  const peers = fleet.getPeers();
  const onlineCount = peers.filter(p => p.online).length;
  res.json({
    peers: peers,
    onlineCount: onlineCount,
    ts: Date.now()
  });
});

// GET /peers/:ip
// Proxy request to the peer to get its full dashboard data
router.get('/peers/:ip', async (req, res) => {
  const { ip } = req.params;
  const port = 7821; // Standard LapScore port
  
  try {
    // We fetch the latest scan from the remote machine directly
    const response = await axios.get(`http://${ip}:${port}/api/scan/latest`, { timeout: 3000 });
    res.json(response.data);
  } catch (err) {
    console.error(`[Fleet] Failed to reach peer at ${ip}:`, err.message);
    res.status(504).json({ error: `Could not connect to peer at ${ip}` });
  }
});

module.exports = router;
