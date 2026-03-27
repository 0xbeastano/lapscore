const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, Notification } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { createTray } = require('./tray');
const { setupUpdater, installUpdate } = require('./updater');

// ── Globals ──────────────────────────────────────────────────
let mainWindow = null;
let splashWindow = null;
let tray = null;
let serverProcess = null;

const SERVER_PORT = 7821;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const isDev = !app.isPackaged;
let currentScore = null;

// ── Data Directory (AppData in production) ───────────────────
function getDataDir() {
  if (app.isPackaged) {
    const dir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Ensure scans subdirectory exists
    const scansDir = path.join(dir, 'scans');
    if (!fs.existsSync(scansDir)) fs.mkdirSync(scansDir, { recursive: true });
    return dir;
  }
  return path.join(__dirname, '..', 'data');
}

// ── 1. Start the backend Node server ─────────────────────────
function startServer() {
  const serverPath = path.join(__dirname, '..', 'server', 'index.js');

  // Use system Node.js (not Electron's embedded Node) to avoid native module ABI mismatch
  // better-sqlite3 is compiled for system Node, not Electron's Node
  const { spawn } = require('child_process');
  
  const nodePath = process.env.SYSTEM_NODE || 'node';
  
  serverProcess = spawn(nodePath, [serverPath], {
    env: {
      ...process.env,
      AUTO_OPEN: 'false',
      ELECTRON: 'true',
      LAPSCORE_DATA_DIR: getDataDir(),
      CLIENT_DIST_PATH: isDev 
        ? path.join(__dirname, '..', 'client', 'dist')
        : path.join(process.resourcesPath, 'client', 'dist'),
    },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,           // Don't show cmd window on Windows
  });

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.on('exit', (code) => {
    console.log(`[Server] Process exited with code ${code}`);
    if (!app.isQuitting && code !== 0) {
      console.log('[Server] Restarting crashed server...');
      setTimeout(startServer, 2000);
    }
  });
}

// ── 2. Wait for server to be ready ───────────────────────────
function waitForServer(timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = setInterval(() => {
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(check);
        reject(new Error('Server startup timed out'));
        return;
      }

      const req = http.get(`${SERVER_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(check);
          resolve();
        }
        res.resume(); // Consume response to free memory
      });

      req.on('error', () => {
        // Server not ready yet — keep polling
      });

      req.setTimeout(1000, () => req.destroy());
    }, 500);
  });
}

// ── Splash Screen ────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 340,
    height: 220,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

function createWindow() {
  const iconPath = path.join(
    app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'),
    'assets', 'icon.ico'
  );

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#080810',
    icon: iconPath,
    show: false,                  // Don't show until ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  // ── CSP Security ──────────────────────────────────────────
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:* ws://localhost:*;" + 
          "img-src 'self' data: blob:;" + 
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" + 
          "font-src 'self' https://fonts.gstatic.com;"
        ]
      }
    });
  });

  mainWindow.loadURL(SERVER_URL);

  // Show window only when content is painted (no white flash)
  mainWindow.once('ready-to-show', () => {
    closeSplash();

    // If launched with --hidden, don't show the window initially
    if (!process.argv.includes('--hidden')) {
      mainWindow.show();
    }
    
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Periodically update the taskbar badge with the latest score/status
  setInterval(updateTaskbarBadge, 60000);
  updateTaskbarBadge();

  // ── 4. Handle window close → minimize to tray ──────────────
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Taskbar Badge ────────────────────────────────────────────-
function updateTaskbarBadge() {
  if (!mainWindow) return;

  fetchLatestScore().then(score => {
    currentScore = score;
    if (score == null) return;
    
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
    const svg = `
      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="8" fill="${color}"/>
        <text x="8" y="11.5" text-anchor="middle" font-size="${score >= 100 ? '7' : '8'}" font-family="Arial, sans-serif" font-weight="bold" fill="white">
          ${score}
        </text>
      </svg>
    `;
    
    const badge = nativeImage.createFromDataURL(
      `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
    );
    
    mainWindow.setOverlayIcon(badge, `Health Score: ${score}`);
  }).catch(() => {});
}

async function fetchLatestScore() {
  return new Promise((resolve) => {
    http.get(`${SERVER_URL}/api/scan/latest`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.scores?.total || 0);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// ── IPC Handlers (window controls from React) ────────────────
function setupIPC() {
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) {
      mainWindow.hide(); // hide to tray, don't quit
    }
  });

  ipcMain.on('send-notification', (event, { title, body, severity }) => {
    const iconPath = path.join(__dirname, '..', 'assets', `tray-${severity || 'good'}.png`);
    
    const notification = new Notification({
      title,
      body,
      icon: nativeImage.createFromPath(iconPath),
      silent: false,
    });

    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    notification.show();
  });

  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Auto-updater: user clicked "Install Update" in the UI
  ipcMain.on('install-update', () => {
    installUpdate();
  });
}

// ── App Lifecycle ────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log('[Electron] Starting LapScore desktop app...');

  // Show splash screen while server starts
  createSplash();

  // Start the backend server
  startServer();

  // Set up IPC before window creation
  setupIPC();

  // Wait until server is accepting connections
  try {
    console.log('[Electron] Waiting for server to be ready...');
    await waitForServer();
    console.log('[Electron] Server is ready!');
  } catch (err) {
    console.error('[Electron] Server failed to start:', err.message);
    closeSplash();
  }

  createWindow();
  tray = createTray(mainWindow, () => currentScore);

  // Set up auto-updater (only runs in production)
  setupUpdater(mainWindow);
});

// macOS: re-create window when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Clean shutdown
app.on('before-quit', () => {
  app.isQuitting = true;
  if (serverProcess) {
    console.log('[Electron] Shutting down server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
});

app.on('window-all-closed', (e) => {
  // Don't quit — keep the server and tray running in background
  e.preventDefault();
});
