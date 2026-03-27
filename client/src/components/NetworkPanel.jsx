import React from 'react';
import { Wifi, Router, Activity, Globe, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';

export default function NetworkPanel({ network, liveData }) {
  if (!network) return null;
  const toMBs = (val) => {
    const n = Number(val);
    return (!isNaN(n) && n >= 0) ? n : null;
  };
  
  const rx = toMBs(liveData?.network?.rxMBs)
          ?? toMBs(network?.rxMBs)
          ?? null;
  const tx = toMBs(liveData?.network?.txMBs)
          ?? toMBs(network?.txMBs)
          ?? null;

  const ssid = liveData?.network?.ssid ?? network.ssid;
  const iface = liveData?.network?.interface ?? network.interface;
  const type = liveData?.network?.type ?? network.type;

  const fmtMBs = (n) =>
    n == null ? '—' : `${Number(n).toFixed(2)} MB/s`;

  return (
    <Card className="h-full flex flex-col" accent="from-blue-500/40 via-blue-400/20 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
            {type === 'wireless' ? <Wifi size={24} /> : <Router size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Network</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">{iface}</p>
          </div>
        </div>
        <StatusBadge status="healthy" label={ssid || 'Active'} pulse />
      </div>

      <div className="px-6 py-4 flex-1 space-y-6">
        <div className="bg-[#16162a]/60 border border-[#1e1e38] rounded-2xl p-6 transition-all hover:bg-[#1a1a35]">
          <div className="flex justify-between items-end mb-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Globe size={12} className="text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)] animate-pulse" />
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Global Telemetry Status</span>
              </div>
              <span className="text-xl font-black text-white tracking-tighter uppercase">ONLINE</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Interface Type</span>
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest leading-none mt-1">{type || 'Ethernet'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-black/20 p-5 rounded-xl border border-[#1e1e38]">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1.5 grayscale opacity-50">
                <Activity size={10} className="text-emerald-500" />
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Downloading</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{fmtMBs(rx).replace(' MB/s', '')}</span>
                <span className="text-[10px] ml-1.5 text-gray-500 font-black uppercase tracking-widest mb-1">{fmtMBs(rx).includes('MB/s') ? 'MB/s' : ''}</span>
              </div>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-6">
              <div className="flex items-center gap-2 mb-1.5 grayscale opacity-50">
                <Activity size={10} className="text-blue-500" />
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Uploading</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{fmtMBs(tx).replace(' MB/s', '')}</span>
                <span className="text-[10px] ml-1.5 text-gray-500 font-black uppercase tracking-widest mb-1">{fmtMBs(tx).includes('MB/s') ? 'MB/s' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
           {[
             { label: 'Public IP', val: 'HIDDEN (PRO)', active: false },
             { label: 'Latency', val: '2ms', active: true },
             { label: 'DHCP', val: 'STATIC', active: true }
           ].map((m, i) => (
             <div key={i} className={`p-2.5 rounded-lg border border-[#1e1e38] flex flex-col items-center gap-1 transition-all ${m.active ? 'bg-[#16162a]/50' : 'bg-black/10 opacity-30 cursor-not-allowed'}`}>
               <span className="text-[8px] text-gray-600 font-black uppercase tracking-[0.15em] leading-none mb-1">{m.label}</span>
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">{m.val}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="px-6 py-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-between items-center text-[9px] font-bold tracking-widest">
        <span className="text-gray-600">Network Discovery: COMPLETE</span>
        <button 
          className="text-blue-500 hover:text-white transition-colors flex items-center gap-1.5 group font-black"
          onClick={() => window.open('https://fast.com', '_blank')}
        >
           SPEEDTEST <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </Card>
  );
}
