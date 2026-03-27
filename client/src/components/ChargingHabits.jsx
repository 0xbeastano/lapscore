import React from 'react';
import { Activity, Thermometer, Zap, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import { useData } from '../context/DataContext';

export default function ChargingHabits() {
  const { scan } = useData();
  const data = scan?.batteryAnalytics;
  if (!data?.habits) return null;

  const { habits, cycleStats } = data;
  const { coaching, avgCeiling, avgFloor, hotChargeMinutes, pattern } = habits;

  return (
    <Card className="h-full flex flex-col" accent="from-emerald-500/40 via-purple-500/40 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Charging Habits</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Behavioral Life Extension</p>
          </div>
        </div>
        <StatusBadge status="healthy" label={pattern} pulse />
      </div>

      <div className="px-6 py-4 flex-1 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Avg Ceiling', val: `${avgCeiling}%`, color: avgCeiling > 90 ? 'text-amber-500' : 'text-emerald-500' },
            { label: 'Avg Floor', val: `${avgFloor}%`, color: avgFloor < 20 ? 'text-amber-500' : 'text-emerald-500' },
            { label: 'Hot Charge', val: `${hotChargeMinutes}m`, color: 'text-white' },
            { label: 'Cycles', val: cycleStats?.estimatedFullCycles || 0, color: 'text-blue-400' }
          ].map((m, i) => (
            <div key={i} className="bg-[#16162a]/50 border border-[#1e1e38] p-4 rounded-xl flex flex-col items-center">
              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">{m.label}</span>
              <span className={`text-xl font-black tabular-nums tracking-tighter ${m.color}`}>{m.val}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 border-b border-[#1e1e38] pb-1.5 flex items-center gap-2">
            <Zap size={10} /> Longevity Coach Suggestions
          </h4>
          
          {coaching.length === 0 ? (
            <div className="flex items-center space-x-4 bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              <p className="text-xs text-gray-300 font-medium leading-relaxed">
                Perfect habits! Your charging pattern is optimized for maximum cell longevity. No immediate changes needed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coaching.map((msg, idx) => (
                <div key={idx} className={`flex items-start space-x-4 p-4 rounded-xl border animate-slide-in-right ${
                  msg.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-[#16162a] border-[#1e1e38]'
                }`} style={{ animationDelay: `${idx * 100}ms` }}>
                  <AlertCircle className={msg.severity === 'critical' ? 'text-red-500 shrink-0 mt-0.5' : 'text-amber-500 shrink-0 mt-0.5'} size={18} />
                  <div>
                    <p className="text-[10px] text-gray-200 font-black mb-1 uppercase tracking-wide">
                      {msg.type} Analysis Result
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-[#080810]/50 border-t border-[#1e1e38] text-center">
        <button className="flex items-center justify-center space-x-2 w-full text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-[0.2em] group">
          <span>Complete Usage History</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
}
