const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { getAutoStartEnabled, setAutoStart } = require('./startup');

let tray = null;

const createTray = (win, getScore) => {
  if (tray) return tray;

  const trayIconPath = path.join(
    app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'),
    'assets', 'tray-icon.png'
  );
  
  const trayIcon = nativeImage.createFromPath(trayIconPath);
  tray = new Tray(trayIcon);
  tray.setToolTip('LapScore — Health Monitor');

  const updateMenu = (score) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Score: ${score != null ? score : '—'}/100`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open LapScore',
        click: () => {
          win.show();
          win.focus();
        },
      },
      {
        label: 'Scan Now',
        click: () => {
          // Trigger a scan via HTTP call to the API:
          const req = http.get('http://localhost:7821/api/scan/trigger', (res) => {
             res.resume().on('end', () => console.log('Scan triggered from tray.'));
          }).on('error', (err) => console.error('Tray scan trigger failed:', err.message));
        },
      },
      { type: 'separator' },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: getAutoStartEnabled(),
        click: (item) => setAutoStart(item.checked),
      },
      { type: 'separator' },
      {
        label: 'Quit LapScore',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
  };

  const updateTrayIcon = (score) => {
    if (score == null) return;
    const variant = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'critical';
    const variantPath = path.join(
      app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'),
      'assets', `tray-${variant}.png`
    );
    if (fs.existsSync(variantPath)) {
      tray.setImage(nativeImage.createFromPath(variantPath));
    }
  };

  setInterval(() => {
    const score = getScore();
    updateMenu(score);
    updateTrayIcon(score);
  }, 30000);

  const initialScore = getScore();
  updateMenu(initialScore);
  updateTrayIcon(initialScore);

  tray.on('double-click', () => {
    win.show();
    win.focus();
  });

  return tray;
};

module.exports = { createTray };
