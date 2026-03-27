import { Cpu, Gauge, Wind } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useState, useEffect } from 'react';
import { fetchThrottleStatus } from '../api';
import { ghz, pct } from '../utils/format';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import Skeleton from './ui/Skeleton';

export default function CpuPanel({ isScanning = false }) {
  const { raw } = useData();
  const [throttle, setThrottle] = useState(null);

  useEffect(() => {
    fetchThrottleStatus().then(res => { if (res) setThrottle(res); }).catch(() => {});
  }, []);

  if (!raw?.cpu) return null;
  const cpu = raw.cpu;
  const fans = raw?.fans || [];
  const load = Math.round((parseFloat(cpu.LoadPercentage) || 0) * 10) / 10;
  
  const getStatus = () => {
    if (throttle?.status === 'throttling') return { status: 'critical', label: 'Throttling' };
    if (load > 40) return { status: 'critical', label: 'Overloaded' };
    if (load > 15) return { status: 'warning', label: 'Active' };
    return { status: 'healthy', label: 'Idle' };
  };

  const status = getStatus();
  const maxClock = parseInt(cpu.MaxClockSpeed, 10) || 0;
  const currentClock = parseInt(cpu.CurrentClockSpeed, 10) || 0;
  const clockPct = maxClock > 0 ? Math.min(100, Math.round((currentClock / maxClock) * 100)) : 0;

  return (
    <Card className="h-full flex flex-col" accent="from-blue-500/40 via-indigo-500/40 to-transparent">
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
            <Cpu size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Processor</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Computational Load</p>
          </div>
        </div>
        <StatusBadge status={status.status} label={status.label} pulse={status.status === 'critical'} />
      </div>

      <div className="px-6 py-4 flex-1 space-y-8">
        <div>
          <h3 className="text-xl font-black text-white mb-1 tracking-tighter truncate">{cpu.Name || "Unknown CPU"}</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
            {cpu.physicalCores || cpu.NumberOfCores || 0} Physical · {cpu.cores || cpu.NumberOfLogicalProcessors || 0} Logical
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#16162a] border border-[#1e1e38] p-4 rounded-xl">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Load Percentage</span>
              <span className={`text-xl font-black tabular-nums transition-colors ${load > 40 ? 'text-red-500' : 'text-blue-400'}`}>
                {isScanning ? '...' : `${load}%`}
              </span>
            </div>
            <div className="h-3 w-full bg-[#080810] rounded-full overflow-hidden border border-[#1e1e38]">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${load > 40 ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${isScanning ? 0 : load}%` }}
              />
            </div>
          </div>

          <div className="bg-[#16162a] border border-[#1e1e38] p-4 rounded-xl">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Clock Speed</span>
              <span className="text-xl font-black text-white tabular-nums uppercase transition-colors">
                {isScanning ? '...' : ghz(currentClock / 1000)}
              </span>
            </div>
            <div className="h-3 w-full bg-[#080810] rounded-full overflow-hidden border border-[#1e1e38]">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
                style={{ width: `${isScanning ? 0 : clockPct}%` }}
              />
            </div>
          </div>
        </div>

        {fans.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {fans.map((fan, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#16162a] border border-[#1e1e38] p-3 rounded-xl">
                <Wind size={14} className="text-emerald-500 animate-spin-anim" style={{ animationDuration: fan.rpm > 3000 ? '0.5s' : '1.5s' }} />
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest truncate">{(fan.label || `Fan ${i+1}`).toUpperCase()}</span>
                  <span className="text-[11px] font-black text-gray-200 tabular-nums">{fan.rpm > 0 ? `${fan.rpm} RPM` : 'STOPPED'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-[#080810]/50 border-t border-[#1e1e38]">
        <button
          onClick={() => document.getElementById('throttle-radar')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:text-white transition-colors group"
        >
          <Gauge size={14} className="group-hover:rotate-45 transition-transform" />
          <span>Throttle Radar →</span>
        </button>
      </div>
    </Card>
  );
}
