import { Clock, Hash, BatteryMedium, Cpu, AlertTriangle, HardDrive, ChevronDown, ChevronRight, Zap, Database, Monitor, Settings } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { timeAgo } from '../utils/time';
import { pct } from '../utils/format';
import Skeleton from './ui/Skeleton';
import ScoreSparkline from './ScoreSparkline';

const TypeWriter = ({ text, delay = 30 }) => {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    setIsDone(false);
    let i = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timerRef.current);
        setIsDone(true);
      }
    }, delay);
    return () => clearInterval(timerRef.current);
  }, [text, delay]);

  return (
    <span className="relative">
      {displayed}
      {!isDone && <span className="inline-block w-1.5 h-4 bg-purple-500 ml-1 animate-pulse align-middle" />}
    </span>
  );
};

const ringColor = (score) => {
  if (!score) return '#6b7280';
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const catIcons = { Battery: BatteryMedium, Power: Zap, CPU: Cpu, Storage: HardDrive, Drivers: Settings, Memory: Database, GPU: Monitor };

export function ScoreCard({ scores, deviceModel, lastScanTime, issueCount, scanId, raw, isScanning = false }) {
  const score = scores?.total || 0;
  const breakdown = scores?.breakdown || [];
  const [displayScore, setDisplayScore] = useState(0);
  const [offset, setOffset] = useState(502.65);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  
  useEffect(() => {
    const duration = 1500;
    let startTimestamp = null;
    const animate = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      setOffset(502.65 * (1 - (eased * score) / 100));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);
  
  const [liveLastScanned, setLiveLastScanned] = useState(timeAgo(lastScanTime));
  useEffect(() => {
    setLiveLastScanned(timeAgo(lastScanTime));
    const timer = setInterval(() => setLiveLastScanned(timeAgo(lastScanTime)), 10000);
    return () => clearInterval(timer);
  }, [lastScanTime]);

  const uptime = raw?.metadata?.UptimeHours || 0;
  const shortId = scanId ? scanId.substring(0, 8) : 'N/A';

  let insightStr = "All systems healthy and optimized.";
  let insightColor = "text-emerald-400 font-medium";
  if (issueCount > 0) {
    insightStr = `Critical issues detected. Review fix recommendations below.`;
    insightColor = "text-red-400 font-bold";
  } else if (raw?.battery && raw.battery.FullChargeCapacity && raw.battery.DesignCapacity) {
    const batHealth = (parseInt(raw.battery.FullChargeCapacity, 10) / parseInt(raw.battery.DesignCapacity, 10)) * 100;
    if (batHealth < 80) {
      insightStr = `Your battery has lost ${Math.round(100 - batHealth)}% of its original capacity.`;
      insightColor = "text-yellow-400 font-bold";
    }
  }
  const cpuLoad = raw?.cpu?.LoadPercentage ? parseFloat(raw.cpu.LoadPercentage) : 0;
  if (!insightStr.includes('Critical') && !insightStr.includes('lost') && cpuLoad > 40) {
    insightStr = `Your CPU is using ${Math.round(cpuLoad)}% at idle — background apps are draining power.`;
    insightColor = "text-orange-400 font-bold";
  }

  const getBarColor = (s, m) => {
    const p = m > 0 ? (s / m) * 100 : 0;
    if (p >= 80) return '#22c55e';
    if (p >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative overflow-hidden bg-[#0f0f1e] border border-[#1e1e38] rounded-[32px] w-full p-8 md:p-12 shadow-2xl transition-all duration-500 hover:border-purple-500/20">
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${ringColor(score)}14 0%, transparent 70%)` }} />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* LEFT: Device Info */}
        <div className="lg:col-span-5 space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.2em]">System Status</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none">{deviceModel || <Skeleton w="240px" h={36} />}</h2>
            <div className="flex items-center space-x-3 text-[11px] text-gray-500 font-bold pt-2">
              <span className="bg-white/5 px-2 py-0.5 rounded uppercase">{raw?.metadata?.OSVersion || 'Windows OS'}</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>{liveLastScanned}</span>
            </div>
          </div>
          <div className="bg-[#16162a]/80 backdrop-blur-md border border-[#1e1e38] p-5 rounded-2xl min-h-[72px] flex items-center shadow-inner relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-blue-500 opacity-50" />
            <p className={`text-[13px] leading-relaxed tracking-wide ${insightColor}`}><TypeWriter text={insightStr} /></p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-[11px] text-blue-300 font-black uppercase tracking-widest transition-transform hover:scale-105 cursor-default">
              <Clock size={14} className="animate-pulse" /><span>UP {uptime}H</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-500/10 border border-gray-500/20 px-4 py-2 rounded-xl text-[11px] text-gray-400 font-mono tracking-[0.2em] transition-transform hover:scale-105 cursor-default">
              <Hash size={14} /><span>{shortId}</span>
            </div>
          </div>
        </div>

        {/* CENTER: Ring */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center py-4">
          <div className="relative w-full max-w-[220px] aspect-square flex items-center justify-center transition-transform duration-700 hover:scale-110">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform" style={{ filter: `drop-shadow(0 0 25px ${ringColor(score)}44)` }}>
              <circle cx="100" cy="100" r="80" fill="transparent" stroke="#1c1c36" strokeWidth="14" />
              <circle cx="100" cy="100" r="80" fill="transparent" stroke={ringColor(score)} strokeWidth="14" strokeDasharray="502.65" strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-6xl md:text-7xl font-black text-white tracking-tightest leading-none" style={{ textShadow: `0 0 40px ${ringColor(score)}66` }}>
                {isScanning ? <Skeleton w="60px" h={60} /> : displayScore}
              </span>
              <div className="flex flex-col items-center mt-2">
                <span className="text-2xl font-black uppercase italic tracking-widest leading-none" style={{ color: ringColor(score) }}>{scores?.grade || '-'}</span>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Health Grade</span>
              </div>
            </div>
          </div>
          <div className="mt-8 opacity-80 scale-110">
            <ScoreSparkline latestScore={score} ringColor={ringColor(score)} />
          </div>
        </div>

        {/* RIGHT: Chips */}
        <div className="lg:col-span-4 flex justify-end">
          <div className="battery-detail-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full max-w-[320px] animate-fadeIn">
            {[
              { icon: BatteryMedium, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Battery', val: scores?.battery != null ? pct(scores.battery, 0) : 'N/A' },
              { icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'CPU Load', val: raw?.cpu?.LoadPercentage != null ? pct(raw.cpu.LoadPercentage, 1) : 'N/A' },
              { icon: AlertTriangle, color: issueCount > 0 ? 'text-red-500' : 'text-emerald-500', bg: issueCount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10', label: 'Health Issues', val: issueCount > 0 ? `${issueCount} CRITICAL` : 'HEALTHY' },
              { icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Disk', val: scores?.disk === 100 ? 'HEALTHY' : 'WARNING' }
            ].map((chip, i) => (
              <div key={i} className="flex items-center space-x-4 bg-[#111122]/50 border border-[#1e1e38] p-4 rounded-2xl shadow-xl transition-all hover:border-purple-500/40 hover:-translate-y-1 hover:bg-[#16162a] group">
                <div className={`p-3 rounded-xl ${chip.bg} ${chip.color} shadow-inner transition-transform group-hover:scale-110`}><chip.icon size={18} /></div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">{chip.label}</span>
                  <span className={`text-xs font-bold truncate ${chip.color === 'text-gray-100' ? 'text-gray-100' : chip.color.replace('text-', 'text-white ')}`}>{isScanning ? <Skeleton w="40px" h={12} className="mt-1" /> : chip.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SCORE BREAKDOWN */}
      {breakdown.length > 0 && (
        <div className="relative z-10 mt-6 pt-4 border-t border-[#1e1e38]">
          <button onClick={() => setBreakdownOpen(!breakdownOpen)} className="flex items-center gap-2 text-[11px] text-gray-500 hover:text-purple-400 font-black uppercase tracking-widest transition-colors">
            {breakdownOpen ? <ChevronDown size={14} className="text-purple-500" /> : <ChevronRight size={14} />}
            Score breakdown — Why {score}?
          </button>
          {breakdownOpen && (
            <div className="mt-4 space-y-3 animate-fadeIn">
              {breakdown.map((cat, i) => {
                const Icon = catIcons[cat.category] || Settings;
                const barPct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
                return (
                  <div key={cat.category} className="group/bar" title={cat.reason}>
                    <div className="flex items-center gap-3">
                      <Icon size={14} className="text-gray-500 shrink-0" />
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest w-20 shrink-0">{cat.category}</span>
                      <div className="flex-1 h-2 bg-[#080810] rounded-full overflow-hidden border border-[#1e1e38]">
                        <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: getBarColor(cat.score, cat.maxScore), transition: `width ${600 + i * 100}ms cubic-bezier(0.4,0,0.2,1)` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 font-black tabular-nums w-12 text-right">{cat.score}/{cat.maxScore}</span>
                    </div>
                    <p className="ml-[68px] text-[9px] text-gray-600 font-bold mt-0.5 opacity-0 group-hover/bar:opacity-100 transition-opacity">{cat.reason}</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e1e38]/50">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total</span>
                <span className="text-sm text-white font-black tabular-nums">{breakdown.reduce((s,c) => s + c.score, 0)}/100</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-blue-500 to-transparent opacity-20" />
    </div>
  );
}
