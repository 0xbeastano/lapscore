import { ShieldAlert, ShieldCheck, CheckCircle, AlertCircle, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';

export default function PowerBlockers() {
  const { scan, raw } = useData();
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const execs = raw?.powerRequests?.EXECUTION || [];
  const hasBlockers = execs.length > 0;

  const handleCopy = (procName, idx) => {
    navigator.clipboard.writeText(`powercfg /requestsoverride PROCESS ${procName} EXECUTION`);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getBadge = (name) => {
    const l = name.toLowerCase();
    if (l.includes('electron') || l.includes('antigravity') || l.includes('discord') || l.includes('slack') || l.includes('vscode') || l.includes('teams')) return "Electron App";
    if (l.includes('nvidia') || l.includes('nvcontainer')) return "NVIDIA Service";
    if (l.includes('chrome') || l.includes('msedge')) return "Browser";
    return "Background Process";
  };

  if (!hasBlockers) {
    return (
      <Card className="p-6 flex items-center justify-center space-x-3" accent="from-emerald-500/20 to-transparent">
        <CheckCircle size={14} className="text-emerald-500" />
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Power Blockers: NONE · CPU Sleep Available</span>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col" accent="from-red-500/60 via-orange-500/40 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Power Blockers</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">S-State Suppression</p>
          </div>
        </div>
        <StatusBadge status="warning" label={`${execs.length} Active`} pulse />
      </div>

      <div className="px-6 py-4 flex-1 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
        {execs.map((proc, idx) => (
          <div key={idx} className="bg-[#16162a]/60 border border-[#1e1e38] rounded-xl p-4 transition-all hover:border-[#2d2d50]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <AlertCircle size={16} className="text-orange-500 shrink-0" />
                <span className="text-sm font-black text-white truncate">{proc}</span>
              </div>
              <span className="text-[8px] font-black bg-[#080810] text-gray-500 px-2 py-0.5 rounded uppercase tracking-widest border border-[#1e1e38]">
                {getBadge(proc)}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-4 ml-7 leading-relaxed font-medium">This process is actively preventing the CPU from entering low-power sleep states.</p>
            
            <div className="ml-7 bg-black/30 rounded-lg p-3 border border-[#1e1e38]">
              <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck size={10} /> Override Command
              </div>
              <div className="flex flex-col gap-2">
                <code className="text-[10px] text-gray-400 font-mono bg-black/20 p-2 rounded block break-all leading-relaxed">
                  powercfg /requestsoverride PROCESS {proc} EXECUTION
                </code>
                <button 
                  onClick={() => handleCopy(proc, idx)}
                  className={`flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border shadow-sm ${copiedIndex === idx ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-[#16162a] border-[#1e1e38] hover:bg-[#1f1f3a] text-gray-300'}`}
                >
                  {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIndex === idx ? 'Copied' : 'Copy Fix'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 bg-[#080810]/50 border-t border-[#1e1e38]">
        <button 
          onClick={() => setInfoExpanded(!infoExpanded)}
          className="flex items-center w-full text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-[0.15em] group"
        >
          {infoExpanded ? <ChevronDown size={14} className="mr-2" /> : <ChevronRight size={14} className="mr-2" />}
          <span>What is a power blocker?</span>
        </button>
        {infoExpanded && (
          <p className="mt-3 text-[10px] text-gray-600 leading-relaxed font-medium ml-6">
            When an app makes an EXECUTION power request, Windows cannot allow the CPU to enter low-power sleep states, even when idle. This causes high "Modern Standby" drain.
          </p>
        )}
      </div>
    </Card>
  );
}
