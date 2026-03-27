export const requestPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const notify = (title, body, severity = 'info') => {
  // Use native Electron notification if available
  if (window.electron?.sendNotification) {
    window.electron.sendNotification({ title, body, severity });
    return;
  }

  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const icons = {
    critical: '/icon-red.png',
    warning: '/icon-amber.png',
    info: '/icon-blue.png'
  };

  try {
    new Notification(title, {
      body,
      icon: icons[severity] || '/icon.png',
      tag: `lapscore-${severity}`, // prevents duplicates of same severity
      requireInteraction: severity === 'critical'
    });
  } catch (err) {
    console.warn('[OS Notify] Failed to send notification:', err);
  }
};
