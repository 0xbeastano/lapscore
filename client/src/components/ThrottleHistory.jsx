import { useState, useEffect } from 'react';
import { fetchThrottleHistory, fetchThrottleEvents, fetchThrottleSummary } from '../api';
import { Clock, Activity, Flame, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine
} from 'recharts';

const TIME_RANGES = [
  { label: '1H', minutes: 60 },
  { label: '6H', minutes: 360 },
  { label: '24H', minutes: 1440 },
];

export default function ThrottleHistory() {
  const [activeTab, setActiveTab] = useState('speed');
  const [timeRange, setTimeRange] = useState(60);
  const [historyData, setHistoryData] = useState([]);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (activeTab === 'speed') {
          const h = await fetchThrottleHistory(timeRange);
          setHistoryData(h || []);
        } else {
          const [ev, sum] = await Promise.all([
            fetchThrottleEvents(10),
            fetchThrottleSummary(),
          ]);
          setEvents(ev || []);
          setSummary(sum || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTab, timeRange]);

  const formatTick = (ts) => {
    const d = new Date(ts);
    return timeRange <= 60
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const SpeedTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#111] border border-[#333] p-3 rounded-lg shadow-xl text-sm">
          <p className="text-gray-400 mb-1 font-medium text-xs">{new Date(label).toLocaleTimeString()}</p>
          <p className="text-blue-400 font-bold text-xs">Speed: {p.speed_ghz} GHz</p>
          {p.temp_main && <p className="text-orange-400 font-bold text-xs">Temp: {p.temp_main}°C</p>}
          <p className="text-gray-400 font-bold text-xs">Load: {p.load_pct}%</p>
          {p.throttle_type && (
            <p className={`text-[10px] mt-1 font-black uppercase tracking-widest ${
              p.throttle_type === 'thermal' ? 'text-red-500' : 'text-amber-500'
            }`}>⚠ {p.throttle_type} throttle</p>
          )}
        </div>
      );
    }
    return null;
  };

  const typeIcon = (type) => {
    if (type === 'thermal') return <Flame size={14} className="text-red-500" />;
    if (type === 'power') return <Zap size={14} className="text-amber-500" />;
    if (type === 'both') return <ShieldAlert size={14} className="text-red-500" />;
    return null;
  };

  const severityBadge = (sev) => {
    const colors = {
      mild: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      moderate: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      severe: 'bg-red-500/10 text-red-500 border-red-500/30',
    };
    return (
      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${colors[sev] || 'text-gray-500'}`}>
        {sev}
      </span>
    );
  };

  // Find throttle zones for reference areas
  const throttleZones = [];
  let zoneStart = null;
  for (let i = 0; i < historyData.length; i++) {
    const row = historyData[i];
    if (row.throttle_type && !zoneStart) {
      zoneStart = { idx: i, type: row.throttle_type };
    } else if (!row.throttle_type && zoneStart) {
      throttleZones.push({ ...zoneStart, endIdx: i - 1 });
      zoneStart = null;
    }
  }
  if (zoneStart) throttleZones.push({ ...zoneStart, endIdx: historyData.length - 1 });

  const maxGHz = historyData.length > 0
    ? Math.max(...historyData.map(r => r.speed_max_ghz || 0), ...historyData.map(r => r.speed_ghz || 0)) + 0.5
    : 5;

  return (
    <div id="throttle-history" className="w-full bg-[#0a0a0a] border border-[#222] rounded-3xl p-6 lg:p-8 shadow-xl">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
            <Clock className="text-blue-500" size={20} />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">Throttle History</h3>
        </div>

        <div className="flex items-center bg-[#111] p-1 rounded-xl border border-[#222]">
          <button
            onClick={() => setActiveTab('speed')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'speed' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Activity size={14} />
            <span>Speed</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'events' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Flame size={14} />
            <span>Events</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Speed History */}
      {activeTab === 'speed' && (
        <>
          <div className="flex justify-end mb-4 space-x-2">
            {TIME_RANGES.map(tr => (
              <button
                key={tr.minutes}
                onClick={() => setTimeRange(tr.minutes)}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${
                  timeRange === tr.minutes
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'border-[#333] text-gray-500 hover:text-white'
                }`}
              >{tr.label}</button>
            ))}
            {loading && <div className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin self-center" />}
          </div>

          {historyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px] bg-[#111] border border-dashed border-[#1a1a1a] rounded-2xl">
              <Activity className="text-gray-700 mb-4" size={32} />
              <p className="text-sm font-bold text-gray-400">No speed data for this range yet.</p>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">Collecting every 30 seconds</p>
            </div>
          ) : (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTick}
                    stroke="#444"
                    fontSize={10}
                    tickMargin={10}
                    axisLine={{ stroke: '#222' }}
                  />
                  <YAxis
                    domain={[0, maxGHz]}
                    tickCount={6}
                    tickFormatter={(v) => `${v.toFixed(1)}`}
                    stroke="#444"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<SpeedTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />

                  {/* Throttle zones as colored bands */}
                  {throttleZones.map((zone, i) => (
                    <ReferenceArea
                      key={i}
                      x1={historyData[zone.idx]?.timestamp}
                      x2={historyData[zone.endIdx]?.timestamp}
                      y1={0}
                      y2={maxGHz}
                      fill={zone.type === 'thermal' || zone.type === 'both' ? '#ef4444' : '#f59e0b'}
                      fillOpacity={0.08}
                      stroke="none"
                    />
                  ))}

                  {/* Rated max reference line */}
                  {historyData[0]?.speed_max_ghz && (
                    <ReferenceLine
                      y={historyData[0].speed_max_ghz}
                      stroke="#333"
                      strokeDasharray="4 4"
                      label={{ value: 'Rated Max', position: 'right', fill: '#555', fontSize: 10 }}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="speed_ghz"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center mt-2 space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Clock Speed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-[#333] rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #555 0 4px, transparent 4px 8px)' }} />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rated Max</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded bg-red-500/20" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Throttle Zone</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Throttle Events */}
      {activeTab === 'events' && (
        <>
          {/* Summary bar */}
          {summary && summary.totalEvents > 0 && (
            <div className="flex items-center space-x-4 bg-[#111] border border-[#222] p-4 rounded-2xl mb-6">
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-white">{summary.totalEvents}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Events (7d)</p>
              </div>
              <div className="w-px h-10 bg-[#222]" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-amber-500">{summary.totalThrottledMinutes}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Min Throttled</p>
              </div>
              <div className="w-px h-10 bg-[#222]" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-red-500">{summary.avgSpeedLossPct}%</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Avg Loss</p>
              </div>
              <div className="w-px h-10 bg-[#222]" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-gray-300">{summary.percentTimeThrottled}%</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Time %</p>
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[180px] bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="text-emerald-500 mb-3" size={28} />
              <p className="text-sm font-bold text-emerald-400">No throttle events detected yet.</p>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Data appears after 30+ minutes of monitoring</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <span>When</span>
                <span>Duration</span>
                <span>Type</span>
                <span>Severity</span>
                <span className="text-right">Speed Loss</span>
              </div>

              {events.map((ev, i) => {
                const when = new Date(ev.started_at);
                const durMin = ev.duration_sec ? Math.round(ev.duration_sec / 60) : null;
                return (
                  <div key={ev.id || i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#111] border border-[#222] px-4 py-3 rounded-xl hover:border-[#333] transition-colors items-center">
                    <div className="text-xs text-gray-300 font-medium">
                      {when.toLocaleDateString([], { month: 'short', day: 'numeric' })} {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs font-bold text-gray-400">
                      {durMin != null ? `${durMin}m` : 'Ongoing...'}
                    </div>
                    <div className="flex items-center space-x-2">
                      {typeIcon(ev.throttle_type)}
                      <span className="text-xs font-bold text-gray-300 capitalize">{ev.throttle_type}</span>
                    </div>
                    <div>{severityBadge(ev.severity)}</div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${(ev.speed_loss_pct || 0) > 30 ? 'text-red-500' : 'text-amber-500'}`}>
                        {ev.speed_loss_pct || 0}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
