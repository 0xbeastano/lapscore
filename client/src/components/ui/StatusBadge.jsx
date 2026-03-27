import React from 'react';

const variants = {
  healthy:  { bg: '#14532d', text: '#22c55e', border: '#166534' },
  good:     { bg: '#14532d', text: '#22c55e', border: '#166534' },
  warning:  { bg: '#451a03', text: '#f59e0b', border: '#78350f' },
  critical: { bg: '#450a0a', text: '#ef4444', border: '#7f1d1d' },
  info:     { bg: '#172554', text: '#3b82f6', border: '#1e3a8a' },
  neutral:  { bg: '#1c1c2e', text: '#6b7280', border: '#374151' },
};

const StatusBadge = ({ status, label, pulse = false, className = '' }) => {
  const v = variants[status] || variants.neutral;
  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-badge)] border text-[10px] font-bold uppercase tracking-wider ${className}`}
      style={{
        background: v.bg,
        color: v.text,
        borderColor: v.border,
      }}
    >
      {pulse && (
        <span 
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: v.text,
            animation: 'pulse-dot 2s infinite'
          }} 
        />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
