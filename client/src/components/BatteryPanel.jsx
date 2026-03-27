import { Battery, Zap, History, ShieldCheck, Calendar, Info, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import Skeleton from './ui/Skeleton';
import { useEffect, useState } from 'react';

export default function BatteryPanel({ battery, health, isScanning = false }) {
  if (!battery) return null;

  const [animHealth, setAnimHealth] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);

  const healthVal = (() => {
    const wp = battery?.wearPercent;
    const fc = battery?.FullChargeCapacity;
    const dc = battery?.DesignCapacity;
    if (wp != null && !isNaN(wp)) {
      const health = Math.round(100 - wp);
      return Math.max(0, Math.min(100, health));
    }
    if (fc && dc) return Math.round((fc / dc) * 100);
    return null;
  })();

  const intel = battery?.cycleIntel;

  useEffect(() => {
    if (healthVal == null) return;
    let start = null;
    const target = healthVal;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimHealth(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [healthVal]);

  const getHealthStatus = (h) => {
    if (h == null) return { status: 'neutral', label: 'Unknown' };
    if (h >= 80) return { status: 'good',     label: `${h}% Good` };
    if (h >= 60) return { status: 'warning',  label: `${h}% Aging` };
    return             { status: 'critical',  label: `${h}% Replace` };
  };

  const healthStatus = getHealthStatus(healthVal);

  return (
    <Card className="h-full flex flex-col" accent="from-emerald-500/40 via-blue-500/40 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
            <Battery size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#f1f5f9] tracking-tighter uppercase">Battery Health</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Cell Intelligence & Age</p>
          </div>
        </div>
        <StatusBadge status={healthStatus.status} label={healthStatus.label} pulse={healthStatus.status === 'critical'} />
      </div>

      <div className="px-6 py-4 flex-1 flex flex-col space-y-8">
        {/* Animated Health Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Life Capacity</span>
            <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{isScanning ? '...' : `${healthVal ?? '—'}%`}</span>
          </div>
          <div className="h-4 w-full bg-[#16162a] rounded-full overflow-hidden border border-[#1e1e38] shadow-inner relative">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${isScanning ? 0 : (animHealth ?? 0)}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 shadow-[0_0_8px_white]" />
            </div>
          </div>
          <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest pt-1 px-1">
            <span>CRITICAL</span>
            <span>AGING</span>
            <span>HEALTHY</span>
          </div>
        </div>

        {/* CYCLE INTELLIGENCE SUB-SECTION */}
        {intel && (
          <div className="bg-[#16162a] border border-[#1e1e38] rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1e1e38] pb-3 mb-2">
              <div className="flex items-center gap-2">
                <History size={14} className="text-emerald-500" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Cycle Intelligence</h4>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                intel.zone.status === 'good' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                intel.zone.status === 'warning' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                'text-red-400 border-red-500/20 bg-red-500/10'
              }`}>
                {intel.zone.label}
              </span>
            </div>

            <div className="battery-detail-grid grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Used</p>
                <p className="text-sm font-black text-white">{intel.cycleCount} <span className="text-[10px] text-gray-500">CYCLES</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Remaining</p>
                <p className="text-sm font-black text-emerald-400">{intel.cyclesRemaining} <span className="text-[10px] text-gray-500">LEFT</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Design Life</p>
                <p className="text-sm font-black text-gray-400">{intel.designLife} <span className="text-[10px] text-gray-500">TOTAL</span></p>
              </div>
            </div>

            {/* CYCLE GAUGE — Segmented Bar */}
            <div className="space-y-4">
              <div className="relative pt-4">
                {/* Marker */}
                <div 
                  className="absolute top-0 transition-all duration-1000 ease-out z-10 flex flex-col items-center"
                  style={{ left: `${(intel.cycleCount / intel.designLife) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                {/* Segments */}
                <div className="h-3 w-full bg-[#080810] rounded-sm flex overflow-hidden border border-[#1e1e38]">
                  {intel.ranges.map((range, idx) => {
                    const width = ((range.to - range.from) / intel.designLife) * 100;
                    const isCurrent = intel.cycleCount >= range.from && intel.cycleCount < range.to;
                    return (
                      <div 
                        key={idx}
                        className="h-full border-r border-[#080810]/50 transition-all"
                        style={{ 
                          width: `${width}%`, 
                          backgroundColor: range.color,
                          opacity: isCurrent ? 1 : 0.3,
                          boxShadow: isCurrent ? `0 0 12px ${range.color}66` : 'none'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-tighter">
                <span>PRIME</span>
                <span>HEALTHY</span>
                <span>MODERATE</span>
                <span>AGING</span>
                <span>DEGRADED</span>
              </div>
              <div className="flex justify-between text-[10px] tabular-nums font-bold text-[#475569] px-0.5">
                {intel.ranges.map(r => r.from).concat([intel.designLife]).map(v => <span key={v}>{v}</span>)}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-[#080810]/40 p-3 rounded-xl border border-[#1e1e38]">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{intel.zone.desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#080810]/40 p-3 rounded-xl border border-[#1e1e38] flex items-center gap-3">
                   <Calendar size={16} className={intel.estimatedLifeRemainingYears > 1 ? 'text-emerald-500' : 'text-amber-500'} />
                   <div>
                     <p className={`text-xs font-black ${intel.estimatedLifeRemainingYears > 2 ? 'text-emerald-400' : intel.estimatedLifeRemainingYears > 1 ? 'text-amber-400' : 'text-red-400'}`}>
                       ~{intel.estimatedLifeRemainingYears} years
                     </p>
                     <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Est. Life Left</p>
                   </div>
                </div>
                <div className="bg-[#080810]/40 p-3 rounded-xl border border-[#1e1e38] flex items-center gap-3">
                   <Zap size={16} className="text-blue-500" />
                   <div>
                     <p className="text-xs font-black text-blue-400">{intel.chemistry}</p>
                     <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Chemistry</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BEST PRACTICES SECTION */}
        <div className="border border-[#1e1e38] rounded-xl overflow-hidden bg-[#16162a]/30">
          <button 
            onClick={() => setTipsOpen(!tipsOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#16162a]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Battery Care Tips</span>
            </div>
            {tipsOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
          </button>
          
          {tipsOpen && (
            <div className="p-4 pt-0 grid grid-cols-1 gap-2 animate-fadeIn">
              {[
                { type: 'good', text: 'Keep charge between 20-80% for longer life' },
                { type: 'good', text: 'Avoid full 0→100% charge cycles daily' },
                { type: 'good', text: 'Keep cool — heat degrades cells fastest' },
                { type: 'warn', text: 'Avoid leave plugged in at 100% always' },
                { type: 'warn', text: 'Avoid draining to 0% regularly' }
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {tip.type === 'good' ? <Check size={12} className="text-emerald-500 mt-1 shrink-0" /> : <X size={12} className="text-amber-500 mt-1 shrink-0" />}
                  <span className="text-[11px] text-gray-400 font-medium leading-relaxed">{tip.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-between items-center px-6">
        <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase">Method: {battery.CycleCountMethod || 'Reported'}</span>
        <span className="text-[9px] text-emerald-500 font-bold tracking-widest uppercase">{battery.isCharging ? '⚡ CHARGING' : 'USE MODE'}</span>
      </div>
    </Card>
  );
}
