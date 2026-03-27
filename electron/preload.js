const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // ── Window Controls ──────────────────────────────────────────
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),

  // ── App Info ─────────────────────────────────────────────────
  getAppVersion: () => ipcRenderer.invoke('get-version'),
  isMaximized:   () => ipcRenderer.invoke('is-maximized'),

  // ── Notifications ────────────────────────────────────────────
  sendNotification: (data) => ipcRenderer.send('send-notification', data),

  // ── Update Notifications ─────────────────────────────────────
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (_event, info) => callback(info));
  },
  onUpdateReady: (callback) => {
    ipcRenderer.on('update-ready', (_event, info) => callback(info));
  },
  installUpdate: () => ipcRenderer.send('install-update'),

  // ── Platform Detection ───────────────────────────────────────
  platform: process.platform,
});
