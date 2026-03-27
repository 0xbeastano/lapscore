import { HardDrive, Server, ShieldCheck, Database } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';

export default function DiskPanel({ disks }) {
  if (!disks || disks.length === 0) return null;

  return (
    <Card className="h-full flex flex-col" accent="from-emerald-500/40 via-blue-500/40 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
            <HardDrive size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Storage & Health</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Persistence & SMART Integrity</p>
          </div>
        </div>
        <StatusBadge status="healthy" label="Optimized" />
      </div>

      <div className="px-6 py-4 flex-1 space-y-6">
        {disks.map((disk, idx) => {
          // Fallback fields matching both old and new schema
          const model = disk.Model || disk.FriendlyName || 'Generic NVMe';
          const type = disk.MediaType || disk.type || 'SSD';
          const isCaution = disk.smartStatus === 'caution' || disk.healthScore === 65;
          const isBad = disk.smartStatus === 'bad' || disk.healthScore === 20;
          const isOk = disk.smartStatus === 'ok' || disk.healthScore === 100 || disk.HealthStatus === 'Healthy';

          let smartText = "SMART OK";
          let smartColor = "text-emerald-500";
          let circleColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";

          if (isCaution) {
            smartText = disk.temperature ? `WARNING (${disk.temperature}°C)` : "WARNING";
            smartColor = "text-amber-500";
            circleColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
          } else if (isBad) {
            smartText = "FAILING";
            smartColor = "text-red-500 font-black animate-pulse";
            circleColor = "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]";
          }

          return (
            <div key={idx} className={`bg-[#16162a]/60 border p-5 rounded-2xl space-y-4 transition-colors group ${isCaution || isBad ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-[#1e1e38] hover:border-gray-700'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                    <Server size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[150px]">{model}</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-0.5">{type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-black text-gray-200 tabular-nums">{(disk.Size / 1024 / 1024 / 1024).toFixed(0)} GB Total</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${circleColor}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${smartColor}`}>{isOk ? 'SMART: HEALTHY' : `SMART: ${smartText}`}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-transparent hover:border-[#1e1e38]">
                  <ShieldCheck size={12} className={smartColor} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${smartColor}`}>{smartText}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-transparent hover:border-[#1e1e38]">
                  <Database size={12} className="text-purple-500" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{disk.vendor || 'NVMe 1.4'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
        <span className="text-gray-600">Total Volume Analysis Complete</span>
        <button 
          className="text-blue-500 hover:text-white transition-colors flex items-center gap-1 group"
          onClick={() => window.open('https://files.community/', '_blank')}
        >
          Open Files <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
}

import { ChevronRight } from 'lucide-react';
