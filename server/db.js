const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.LAPSCORE_DATA_DIR || path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'lapscore.db');

let db;

function initDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Table 1: scans
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      device_model TEXT,
      os_version TEXT,
      raw_json TEXT,
      score_total REAL,
      score_battery REAL,
      score_power REAL,
      score_cpu REAL,
      score_disk REAL,
      score_drivers REAL,
      grade TEXT,
      issue_count_critical INTEGER,
      issue_count_warning INTEGER
    )
  `);

  // Table 2: issues
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT,
      module TEXT,
      severity TEXT,
      title TEXT,
      impact TEXT,
      fix_type TEXT,
      fix_instruction TEXT,
      resolved INTEGER DEFAULT 0,
      FOREIGN KEY(scan_id) REFERENCES scans(id)
    )
  `);

  // Table 3: battery_history
  db.exec(`
    CREATE TABLE IF NOT EXISTS battery_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT,
      timestamp TEXT,
      health_pct REAL,
      full_charge_mwh INTEGER,
      design_capacity_mwh INTEGER,
      cycle_count INTEGER,
      estimated_runtime_minutes INTEGER
    )
  `);

  // Table 4: battery_samples (New in v2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS battery_samples (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp     INTEGER NOT NULL,
      soc           REAL,
      is_charging   INTEGER,
      voltage_mv    REAL,
      temp_c        REAL,
      time_remaining INTEGER
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_battery_ts ON battery_samples(timestamp DESC)`);

  // Table 5: battery_cycles (New in v2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS battery_cycles (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at    INTEGER NOT NULL,
      ended_at      INTEGER,
      soc_start     REAL,
      soc_end       REAL,
      depth         REAL,
      min_soc       REAL,
      max_soc       REAL,
      charged_to    REAL,
      discharged_to REAL,
      duration_min  INTEGER
    )
  `);

  // Table 6: soh_snapshots (New in v2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS soh_snapshots (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp     INTEGER NOT NULL,
      soh_pct       REAL,
      max_capacity  REAL,
      design_capacity REAL,
      cycle_count_est INTEGER,
      projection_80  TEXT,
      projection_70  TEXT
    )
  `);

  // Table 7: cpu_samples (CPU Throttle Radar)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cpu_samples (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp       INTEGER NOT NULL,
      load_pct        REAL,
      speed_ghz       REAL,
      speed_max_ghz   REAL,
      temp_main       REAL,
      temp_max        REAL,
      is_on_battery   INTEGER,
      throttle_type   TEXT,
      throttle_severity TEXT
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_cpu_ts ON cpu_samples(timestamp DESC)');

  // Table 8: throttle_events
  db.exec(`
    CREATE TABLE IF NOT EXISTS throttle_events (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at      INTEGER NOT NULL,
      ended_at        INTEGER,
      duration_sec    INTEGER,
      throttle_type   TEXT,
      severity        TEXT,
      avg_speed_ghz   REAL,
      rated_speed_ghz REAL,
      speed_loss_pct  REAL,
      max_temp        REAL,
      resolved_reason TEXT
    )
  `);

  // Table 9: disk_smart_snapshots (NVMe Failure Guard)
  db.exec(`
    CREATE TABLE IF NOT EXISTS disk_smart_snapshots (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp       INTEGER NOT NULL,
      device_name     TEXT,
      serial_number   TEXT,
      lifespan_pct    REAL,
      pct_used        REAL,
      available_spare REAL,
      media_errors    INTEGER,
      reallocated     INTEGER,
      temp_c          REAL,
      risk_level      TEXT,
      smart_passed    INTEGER,
      raw_json        TEXT
    )
  `);

  // Table 10: registered_devices (Fleet View)
  db.exec(`
    CREATE TABLE IF NOT EXISTS registered_devices (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id     TEXT UNIQUE NOT NULL,
      hostname      TEXT,
      ip_address    TEXT,
      os_name       TEXT,
      last_seen     INTEGER,
      last_score    REAL,
      last_scan_at  INTEGER,
      is_online     INTEGER DEFAULT 1
    )
  `);
}

function insertScan(scanData) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO scans (
      id, timestamp, device_model, os_version, raw_json,
      score_total, score_battery, score_power, score_cpu,
      score_disk, score_drivers, grade, issue_count_critical, issue_count_warning
    ) VALUES (
      @id, @timestamp, @device_model, @os_version, @raw_json,
      @score_total, @score_battery, @score_power, @score_cpu,
      @score_disk, @score_drivers, @grade, @issue_count_critical, @issue_count_warning
    )
  `);
  stmt.run(scanData);
}

