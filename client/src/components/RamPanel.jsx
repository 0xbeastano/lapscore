import { useState, useEffect, useCallback } from 'react';
import { Database, TrendingUp, Info, ChevronDown, ChevronRight, Loader2, Lock } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import Skeleton from './ui/Skeleton';
import { fetchRamProcesses, killProcess } from '../api';

export default function RamPanel({ ram, isScanning = false }) {
  if (!ram) return null;

  const totalBytes = parseInt(ram.TotalVisibleMemorySize, 10) || 0;
  const freeBytes = parseInt(ram.FreePhysicalMemory, 10) || 0;
  const usedBytes = totalBytes - freeBytes;
  const usedPct = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
  
  const getStatus = (p) => {
    if (p > 85) return { status: 'critical', label: 'Memory Pressure' };
    if (p > 65) return { status: 'warning', label: 'High Usage' };
    return { status: 'healthy', label: 'Efficient' };
  };

  const status = getStatus(usedPct);

  return (
    <Card className="h-full flex flex-col" accent="from-pink-500/40 via-purple-500/40 to-transparent">
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-inner">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Memory</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Physical Volatile Storage</p>
          </div>
        </div>
        <StatusBadge status={status.status} label={status.label} pulse={status.status === 'critical'} />
      </div>

      <div className="px-6 py-4 flex-1 space-y-8">
        <div className="bg-[#16162a] border border-[#1e1e38] p-5 rounded-xl text-center space-y-1">
          <span className="text-3xl font-black text-white tabular-nums tracking-tighter transition-all">
            {isScanning ? '...' : usedPct}%
          </span>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Usage Across Channels</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#475569]">
            <span>System Commit</span>
            <span>Allocated Space</span>
          </div>
          <div className="h-3 w-full bg-[#080810] rounded-full overflow-hidden border border-[#1e1e38] relative">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${usedPct > 80 ? 'bg-red-500' : 'bg-pink-500'}`} 
              style={{ width: `${isScanning ? 0 : usedPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#16162a]/50 border border-[#1e1e38] p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <TrendingUp size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Cache</span>
            </div>
            <span className="text-lg font-black text-gray-200 tabular-nums tracking-tighter">
              {isScanning ? <Skeleton w="40px" h={16} /> : `${(usedBytes / 1024 / 1024).toFixed(1)}GB`}
            </span>
          </div>
          <div className="bg-[#16162a]/50 border border-[#1e1e38] p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <Info size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Slots</span>
            </div>
            <span className="text-lg font-black text-gray-200 tabular-nums tracking-tighter">
              {isScanning ? <Skeleton w="40px" h={16} /> : `${(totalBytes / 1024 / 1024).toFixed(1)}GB`}
            </span>
          </div>
        </div>

        {/* RAM Process Deep Dive */}
        <RamProcessList />
      </div>

      <div className="p-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-between items-center px-6">
        <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase">Type: DDR5 6400MHz</span>
        <span className="text-[9px] text-pink-500 font-bold tracking-widest uppercase">Dual Channel</span>
      </div>
    </Card>
  );
}

function RamProcessList() {
  const [open, setOpen] = useState(false);
  const [procs, setProcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [killing, setKilling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchRamProcesses();
    setProcs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [open, load]);

  const handleKill = async (pid, name) => {
    setKilling(pid);
    try {
      await killProcess(pid, name);
      load();
    } catch (e) { /* silent */ }
    setKilling(null);
  };

  return (
    <div>
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-pink-400 font-black uppercase tracking-widest transition-colors w-full"
      >
        {open ? <ChevronDown size={12} className="text-pink-500" /> : <ChevronRight size={12} />}
        Top Memory Consumers
        {loading && <Loader2 size={10} className="animate-spin ml-auto" />}
      </button>
      
      {open && (
        <div className="mt-3 space-y-1.5 animate-fadeIn">
          {procs.length === 0 && !loading && (
            <p className="text-[10px] text-gray-600 text-center py-3">No heavy processes found</p>
          )}
          {procs.map((p, i) => (
            <div key={p.pid} className="flex items-center justify-between bg-[#16162a]/60 border border-[#1e1e38] rounded-lg px-3 py-2 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {p.isSystem ? (
                  <Lock size={10} className="text-gray-600 shrink-0" />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.memPct > 10 ? 'bg-red-500' : p.memPct > 5 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                )}
                <span className={`text-[10px] font-bold truncate ${p.isSystem ? 'text-gray-600' : 'text-gray-200'}`}>{p.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-16">
                  <div className="h-1.5 bg-[#080810] rounded-full overflow-hidden border border-[#1e1e38]">
                    <div className={`h-full rounded-full ${p.memPct > 10 ? 'bg-red-500' : p.memPct > 5 ? 'bg-amber-500' : 'bg-pink-500'}`} style={{ width: `${Math.min(p.memPct * 5, 100)}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-black text-gray-400 tabular-nums w-16 text-right">
                  {p.memMB >= 1024 ? `${(p.memMB / 1024).toFixed(1)} GB` : `${p.memMB} MB`}
                </span>
                <span className="text-[9px] font-bold text-gray-600 tabular-nums w-10 text-right">{p.cpuPct}%</span>
                {!p.isSystem ? (
                  <button
                    onClick={() => handleKill(p.pid, p.name)}
                    disabled={killing === p.pid}
                    className="text-[9px] font-black uppercase text-red-500/60 hover:text-red-400 transition-colors w-8 text-right"
                  >
                    {killing === p.pid ? <Loader2 size={10} className="animate-spin ml-auto" /> : 'Kill'}
                  </button>
                ) : (
                  <span className="text-[9px] text-gray-700 font-bold w-8 text-right">sys</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
