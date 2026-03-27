const { autoUpdater } = require('electron-updater');

/**
 * Sets up silent auto-update checking against GitHub Releases.
 * Downloads in background, notifies React frontend when ready.
 * @param {BrowserWindow} win - The main application window
 */
function setupUpdater(win) {
  // Don't run auto-updater in dev mode
  if (!require('electron').app.isPackaged) {
    console.log('[Updater] Skipping in dev mode.');
    return;
  }

  // Disable auto-download — let user confirm
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // ── Check on startup ──────────────────────────────────────
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[Updater] Initial check failed:', err.message);
  });

  // ── Re-check every 4 hours ────────────────────────────────
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 4 * 60 * 60 * 1000);

  // ── Events ────────────────────────────────────────────────
  autoUpdater.on('update-available', (info) => {
    console.log(`[Updater] Update available: v${info.version}`);

    // Notify the React frontend via IPC
    if (win && !win.isDestroyed()) {
      win.webContents.send('update-available', {
        version: info.version,
        notes: info.releaseNotes || '',
      });
    }

    // Auto-download in background
    autoUpdater.downloadUpdate().catch((err) => {
      console.error('[Updater] Download failed:', err.message);
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] App is up to date.');
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent);
    console.log(`[Updater] Downloading: ${pct}%`);
    if (win && !win.isDestroyed()) {
      win.webContents.send('update-progress', { percent: pct });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[Updater] Update downloaded: v${info.version}`);

    if (win && !win.isDestroyed()) {
      win.webContents.send('update-ready', {
        version: info.version,
      });
    }
  });

  autoUpdater.on('error', (err) => {
    // Silent fail — don't crash app over update issues
    console.error('[Updater] Error:', err.message);
  });
}

/**
 * Quit the app and install the downloaded update.
 */
function installUpdate() {
  autoUpdater.quitAndInstall(false, true);
}

module.exports = { setupUpdater, installUpdate };