function insertIssues(scanId, issuesArray) {
  const stmt = db.prepare(`
    INSERT INTO issues (
      scan_id, module, severity, title, impact, fix_type, fix_instruction, resolved
    ) VALUES (
      @scan_id, @module, @severity, @title, @impact, @fix_type, @fix_instruction, @resolved
    )
  `);
  
  const insertMany = db.transaction((issues) => {
    for (const issue of issues) {
      issue.scan_id = scanId;
      issue.resolved = issue.resolved || 0;
      stmt.run(issue);
    }
  });
  insertMany(issuesArray);
}

function insertBatteryHistory(scanId, batteryData) {
  const stmt = db.prepare(`
    INSERT INTO battery_history (
      scan_id, timestamp, health_pct, full_charge_mwh, design_capacity_mwh, cycle_count, estimated_runtime_minutes
    ) VALUES (
      @scan_id, @timestamp, @health_pct, @full_charge_mwh, @design_capacity_mwh, @cycle_count, @estimated_runtime_minutes
    )
  `);
  stmt.run({ scan_id: scanId, ...batteryData });
}

function getLatestScan() {
  return db.prepare('SELECT * FROM scans ORDER BY timestamp DESC LIMIT 1').get();
}

function getScanById(id) {
  return db.prepare('SELECT * FROM scans WHERE id = ?').get(id);
}

function getScanHistory() {
  return db.prepare(`
    SELECT id, timestamp, device_model, score_total, grade, issue_count_critical, issue_count_warning 
    FROM scans ORDER BY timestamp DESC
  `).all();
}

function getBatteryTrend() {
  return db.prepare('SELECT * FROM battery_history ORDER BY timestamp ASC').all();
}

function getIssuesByScanId(scanId) {
  return db.prepare('SELECT * FROM issues WHERE scan_id = ?').all(scanId);
}

function insertBatterySample(sample) {
  const stmt = db.prepare(`
    INSERT INTO battery_samples (
      timestamp, soc, is_charging, voltage_mv, temp_c, time_remaining
    ) VALUES (
      @timestamp, @soc, @is_charging, @voltage_mv, @temp_c, @time_remaining
    )
  `);
  return stmt.run(sample);
}

function getBatterySamples(limit = 100) {
  return db.prepare('SELECT * FROM battery_samples ORDER BY timestamp DESC LIMIT ?').all(limit);
}

function pruneBatterySamples(days = 30) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return db.prepare('DELETE FROM battery_samples WHERE timestamp < ?').run(cutoff);
}

function insertBatteryCycle(cycle) {
  const stmt = db.prepare(`
    INSERT INTO battery_cycles (
      started_at, ended_at, soc_start, soc_end, depth, 
      min_soc, max_soc, charged_to, discharged_to, duration_min
    ) VALUES (
      @started_at, @ended_at, @soc_start, @soc_end, @depth,
      @min_soc, @max_soc, @charged_to, @discharged_to, @duration_min
    )
  `);
  return stmt.run(cycle);
}

function getBatteryCycles(limit = 10) {
  return db.prepare('SELECT * FROM battery_cycles ORDER BY started_at DESC LIMIT ?').all(limit);
}

function getCycleCount() {
  const res = db.prepare('SELECT SUM(depth) as total_depth FROM battery_cycles').get();
  return res.total_depth ? (res.total_depth / 100) : 0;
}

function insertSohSnapshot(snap) {
  const stmt = db.prepare(`
    INSERT INTO soh_snapshots (
      timestamp, soh_pct, max_capacity, design_capacity,
      cycle_count_est, projection_80, projection_70
    ) VALUES (
      @timestamp, @soh_pct, @max_capacity, @design_capacity,
      @cycle_count_est, @projection_80, @projection_70
    )
  `);
  return stmt.run(snap);
}

function getLatestSohSnapshot() {
  return db.prepare('SELECT * FROM soh_snapshots ORDER BY timestamp DESC LIMIT 1').get();
}

// ── CPU Throttle Radar helpers ─────────────────────────────
function insertCpuSample(sample) {
  const stmt = db.prepare(`
    INSERT INTO cpu_samples (
      timestamp, load_pct, speed_ghz, speed_max_ghz,
      temp_main, temp_max, is_on_battery,
      throttle_type, throttle_severity
    ) VALUES (
      @timestamp, @load_pct, @speed_ghz, @speed_max_ghz,
      @temp_main, @temp_max, @is_on_battery,
      @throttle_type, @throttle_severity
    )
  `);
  return stmt.run(sample);
}

function getLatestCpuSample() {
  return db.prepare('SELECT * FROM cpu_samples ORDER BY timestamp DESC LIMIT 1').get();
}

function getCpuSamplesSince(cutoffMs) {
  return db.prepare('SELECT * FROM cpu_samples WHERE timestamp >= ? ORDER BY timestamp ASC').all(cutoffMs);
}

function pruneCpuSamples(days = 7) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return db.prepare('DELETE FROM cpu_samples WHERE timestamp < ?').run(cutoff);
}

