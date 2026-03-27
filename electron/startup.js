const { app } = require('electron');

/**
 * Checks if the application is set to open at login.
 * @returns {boolean}
 */
function getAutoStartEnabled() {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
}

/**
 * Enables or disables auto-start at login for Windows.
 * @param {boolean} enable 
 */
function setAutoStart(enable) {
  // On Windows, this creates/deletes a registry entry in HKCU\Software\Microsoft\Windows\CurrentVersion\Run
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true, // starts minimized/in tray
    path: process.execPath,
    args: ['--hidden'] // Flag to detect startup launch
  });
}

module.exports = {
  getAutoStartEnabled,
  setAutoStart
};
