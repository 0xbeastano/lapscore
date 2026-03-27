const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.LAPSCORE_DATA_DIR || path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  monitoring: {
    autoScanIntervalMin: 60,
    backgroundPolling: true
  },
  alerts: {
    cpu: { warn: 70, critical: 90 },
    ram: { warn: 80, critical: 90 },
    battery: { warn: 40, critical: 20 },
    temp: { warn: 75, critical: 85 },
    disk: { warn: 85, critical: 95 }
  },
  power: {
    ratePerKwh: 8.00,
    currency: "INR"
  },
  battery: {
    chemistry: "auto",
    customDesignLife: null
  },
  aiMonitoring: {
    enabled: true,
    processList: ["ollama", "lmstudio", "llama-server", "python", "llamafile"]
  },
  notifications: {
    os: true,
    critical: true,
    warning: true,
    autoScan: false
  },
  fleet: {
    discoveryEnabled: true,
    broadcastPort: 7822
  }
};

let settings = { ...DEFAULT_SETTINGS };

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      // Deep merge with defaults to ensure all fields exist
      settings = mergeDeep(DEFAULT_SETTINGS, data);
    } else {
      saveSettings(DEFAULT_SETTINGS);
    }
  } catch (err) {
    console.error('[Settings] Failed to load settings:', err.message);
  }
  return settings;
}

function saveSettings(newSettings) {
  try {
    settings = { ...settings, ...newSettings };
    const dataDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (err) {
    console.error('[Settings] Failed to save settings:', err.message);
    return false;
  }
}

function getSettings() {
  return settings;
}

function updateSection(section, data) {
  if (settings[section]) {
    settings[section] = { ...settings[section], ...data };
    saveSettings(settings);
    return true;
  }
  return false;
}

// Helper for deep merging objects
function mergeDeep(target, source) {
  const isObject = obj => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = sourceValue;
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = mergeDeep({ ...targetValue }, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}

// Initial load
loadSettings();

module.exports = {
  getSettings,
  saveSettings,
  updateSection,
  loadSettings
};