function insertThrottleEvent(ev) {
  const stmt = db.prepare(`
    INSERT INTO throttle_events (
      started_at, ended_at, duration_sec, throttle_type, severity,
      avg_speed_ghz, rated_speed_ghz, speed_loss_pct, max_temp, resolved_reason
    ) VALUES (
      @started_at, @ended_at, @duration_sec, @throttle_type, @severity,
      @avg_speed_ghz, @rated_speed_ghz, @speed_loss_pct, @max_temp, @resolved_reason
    )
  `);
  return stmt.run(ev);
}

function finalizeThrottleEvent(startedAt, updates) {
  const stmt = db.prepare(`
    UPDATE throttle_events SET
      ended_at = @ended_at,
      duration_sec = @duration_sec,
      avg_speed_ghz = @avg_speed_ghz,
      speed_loss_pct = @speed_loss_pct,
      max_temp = @max_temp,
      resolved_reason = @resolved_reason
    WHERE started_at = @started_at AND ended_at IS NULL
  `);
  return stmt.run({ started_at: startedAt, ...updates });
}

function getActiveThrottleEvent() {
  return db.prepare('SELECT * FROM throttle_events WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1').get();
}

function getThrottleEvents(limit = 10) {
  return db.prepare('SELECT * FROM throttle_events ORDER BY started_at DESC LIMIT ?').all(limit);
}

function getThrottleEventsSince(cutoffMs) {
  return db.prepare('SELECT * FROM throttle_events WHERE started_at >= ? ORDER BY started_at ASC').all(cutoffMs);
}

function pruneThrottleEvents(days = 30) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return db.prepare('DELETE FROM throttle_events WHERE started_at < ?').run(cutoff);
}

module.exports = {
  initDb,
  insertScan,
  insertIssues,
  insertBatteryHistory,
  getLatestScan,
  getScanById,
  getScanHistory,
  getBatteryTrend,
  getIssuesByScanId,
  insertBatterySample,
  getBatterySamples,
  pruneBatterySamples,
  insertBatteryCycle,
  getBatteryCycles,
  getCycleCount,
  insertSohSnapshot,
  getLatestSohSnapshot,
  // CPU Throttle Radar
  insertCpuSample,
  getLatestCpuSample,
  getCpuSamplesSince,
  pruneCpuSamples,
  insertThrottleEvent,
  finalizeThrottleEvent,
  getActiveThrottleEvent,
  getThrottleEvents,
  getThrottleEventsSince,
  pruneThrottleEvents,
  // Disk SMART
  insertDiskSnapshot,
  getLatestDiskSnapshots,
  getLatestDiskSnapshots,
  pruneDiskSnapshots,
  // Fleet Devices
  upsertDevice,
  getAllDevices,
  updateDeviceStatus,
};

// ── Disk SMART helpers ─────────────────────────────────────
function insertDiskSnapshot(snap) {
  const stmt = db.prepare(`
    INSERT INTO disk_smart_snapshots (
      timestamp, device_name, serial_number, lifespan_pct,
      pct_used, available_spare, media_errors, reallocated,
      temp_c, risk_level, smart_passed, raw_json
    ) VALUES (
      @timestamp, @device_name, @serial_number, @lifespan_pct,
      @pct_used, @available_spare, @media_errors, @reallocated,
      @temp_c, @risk_level, @smart_passed, @raw_json
    )
  `);
  return stmt.run(snap);
}

function getLatestDiskSnapshots() {
  return db.prepare(`
    SELECT * FROM disk_smart_snapshots
    WHERE timestamp = (SELECT MAX(timestamp) FROM disk_smart_snapshots)
    ORDER BY device_name ASC
  `).all();
}

function pruneDiskSnapshots(days = 90) {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return db.prepare('DELETE FROM disk_smart_snapshots WHERE timestamp < ?').run(cutoff);
}

// ── Fleet Devices helpers ────────────────────────────────────
function upsertDevice(device) {
  const stmt = db.prepare(`
    INSERT INTO registered_devices (
      device_id, hostname, ip_address, os_name,
      last_seen, last_score, last_scan_at, is_online
    ) VALUES (
      @device_id, @hostname, @ip_address, @os_name,
      @last_seen, @last_score, @last_scan_at, @is_online
    )
    ON CONFLICT(device_id) DO UPDATE SET
      hostname = excluded.hostname,
      ip_address = excluded.ip_address,
      os_name = excluded.os_name,
      last_seen = excluded.last_seen,
      last_score = excluded.last_score,
      last_scan_at = excluded.last_scan_at,
      is_online = excluded.is_online
  `);
  return stmt.run(device);
}

function getAllDevices() {
  return db.prepare('SELECT * FROM registered_devices ORDER BY last_seen DESC').all();
}

function updateDeviceStatus(deviceId, isOnline) {
  return db.prepare('UPDATE registered_devices SET is_online = ? WHERE device_id = ?').run(isOnline ? 1 : 0, deviceId);
}
