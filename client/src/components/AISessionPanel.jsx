import { useState, useEffect } from 'react';
import { Bot, Cpu, Database, BatteryCharging, Clock, History } from 'lucide-react';
import { fetchAISessions } from '../api';

export default function AISessionPanel() {
  const [sessions, setSessions] = useState({ active: null, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetchAISessions().then(d => {
        setSessions(d);
        setLoading(false);
      });
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (loading && !sessions.active) return null;

  const active = sessions.active;
  const last = sessions.history[0];

  return (
    <div className="space-y-4">
      {active ? (
        <div className="relative overflow-hidden bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 transition-all duration-500 animate-pulse-subtle shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot size={24} className="text-emerald-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  AI Session Active <span className="bg-emerald-500 text-[10px] px-1.5 py-0.5 rounded text-white animate-pulse">LIVE</span>
                </h4>
                <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">{active.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-500">
              <Clock size={14} />
              <span className="text-sm font-black tabular-nums">{active.durationMin}m</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/10 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest">CPU LOAD</span>
                <span className="text-xs font-black text-white">{active.peakCpuPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${active.peakCpuPct}%` }} />
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/10 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest">RAM USAGE</span>
                <span className="text-xs font-black text-white">{active.peakRamGB.toFixed(1)} GB</span>
              </div>
              <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((active.peakRamGB / 16) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
            <div className="flex items-center gap-3">
              <BatteryCharging size={16} className="text-emerald-500" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Battery Drain</span>
            </div>
            <span className="text-xs font-black text-emerald-400">~3% consumed so far</span>
          </div>
        </div>
      ) : last ? (
        <div className="bg-[#16162a]/50 border border-[#1e1e38] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bot size={20} className="text-gray-500" />
              <div>
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Last AI Session</h4>
                <p className="text-xs font-black text-white">{last.model}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(last.startTs).toLocaleDateString()}</p>
              <p className="text-xs font-black text-gray-300">{last.durationMin} min</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Cpu, label: 'CPU', val: `${last.peakCpuPct}%` },
              { icon: Database, label: 'RAM', val: `${last.peakRamGB}GB` },
              { icon: BatteryCharging, label: 'BATT', val: `${last.batteryDrained}%` },
              { icon: History, label: 'POWER', val: `${last.estimatedWhUsed}Wh` },
            ].map((m, i) => (
              <div key={i} className="bg-[#080810]/40 border border-[#1e1e38] p-2 rounded-lg text-center">
                <span className="text-[8px] text-gray-600 font-black uppercase block mb-1">{m.label}</span>
                <span className="text-[10px] font-black text-gray-300">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
