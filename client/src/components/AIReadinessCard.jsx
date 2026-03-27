import React, { useState, useEffect } from 'react';
import { Cpu, ExternalLink, Sparkles, Database, Calculator, Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import { fetchAIRamCalculator } from '../api';

export default function AIReadinessCard() {
  const [readiness, setReadiness] = useState(null);
  const [ramInfo, setRamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('readiness'); // 'readiness' | 'calculator'

  useEffect(() => {
    Promise.all([
      fetch('/api/ai/readiness').then(r => r.json()),
      fetchAIRamCalculator()
    ]).then(([readinessData, ramData]) => {
      setReadiness(readinessData);
      setRamInfo(ramData);
    })
    .catch(err => console.error('Failed to load AI data', err))
    .finally(() => setLoading(false));
  }, []);

  if (loading || !readiness) return null;

  const { hardware, models, overallRating, topModel } = readiness;
  
  const getRatingInfo = (rating) => {
    if (rating === 'AI-Ready') return { status: 'healthy', label: 'AI Ready (High Performance)' };
    if (rating === 'Basic AI') return { status: 'warning', label: 'Basic AI Compatible' };
    return { status: 'critical', label: 'Limited AI Support' };
  };

  const ratingInfo = getRatingInfo(overallRating);

  return (
    <Card className="h-full flex flex-col" accent="from-blue-500/60 via-purple-500/60 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">AI Readiness</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Local LLM Performance Check</p>
          </div>
        </div>
        <StatusBadge status={ratingInfo.status} label={ratingInfo.label} pulse={ratingInfo.status === 'healthy'} />
      </div>

      {/* TABS */}
      <div className="px-6 flex gap-4 border-b border-[#1e1e38]">
        <button 
          onClick={() => setActiveTab('readiness')}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'readiness' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Readiness
          {activeTab === 'readiness' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('calculator')}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'calculator' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          RAM Calculator
          {activeTab === 'calculator' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
        </button>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'readiness' ? (
          <div className="animate-fadeIn">
            {/* Hardware Status Chips */}
            <div className="grid grid-cols-4 gap-2 mb-6 bg-[#16162a]/50 p-3 rounded-xl border border-[#1e1e38]">
              {[
                { label: 'RAM', val: `${hardware?.ramGB ?? '—'} GB`, active: true },
                { label: 'VRAM', val: `${hardware?.gpuVramGB ?? 0} GB`, active: (hardware?.gpuVramGB || 0) >= 4 },
                { label: 'NPU', val: hardware?.hasNPU ? 'YES' : 'NO', active: hardware?.hasNPU },
                { label: 'GPU', val: 'PRO', active: true }
              ].map((chip, i) => (
                <div key={i} className={`flex flex-col items-center justify-center transition-all ${chip.active ? 'opacity-100' : 'opacity-40'}`}>
                  <span className="text-[9px] uppercase font-black text-gray-500 tracking-wider mb-0.5">{chip.label}</span>
                  <span className={`text-[11px] font-black ${chip.active ? 'text-gray-200' : 'text-gray-500'}`}>{chip.val}</span>
                </div>
              ))}
            </div>

            {/* Model Support Table */}
            <div className="w-full">
              <div className="flex justify-between items-center text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2">
                <span>Model Name</span>
                <span>Speed Rating</span>
              </div>
              <div className="space-y-1.5">
                {models.map((m, i) => {
                  const isBest = m.name === topModel;
                  return (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isBest ? 'bg-purple-500/10 border-purple-500/40' : 'bg-[#16162a]/60 border-[#1e1e38] opacity-60'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-xs font-black ${isBest ? 'text-purple-300' : 'text-gray-200'}`}>{m.name}</span>
                        <span className="text-[10px] text-gray-500 font-medium">{m.quality}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[11px] font-black ${m.canRun ? 'text-blue-400' : 'text-gray-600'}`}>{m.canRun ? m.speed : 'INCOMPATIBLE'}</span>
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">{m.canRun ? 'Score' : 'Low Spec'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-[#16162a]/50 p-4 rounded-xl border border-[#1e1e38] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-blue-500" />
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Model Buffer</span>
                </div>
                <span className="text-xs font-black text-white">{ramInfo?.aiHeadroom.toFixed(1)} GB Available</span>
              </div>
              
              <div className="h-2 w-full bg-[#080810] rounded-full overflow-hidden border border-[#1e1e38]">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all duration-1000"
                  style={{ width: `${(ramInfo?.aiHeadroom / ramInfo?.totalRAM) * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-widest">
                {Math.round(ramInfo?.aiHeadroom)} GB Free / {Math.round(ramInfo?.totalRAM)} GB Total RAM
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Model Compatibility</h4>
              {ramInfo?.recommendations.map((rec, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border bg-[#16162a]/30 ${rec.fits ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                   <div className="flex items-center gap-3">
                     {rec.fits ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className={rec.fitType === 'needs_close_apps' ? 'text-amber-500' : 'text-red-500'} />}
                     <div>
                       <p className="text-xs font-black text-gray-200">{rec.name}</p>
                       <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{rec.ramNeeded} GB REQUIRED</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${rec.fitType === 'comfortable' ? 'bg-emerald-500/10 text-emerald-400' : rec.fitType === 'tight' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                        {rec.fitType === 'needs_close_apps' ? 'CLOSE APPS' : rec.fitType.replace('_', ' ')}
                     </span>
                     <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">{rec.performance}</p>
                   </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex items-start gap-3">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                Tip: Closing apps like Chrome or Slack can free up ~1.5 GB, allowing you to run 7B models more comfortably.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-[#16162a]/50 border-t border-[#1e1e38] text-center">
        <a href="https://ollama.com" target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-[0.15em] group">
          <span>Get Started with Local AI Models</span>
          <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </Card>
  );
}
