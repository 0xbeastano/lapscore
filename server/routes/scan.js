const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { ingest } = require('../ingest');

const LATEST_SCAN_PATH = path.join(__dirname, '..', '..', 'data', 'scans', 'scan_latest.json');

// POST /ingest
// manually reads scan_latest.json and ingests it
router.post('/ingest', (req, res) => {
  if (!fs.existsSync(LATEST_SCAN_PATH)) {
    return res.status(404).json({ error: "No scan file found" });
  }
  
  try {
    const rawData = fs.readFileSync(LATEST_SCAN_PATH, 'utf-8').replace(/^\uFEFF/, '');
    const jsonData = JSON.parse(rawData);
    // Ignore db unique constraint error on same scan ID manually processing
    const scanRow = ingest(jsonData);
    res.json({ success: true, scanId: scanRow.id, message: "Scan ingested" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /latest
// returns the latest scan row from SQLite
router.get('/latest', (req, res) => {
  try {
    const scanRow = db.getLatestScan();
    if (!scanRow) {
      return res.status(404).json({ error: "No scans yet" });
    }
    
    const rawData = JSON.parse(scanRow.raw_json);
    const { scoreScan } = require('../scorer');
    
    const scores = scoreScan(rawData);
    const recommendations = db.getIssuesByScanId(scanRow.id);

    res.json({
      scan: scanRow,
      scores: scores,
      recommendations: recommendations,
      raw: rawData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history
// returns getScanHistory() result array
router.get('/history', (req, res) => {
  try {
    const scans = db.getScanHistory();
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id
// returns getScanById(id)
router.get('/:id', (req, res) => {
  try {
    const scanRow = db.getScanById(req.params.id);
    if (!scanRow) {
      return res.status(404).json({ error: "Scan not found" });
    }
    res.json(scanRow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /run
// triggers a new scan natively and responds with JSON
router.post('/run', async (req, res) => {
  try {
    const { runScan } = require('../collector');
    const scanData = await runScan();
    const scanRow = ingest(scanData);
    res.json({ success: true, scanId: (scanRow && scanRow.id ? scanRow.id : null), data: scanData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /trigger (Quick Scan from Tray)
router.get('/trigger', async (req, res) => {
  try {
    const { runScan } = require('../collector');
    const scanData = await runScan();
    const scanRow = ingest(scanData);
    res.json({ success: true, score: scanData.scores?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
