import { useState, useEffect, useCallback } from 'react';
import { fetchThrottleStatus, fetchThrottleSummary, killProcess } from '../api';
import { Gauge, Flame, Zap, ShieldAlert, CheckCircle2, Skull, Lock, Loader2, X, Activity, Thermometer } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const PROTECTED_LIST = [
  'system', 'smss.exe', 'csrss.exe', 'wininit.exe', 'winlogon.exe',
  'services.exe', 'lsass.exe', 'svchost.exe', 'explorer.exe',
  'node.exe', 'npm.exe', 'cmd.exe', 'powershell.exe', 'conhost.exe',
  'dwm.exe', 'taskmgr.exe', 'wudfhost.exe', 'fontdrvhost.exe',
];

export default function ThrottleRadar() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [killing, setKilling] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmKill, setConfirmKill] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const [res, summary] = await Promise.all([
        fetchThrottleStatus(),
        fetchThrottleSummary()
      ]);
      if (res) {
        setData(res);
        setSummary(summary);
        // Build mini-history from repeated polls
        setHistory(prev => {
          const next = [...prev, { t: Date.now(), speed: res.currentSpeedGHz, max: res.ratedMaxGHz }];
          if (next.length > 60) next.shift();
          return next;
        });
      }
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => {
    loadStatus();
    const iv = setInterval(loadStatus, 30000);
    return () => clearInterval(iv);
  }, [loadStatus]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleKill = async (pid, name) => {
    setConfirmKill(null);
    setKilling(pid);
    try {
      await killProcess(pid, name);
      setToast({ type: 'success', message: `${name} terminated` });
      loadStatus();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setKilling(null);
    }
  };

  const isProtected = (name) => PROTECTED_LIST.includes(name.toLowerCase());

  // Unknown state — not enough data
  if (!data || data.status === 'unknown') {
    return (
      <div id="throttle-radar" className="w-full bg-[#0a0a0a] border border-[#222] rounded-3xl p-6 lg:p-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gray-500/10 p-3 rounded-2xl border border-gray-500/20">
            <Gauge className="text-gray-500" size={22} />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">CPU Throttle Radar</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-32 bg-[#111] border border-dashed border-[#222] rounded-2xl">
          <Loader2 className="text-gray-600 mb-3 animate-spin" size={28} />
          <p className="text-sm font-bold text-gray-400">Collecting CPU data...</p>
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">Updates every 30 seconds</p>
        </div>
      </div>
    );
  }

  const isThrottling = data.status === 'throttling';
  const speedPct = data.ratedMaxGHz > 0 ? Math.round((data.currentSpeedGHz / data.ratedMaxGHz) * 100) : 100;

  const badgeConfig = {
    thermal: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', icon: Flame, label: 'THERMAL' },
    power: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', icon: Zap, label: 'POWER' },
    both: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', icon: ShieldAlert, label: 'THERMAL + POWER' },
  };

  const badge = isThrottling ? badgeConfig[data.type] || badgeConfig.thermal : null;
  const BadgeIcon = badge?.icon || CheckCircle2;

  const severityColors = {
    mild: 'text-yellow-500',
    moderate: 'text-orange-500',
    severe: 'text-red-500',
  };

  return (
    <div id="throttle-radar" className="w-full bg-[#0a0a0a] border border-[#222] rounded-3xl p-6 lg:p-8 shadow-xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl border shadow-2xl flex items-center space-x-3 animate-fade-in-1 ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span className="text-xs font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Kill confirmation dialog */}
      {confirmKill && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99] flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <Skull className="text-red-500" size={24} />
              <h4 className="text-lg font-black text-white">Kill Process?</h4>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Terminate <span className="text-white font-bold">{confirmKill.name}</span> (PID {confirmKill.pid})?
              This may cause unsaved data loss.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmKill(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-[#333] text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-[#222] transition-colors"
              >Cancel</button>
              <button
                onClick={() => handleKill(confirmKill.pid, confirmKill.name)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
              >Kill</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-2xl border shadow-lg ${isThrottling ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <Gauge className={isThrottling ? 'text-red-500' : 'text-emerald-500'} size={22} />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">CPU Throttle Radar</h3>
        </div>
        {isThrottling ? (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black border tracking-widest uppercase ${badge.bg} ${badge.text} ${badge.border}`}>
            <BadgeIcon size={12} />
            <span>{badge.label}</span>
            {data.severity && <span className={`ml-1 ${severityColors[data.severity]}`}>· {data.severity.toUpperCase()}</span>}
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black border tracking-widest uppercase bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <CheckCircle2 size={12} />
            <span>ALL CLEAR</span>
          </div>
        )}
      </div>

      {/* Speed Stats & Efficiency */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#111] border border-[#222] p-4 rounded-2xl">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Current</p>
          <p className={`text-2xl font-black ${isThrottling ? 'text-red-500' : 'text-emerald-500'}`}>
            {data.currentSpeedGHz?.toFixed(1)} <span className="text-xs text-gray-500">GHz</span>
          </p>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 rounded-2xl">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Rated Max</p>
          <p className="text-2xl font-black text-gray-300">
            {data.ratedMaxGHz?.toFixed(1)} <span className="text-xs text-gray-500">GHz</span>
          </p>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 rounded-2xl">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Avg Loss</p>
          <p className={`text-2xl font-black ${(data.speedLossPct || 0) > 30 ? 'text-red-500' : (data.speedLossPct || 0) > 15 ? 'text-amber-500' : 'text-gray-300'}`}>
            {data.speedLossPct || 0}%
          </p>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 rounded-2xl">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Temperature</p>
          {data.currentTempC != null ? (
            <p className={`text-2xl font-black ${
              data.currentTempC > 80 ? 'text-red-500 animate-pulse' : 
              data.currentTempC >= 60 ? 'text-amber-500' : 
              'text-emerald-500'
            }`}>
              {Math.round(data.currentTempC)}°C
            </p>
          ) : (
            <p className="text-sm font-bold text-gray-600 mt-2">Sensor blocked</p>
          )}
        </div>
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-[#222] p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Activity size={40} className="text-blue-500" />
          </div>
          <p className="text-[8px] text-blue-500 font-black uppercase tracking-[0.2em] mb-1 z-10">Efficiency</p>
          <p className={`text-2xl font-black z-10 ${
            (summary?.efficiency?.score || 100) >= 90 ? 'text-emerald-500' :
            (summary?.efficiency?.score || 100) >= 75 ? 'text-amber-500' :
            'text-red-500'
          }`}>
            {summary?.efficiency?.score || 100}
          </p>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest z-10">
            {summary?.efficiency?.label || 'Optimal'}
          </p>
          
          {/* Efficiency Details Tooltip on Hover */}
          <div className="absolute inset-0 bg-blue-600/90 flex flex-col items-center justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 text-center">
            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">AI READY</p>
            <p className="text-[8px] text-blue-100 font-medium leading-tight">{summary?.efficiency?.aiImpact || 'Running at full speed'}</p>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      {history.length > 2 && (
        <div className="mb-8 bg-[#111] border border-[#222] rounded-2xl p-4">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">
            Speed · Last {Math.round(history.length * 0.5)} min
          </p>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <YAxis domain={[0, (data.ratedMaxGHz || 5) + 0.5]} hide />
                <Line type="monotone" dataKey="speed" stroke={isThrottling ? '#ef4444' : '#10b981'} strokeWidth={2} dot={false} animationDuration={500} />
                <Line type="monotone" dataKey="max" stroke="#333" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendation (only when throttling) */}
      {isThrottling && data.recommendation && (
        <div className={`mb-8 p-5 rounded-2xl border ${
          data.type === 'thermal' || data.type === 'both' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          <h4 className={`text-xs font-black uppercase tracking-widest mb-2 ${
            data.type === 'thermal' || data.type === 'both' ? 'text-red-500' : 'text-amber-500'
          }`}>{data.recommendation.title}</h4>
          <p className="text-xs text-gray-400 leading-relaxed mb-2">{data.recommendation.message}</p>
          <p className="text-xs text-gray-300 font-bold leading-relaxed">→ {data.recommendation.fix}</p>
        </div>
      )}

      {/* Top Processes */}
      {data.topProcesses && data.topProcesses.length > 0 && (
        <div>
          <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">
            Top CPU Processes
          </h4>
          <div className="space-y-2">
            {data.topProcesses.map((proc, i) => {
              const prot = isProtected(proc.name);
              const isConfirming = confirmKill?.pid === proc.pid;
              return (
                <div key={`${proc.pid}-${i}`}>
                  <div className={`flex items-center justify-between bg-[#111] border rounded-xl px-4 py-3 transition-colors ${
                    isConfirming ? 'border-red-500/40 bg-red-500/5' :
                    proc.isBackground && !prot ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-[#222] hover:border-[#333]'
                  }`}>
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {prot ? (
                        <Lock size={14} className="text-gray-600 shrink-0" />
                      ) : proc.isBackground ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_6px_#f59e0b]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <span className={`text-xs font-bold truncate ${prot ? 'text-gray-600' : 'text-gray-200'}`}>
                        {proc.name}
                      </span>
                      {proc.isBackground && !prot && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">BG</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs font-black text-gray-400 w-14 text-right">{proc.cpuPct}%</span>
                      {!prot && proc.isBackground ? (
                        <button
                          onClick={() => setConfirmKill(isConfirming ? null : proc)}
                          disabled={killing === proc.pid}
                          className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/20 transition-colors disabled:opacity-30"
                        >
                          {killing === proc.pid ? <Loader2 size={12} className="animate-spin" /> : isConfirming ? 'Cancel' : 'Kill'}
                        </button>
                      ) : prot ? (
                        <span className="text-[10px] text-gray-600 font-bold w-12 text-right">System</span>
                      ) : (
                        <span className="w-12" />
                      )}
                    </div>
                  </div>
                  
                  {/* Kill Confirmation Panel */}
                  {isConfirming && <KillConfirmPanel proc={proc} onConfirm={() => handleKill(proc.pid, proc.name)} onCancel={() => setConfirmKill(null)} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 animate-fadeIn ${
          toast.type === 'success' ? 'border-emerald-500/30 bg-[#0f0f1e]' : 'border-red-500/30 bg-[#0f0f1e]'
        }`} style={{ borderLeftWidth: 3, borderLeftColor: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>
          {toast.type === 'success' 
            ? <CheckCircle2 size={14} className="text-emerald-500" /> 
            : <X size={14} className="text-red-500" />}
          <span className="text-xs text-gray-200 font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function KillConfirmPanel({ proc, onConfirm, onCancel }) {
  const [countdown, setCountdown] = useState(2);
  
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const SYSTEM_NAMES = ['msmpeng.exe','defender','svchost','system','lsass','csrss','winlogon','services.exe','wininit.exe','dwm.exe'];
  const BROWSER_NAMES = ['chrome','firefox','edge','brave','opera','safari','msedge'];
  
  const lower = proc.name.toLowerCase();
  const isSystem = SYSTEM_NAMES.some(s => lower.includes(s));
  const isBrowser = BROWSER_NAMES.some(b => lower.includes(b));

  let warningText = "This will close the application.";
  let warningColor = "text-gray-400";
  let warningBg = "bg-[#16162a]";
  if (isSystem) {
    warningText = "⚠ SYSTEM PROCESS — killing may cause instability or data loss";
    warningColor = "text-red-400";
    warningBg = "bg-red-500/5";
  } else if (isBrowser) {
    warningText = "Browser process — unsaved tabs may close";
    warningColor = "text-amber-400";
    warningBg = "bg-amber-500/5";
  }

  return (
    <div className={`mt-1 ${warningBg} border border-[#1e1e38] rounded-xl p-4 animate-fadeIn`}>
      <p className={`text-[11px] font-bold mb-3 ${warningColor}`}>
        Kill {proc.name}? {warningText}
      </p>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white px-3 py-1.5 rounded-lg border border-[#1e1e38] hover:border-gray-600 transition-colors">
          Cancel
        </button>
        <button 
          onClick={countdown === 0 ? onConfirm : undefined}
          disabled={countdown > 0}
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
            countdown > 0 
              ? 'text-gray-600 border-[#1e1e38] cursor-not-allowed' 
              : 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
          }`}
        >
          {countdown > 0 ? `Yes, Kill (${countdown}s)` : 'Yes, Kill It'}
        </button>
      </div>
    </div>
  );
}
