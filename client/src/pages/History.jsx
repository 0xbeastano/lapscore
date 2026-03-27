import { useState, useEffect } from 'react';
import { fetchScanHistory, fetchBatteryTrend } from '../api';
import { TopNav } from '../components/TopNav';
import { BarChart2, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../utils/time';

export function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const h = await fetchScanHistory();
        if (h) setHistory(h);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <TopNav />
        <div className="flex h-screen items-center justify-center pt-14">
          <div className="w-8 h-8 border-4 border-[#333] border-t-white rounded-full spin-anim" />
        </div>
      </div>
    );
  }

  const formatTick = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-[#333] p-3 rounded-lg shadow-xl text-xs font-bold font-sans">
          <p className="text-gray-400 mb-1">{new Date(label).toLocaleString()}</p>
          <p className="text-white text-base">Score: <span className="text-blue-500">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  const getGradeColor = (g) => {
    switch (g) {
      case 'A': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50';
      case 'B': return 'bg-lime-500/20 text-lime-400 border-lime-500/50';
      case 'C': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'D': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'F': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white font-sans overflow-x-hidden">
      <TopNav />
      <div className="pt-24 pb-16 px-6 lg:px-12 max-w-7xl mx-auto space-y-10 animate-fade-in-1">
        
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white">Scan History</h1>
          <p className="text-sm font-medium text-gray-500">Track your local PC health progression over time.</p>
        </div>

        {history.length <= 1 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-lg my-12">
            <BarChart2 size={48} className="text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-300 mb-2">No scan history yet</h2>
            <p className="text-xs font-medium text-gray-500 max-w-md leading-relaxed">Run lapscore.ps1 regularly to build a health trend over time. We recommend weekly scans to catch battery wear and phantom power requests early.</p>
          </div>
        )}

        {history.length > 1 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-lg">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">Health Score Over Time</h2>
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...history].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatTick} stroke="#555" fontSize={10} tickMargin={10} axisLine={{ stroke: '#333' }} />
                  <YAxis domain={[40, 100]} stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
                  <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: 'Excellent', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine y={60} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideBottomLeft', value: 'Fair', fill: '#eab308', fontSize: 10, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="score_total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#111', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff' }} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-[#16161a] border-b border-[#222] px-6 py-4">
              <h2 className="text-sm font-bold text-white tracking-wide">All Scans</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#0a0a0a] text-[10px] uppercase font-black tracking-widest text-gray-500 border-b border-[#2a2a2a]">
                    <th className="py-4 px-6 border-r border-[#1a1a1a]">Date</th>
                    <th className="py-4 px-6 border-r border-[#1a1a1a]">Device</th>
                    <th className="py-4 px-6 border-r border-[#1a1a1a] text-center">Score</th>
                    <th className="py-4 px-6 border-r border-[#1a1a1a] text-center">Issues</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {history.map((s, i) => {
                    const d = new Date(s.timestamp);
                    const isLatest = i === 0;
                    return (
                      <tr key={s.id} onClick={() => navigate(`/report/${s.id}`)} className="bg-[#111] hover:bg-[#1a1a2e] transition-colors border-b border-[#222] cursor-pointer group">
                        <td className="py-5 px-6 font-medium text-gray-300">
                          <div className="flex items-center space-x-3">
                            <span>{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isLatest && <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest border border-blue-500/30">Latest</span>}
                          </div>
                        </td>
                        <td className="py-5 px-6 font-bold text-white text-xs tracking-wide">{s.device_model || 'Unknown Device'}</td>
                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-lg font-black text-white">{Math.round(s.score_total)}<span className="text-xs text-gray-500 font-bold">/100</span></span>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border shadow-inner ${getGradeColor(s.grade)}`}>{s.grade}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center space-x-3">
                            <span className={`text-[11px] font-bold px-2 py-1 rounded ${s.issue_count_critical > 0 ? 'bg-red-500/10 text-red-500' : 'text-emerald-500'}`}>{s.issue_count_critical} Crit</span>
                            <span className={`text-[11px] font-bold px-2 py-1 rounded ${s.issue_count_warning > 0 ? 'bg-yellow-500/10 text-yellow-500' : 'text-emerald-500'}`}>{s.issue_count_warning} Warn</span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center align-middle">
                          <div className="flex justify-center">
                            <button className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 group-hover:text-white transition-colors border border-blue-500/30 group-hover:border-blue-400/80 group-hover:bg-blue-500/20 px-3 py-1.5 rounded-md">
                              <span>View Report</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-[#0a0a0a] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-600 border-t border-[#222]">
              {history.length} scans recorded since {new Date(history[history.length-1].timestamp).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
         <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-4 px-6 md:px-12 w-full mt-auto flex flex-col sm:flex-row items-center justify-between z-10 bottom-0 relative text-[10px] uppercase font-bold tracking-widest text-[#555]">
           <span>LapScore v1.0 · Free PC Monitoring System</span>
           <span>Last scan: {timeAgo(history[0].timestamp)}</span>
         </div>
      )}
    </div>
  );
}
