import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';

export default function LiveGraph({ data, metric, label, color = '#7c3aed', unit = '', maxValue = 100, customValue = null }) {
  if (!data || data.length === 0) return null;

  // Resolved nested path support (e.g., 'cpu.loadPct')
  const getVal = (obj, path) => path.split('.').reduce((o, i) => o?.[i], obj);
  
  const points = data.map(p => ({
    time: p.timestamp,
    val: getVal(p, metric) ?? 0
  }));

  const latest = points[points.length - 1]?.val ?? 0;
  
  // Dynamic color based on thresholds
  let liveColor = color;
  if (latest > 85) liveColor = '#ef4444';
  else if (latest > 65) liveColor = '#f59e0b';

  return (
    <div className="bg-[#0f0f1e] border border-[#1e1e38] rounded-xl p-4 flex flex-col h-full group hover:border-[#2d2d50] hover:-translate-y-1 transition-all duration-300 shadow-lg relative overflow-hidden">
      {/* Background Glow */}
      <div 
        className="absolute bottom-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 pointer-events-none"
        style={{ background: liveColor }}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse-ring"
            style={{ background: liveColor }}
          />
          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-end space-x-1 tabular-nums">
          {customValue !== null ? (
            <span className="text-xl font-black text-white tracking-tighter" style={{ color: latest > 65 ? liveColor : 'white' }}>
              {customValue}
            </span>
          ) : (
            <>
              <span className="text-xl font-black text-white tracking-tighter" style={{ color: latest > 65 ? liveColor : 'white' }}>
                {Math.round(latest)}
              </span>
              <span className="text-[10px] text-gray-600 font-bold mb-1">{unit}</span>
            </>
          )}
        </div>
      </div>

      <div className="h-20 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points}>
            <defs>
              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={liveColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={liveColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={[0, maxValue]} hide />
            <Tooltip 
              contentStyle={{ background: '#111', border: '1px solid #333', fontSize: '10px', color: '#fff', padding: '4px' }}
              itemStyle={{ color: liveColor }}
              labelStyle={{ display: 'none' }}
            />
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke={liveColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#grad-${metric})`}
              isAnimationActive={false}
              filter={`drop-shadow(0 0 4px ${liveColor}66)`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
