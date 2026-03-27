const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /trend
router.get('/trend', (req, res) => {
  try {
    const trend = db.getBatteryTrend();
    const filtered = trend.map(t => ({
      timestamp: t.timestamp,
      health_pct: t.health_pct,
      cycle_count: t.cycle_count
    }));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
