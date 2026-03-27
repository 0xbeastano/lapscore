export function timeAgo(isoString) {
  if (!isoString) return "just now";
  const date = new Date(isoString);
  const now = new Date();
  const elapsed = Math.floor((now - date) / 1000);

  if (elapsed < 60) return "just now";
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)} minutes ago`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)} hours ago`;
  if (elapsed < 172800) return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
