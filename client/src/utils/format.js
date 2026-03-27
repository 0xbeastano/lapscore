export const pct = (n, decimals = 1, showSymbol = true) =>
  n == null || isNaN(n) ? '—' : `${Number(n).toFixed(decimals)}${showSymbol ? '%' : ''}`;

export const ghz = (n) =>
  n == null || isNaN(n) ? '—' : `${Number(n).toFixed(2)} GHz`;

export const gb = (n, fromUnit = 'bytes') => {
  if (n == null || isNaN(n)) return '—';
  let bytes = n;
  if (fromUnit === 'kb') bytes = n * 1024;
  else if (fromUnit === 'mb') bytes = n * 1024 * 1024;
  return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
};

export const temp = (n) =>
  n == null || isNaN(n) ? '—' : `${Math.round(n)}°C`;

export const hours = (mins) => {
  if (mins == null || mins <= 0 || isNaN(mins)) return '—';
  if (mins > 700000) return '—'; // Ignore absurd estimates
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
