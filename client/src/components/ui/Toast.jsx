import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: <Check size={14} />,
  error: <X size={14} />,
  warning: <AlertTriangle size={14} />,
  info: <Info size={14} />
};

const colors = {
  success: { border: '#22c55e', icon: 'text-emerald-500', bg: 'rgba(34,197,94,0.06)' },
  error:   { border: '#ef4444', icon: 'text-red-500',     bg: 'rgba(239,68,68,0.06)' },
  warning: { border: '#f59e0b', icon: 'text-amber-500',   bg: 'rgba(245,158,11,0.06)' },
  info:    { border: '#3b82f6', icon: 'text-blue-500',     bg: 'rgba(59,130,246,0.06)' }
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, visible: true }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 400);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      
      {/* Toast Stack */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
        {toasts.map(toast => {
          const c = colors[toast.type] || colors.info;
          return (
            <div 
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              style={{ 
                borderLeft: `3px solid ${c.border}`, 
                background: '#0f0f1e',
                borderColor: '#1e1e38',
                borderLeftColor: c.border
              }}
            >
              <span className={`mt-0.5 ${c.icon}`}>{icons[toast.type]}</span>
              <span className="text-xs text-gray-200 font-bold">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
