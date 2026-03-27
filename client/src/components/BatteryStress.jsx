import { TrendingUp, Activity, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';

export default function BatteryStress({ latest, history }) {
  if (!history || history.length === 0) return null;

  const getStatus = (volt) => {
    if (volt > 16) return { status: 'healthy', label: 'Nominal' };
    if (volt > 14) return { status: 'good', label: 'Optimal' };
    return { status: 'warning', label: 'Low Voltage' };
  };

  const currentVolt = latest?.Voltage || 0;
  const status = getStatus(currentVolt);

  return (
    <Card className="h-full flex flex-col" accent="from-purple-500/40 via-blue-500/40 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Stress Radar</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Voltage Stability & Jitter</p>
          </div>
        </div>
        <StatusBadge status={status.status} label={status.label} />
      </div>

      <div className="px-6 py-4 flex-1 space-y-6">
        <div className="flex justify-between items-end mb-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Live Output</span>
            <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{currentVolt}V</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Discharge Rate</span>
            <span className="text-sm font-black text-blue-400 tabular-nums">{latest?.ChargeRate || 0} mW</span>
          </div>
        </div>

        <div className="h-44 w-full bg-[#080810] border border-[#1e1e38] rounded-xl overflow-hidden p-2 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="voltsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip 
                contentStyle={{ background: '#111', border: '1px solid #333', fontSize: '10px', color: '#fff' }}
                itemStyle={{ color: '#7c3aed' }}
              />
              <Area 
                type="monotone" 
                dataKey="voltage" 
                stroke="#7c3aed" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#voltsGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#16162a]/50 p-3 rounded-xl border border-[#1e1e38] flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Low</span>
            <span className="text-xs font-black text-gray-300">11.4V</span>
          </div>
          <div className="bg-[#16162a]/50 p-3 rounded-xl border border-[#1e1e38] flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Peak</span>
            <span className="text-xs font-black text-gray-300">14.2V</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
        <span className="text-gray-600">Jitter: 0.05mV RMS</span>
        <button className="text-purple-500 hover:text-white transition-colors flex items-center gap-1.5 group font-black">
          <TrendingUp size={12} className="group-hover:translate-x-0.5 transition-transform" /> DETAILS
        </button>
      </div>
    </Card>
  );
}
