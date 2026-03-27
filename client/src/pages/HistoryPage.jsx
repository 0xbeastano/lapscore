import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TopNav } from '../components/TopNav';
import { ArrowLeft, Download, TrendingUp, Calendar, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch('/api/score/history').then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {});
  }, []);

  const gradeColor = (g) => {
    if (g === 'A') return '#22c55e';
    if (g === 'B') return '#84cc16';
    if (g === 'C') return '#eab308';
    if (g === 'D') return '#f97316';
    return '#ef4444';
  };

  const chartData = history.map(h => ({
    ...h,
    date: new Date(h.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: new Date(h.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }));

  const exportCSV = () => {
    const headers = 'Timestamp,Score,Grade,Battery,CPU Load,RAM Used,Issues\n';
    const rows = history.map(h =>
      `${new Date(h.ts).toISOString()},${h.score},${h.grade},${h.batteryHealth || ''},${h.cpuLoad || ''},${h.ramUsed || ''},${h.issueCount || 0}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lapscore-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#111] border border-[#333] rounded-xl p-3 shadow-2xl text-xs space-y-1">
          <p className="text-white font-black">{d.date} {d.time}</p>
          <p className="text-gray-400">Score: <span className="text-white font-bold">{d.score}</span> ({d.grade})</p>
          {d.batteryHealth != null && <p className="text-gray-400">Battery: <span className="text-emerald-400">{d.batteryHealth}%</span></p>}
          {d.cpuLoad != null && <p className="text-gray-400">CPU: <span className="text-blue-400">{d.cpuLoad}%</span></p>}
          {d.ramUsed != null && <p className="text-gray-400">RAM: <span className="text-pink-400">{d.ramUsed}%</span></p>}
          {d.issueCount > 0 && <p className="text-red-400 font-bold">{d.issueCount} issue(s)</p>}
          {d.topIssue && <p className="text-amber-400 text-[10px]">{d.topIssue}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#080810] min-h-screen text-white font-sans pb-24">
      <TopNav />
      <div className="relative z-10 pt-24 px-4 sm:px-6 lg:px-12 max-w-[1200px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-lg bg-[#16162a] border border-[#1e1e38] hover:border-purple-500/40 transition-colors">
              <ArrowLeft size={18} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Scan History</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">{history.length} scans recorded</p>
            </div>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#16162a] border border-[#1e1e38] rounded-lg hover:border-purple-500/40 transition-colors text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-white">
            <Download size={14} className="text-purple-500" />
            Export CSV
          </button>
        </div>

        {/* Area Chart */}
        {chartData.length > 1 && (
          <div className="bg-[#0f0f1e] border border-[#1e1e38] rounded-[24px] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={18} className="text-purple-500" />
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Score Trend</h2>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={30} />
                  <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.3} />
                  <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.3} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} fill="url(#scoreGrad)" animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Scan Log Table */}
        <div className="bg-[#0f0f1e] border border-[#1e1e38] rounded-[24px] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 p-6 pb-4">
            <Calendar size={18} className="text-blue-500" />
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Scan Log</h2>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-3 text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-[#1e1e38]">
            <span>Date / Time</span>
            <span className="text-center">Score</span>
            <span className="text-center">Grade</span>
            <span className="text-center">Issues</span>
            <span className="text-center">Battery</span>
            <span className="text-center">CPU</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#1e1e38]">
            {[...history].reverse().map((h, i) => {
              const d = new Date(h.ts);
              const isExpanded = expanded === i;
              return (
                <div key={i}>
                  <div 
                    className={`grid grid-cols-6 gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-[#16162a]/50 ${i % 2 === 0 ? 'bg-[#0a0a14]' : ''}`}
                    onClick={() => setExpanded(isExpanded ? null : i)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown size={12} className="text-purple-500" /> : <ChevronRight size={12} className="text-gray-600" />}
                      <div>
                        <span className="text-xs font-bold text-gray-200">{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span className="text-[10px] text-gray-600 font-bold ml-2">{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span className="text-center text-sm font-black text-white tabular-nums">{h.score}</span>
                    <div className="flex justify-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black" style={{ color: gradeColor(h.grade), backgroundColor: `${gradeColor(h.grade)}15` }}>{h.grade}</span>
                    </div>
                    <div className="flex justify-center items-center">
                      {h.issueCount > 0 ? (
                        <span className="flex items-center gap-1 text-red-500 text-[10px] font-black"><AlertTriangle size={10} />{h.issueCount}</span>
                      ) : (
                        <span className="text-emerald-500 text-[10px] font-black">0</span>
                      )}
                    </div>
                    <span className="text-center text-xs font-bold text-gray-300 tabular-nums">{h.batteryHealth != null ? `${h.batteryHealth}%` : '—'}</span>
                    <span className="text-center text-xs font-bold text-gray-300 tabular-nums">{h.cpuLoad != null ? `${h.cpuLoad}%` : '—'}</span>
                  </div>
                  
                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-[#16162a]/40 border-t border-[#1e1e38] space-y-2 animate-fadeIn">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-gray-500 font-bold">RAM:</span> <span className="text-gray-200 font-bold">{h.ramUsed != null ? `${h.ramUsed}%` : 'N/A'}</span></div>
                        <div><span className="text-gray-500 font-bold">Score:</span> <span className="text-white font-black">{h.score}/100</span></div>
                        <div><span className="text-gray-500 font-bold">Grade:</span> <span className="font-black" style={{ color: gradeColor(h.grade) }}>{h.grade}</span></div>
                      </div>
                      {h.topIssue && (
                        <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                          <AlertTriangle size={12} className="text-red-500" />
                          <span className="text-[11px] text-red-400 font-bold">{h.topIssue}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
