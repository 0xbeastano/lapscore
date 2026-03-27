import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export default function ScoreSparkline({ latestScore, ringColor }) {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    fetch('/api/score/history').then(r => r.json()).then(d => {
      const data = d.history || [];
      if (data.length > 0) {
        setHistory(data.slice(-7));
      }
    }).catch(() => {});
  }, [latestScore]); // Re-fetch on scan

  if (history.length < 2) return <div className="h-[64px]" />;

  const current = history[history.length - 1]?.score || 0;
  const prev = history[history.length - 2]?.score || 0;
  const diff = current - prev;
  
  let text = "→ No change";
  let color = "text-gray-500";
  if (diff > 0) {
    text = `↑ +${diff} pts from last scan`;
    color = "text-emerald-500";
  } else if (diff < 0) {
    text = `↓ ${diff} pts from last scan`;
    color = "text-red-500";
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const ts = new Date(payload[0].payload.ts);
      const dateStr = ts.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return (
        <div className="bg-[#111] border border-[#222] px-2 py-1 rounded shadow-lg text-[10px] text-gray-300 font-bold whitespace-nowrap z-50">
          {dateStr} &mdash; Score: <span className="text-white font-black">{payload[0].value}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center mt-6 mb-2">
      <div className="w-[200px] h-[40px] opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ringColor} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={ringColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Area type="monotone" dataKey="score" stroke={ringColor} fillOpacity={1} fill="url(#sparkGradient)" strokeWidth={2} isAnimationActive={true} animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span className={`text-[11px] font-black uppercase tracking-widest mt-2 ${color}`}>
        {text}
      </span>
    </div>
  );
}
