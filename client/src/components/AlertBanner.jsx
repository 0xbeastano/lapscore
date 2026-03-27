import { useState, useEffect } from 'react';
import { X, AlertTriangle, ChevronRight } from 'lucide-react';
import { fetchActiveAlerts, dismissAlert } from '../api';

export default function AlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    const load = () => {
      fetchActiveAlerts().then(d => {
        if (d?.alerts) setAlerts(d.alerts);
      });
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleDismiss = async (id) => {
    setDismissed(prev => new Set([...prev, id]));
    await dismissAlert(id);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 300);
  };

  const scrollToSection = (category) => {
    const map = { cpu: 'throttle-radar', ram: 'ram-section', disk: 'disk-section', battery: 'battery-section' };
    const el = document.getElementById(map[category] || 'throttle-radar');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const visible = alerts.filter(a => !dismissed.has(a.id));
  const shown = visible.slice(0, 3);
  const overflow = visible.length - 3;

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6 animate-fadeInUp">
      {shown.map(alert => {
        const isCritical = alert.severity === 'critical';
        return (
          <div 
            key={alert.id}
            className={`flex items-start justify-between gap-4 px-5 py-4 rounded-xl border transition-all duration-300 ${dismissed.has(alert.id) ? 'opacity-0 -translate-y-2' : 'opacity-100'}`}
            style={{ 
              background: isCritical ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
              borderLeft: `3px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
              borderColor: isCritical ? '#ef444420' : '#f59e0b20'
            }}
          >
            <div className="flex items-start gap-3 flex-1">
              <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="space-y-1">
                <p className={`text-xs font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>{alert.message}</p>
                {alert.fix && <p className="text-[10px] text-gray-500 font-bold">{alert.fix}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => scrollToSection(alert.category)}
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${isCritical ? 'text-red-400 border-red-500/20 hover:bg-red-500/10' : 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'}`}
              >
                Fix <ChevronRight size={10} />
              </button>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
      {overflow > 0 && (
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">and {overflow} more alert{overflow > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
