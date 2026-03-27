import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import { Rocket, Power, Play, Search, AlertCircle, RefreshCw } from 'lucide-react';
import Skeleton from './ui/Skeleton';

export default function StartupPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    fetch('/api/startup/items')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6 h-full flex flex-col justify-center items-center">
        <RefreshCw className="animate-spin text-gray-500 mb-2" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Loading Boot Paths...</span>
      </Card>
    );
  }

  const high = items.filter(x => x.impact === 'high');
  const med = items.filter(x => x.impact === 'medium');
  const low = items.filter(x => x.impact === 'low');

  return (
    <Card className="h-full flex flex-col relative" accent="from-[#7733ff]/50 via-blue-500/20 to-transparent">
      {showOverlay && (
        <div className="absolute inset-0 bg-[#080810]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 rounded-[24px]">
           <AlertCircle className="text-purple-500 mb-4" size={32} />
           <h3 className="text-xl font-black text-white tracking-tighter uppercase text-center mb-2">Disable Boot Apps</h3>
           <p className="text-xs text-gray-400 font-bold text-center mb-6 leading-relaxed">
             OS restrictions prevent automated disabling.<br/>Follow these quick steps:
           </p>
           <ol className="text-xs text-gray-300 font-bold space-y-3 mb-8 w-full max-w-[200px]">
             <li className="flex gap-2">
               <span className="text-purple-500 bg-purple-500/10 px-1.5 rounded">1</span>
               Open Task Manager (Ctrl+Shift+Esc)
             </li>
             <li className="flex gap-2">
               <span className="text-purple-500 bg-purple-500/10 px-1.5 rounded">2</span>
               Click the "Startup" tab
             </li>
             <li className="flex gap-2">
               <span className="text-purple-500 bg-purple-500/10 px-1.5 rounded">3</span>
               Right-click apps and select "Disable"
             </li>
           </ol>
           <button 
             onClick={() => setShowOverlay(false)}
             className="px-6 py-2 bg-[#16162a] border border-[#1e1e38] rounded-xl text-white text-[10px] uppercase font-black tracking-widest hover:border-purple-500/50 transition-colors"
           >
             Got It
           </button>
        </div>
      )}

      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <Rocket size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Startup Impact</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">{items.length} Background Items</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 flex-1 overflow-y-auto space-y-6">
        
        {/* High Impact */}
        {high.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">High Impact ({high.length})</span>
            </div>
            <div className="space-y-2">
              {high.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-[#16162a] border border-red-500/20 p-3 rounded-xl hover:border-red-500/40 transition-colors">
                  <span className="text-sm font-bold text-white truncate max-w-[120px]">{h.name}</span>
                  <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-md">
                     <span className="text-red-500 text-[9px] font-black uppercase tracking-widest">🔴 High</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medium Impact */}
        {med.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Medium Impact ({med.length})</span>
            </div>
            <div className="space-y-2">
              {med.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-[#16162a]/50 border border-amber-500/20 p-2.5 rounded-xl hover:border-amber-500/40 transition-colors">
                  <span className="text-xs font-bold text-gray-200 truncate max-w-[130px]">{m.name}</span>
                  <div className="flex items-center gap-2 bg-amber-500/10 px-2 py-0.5 rounded-md">
                     <span className="text-amber-500 text-[9px] font-black uppercase tracking-widest">🟡 Med</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Impact Summary */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1e1e38]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex-1">Low Impact ({low.length})</span>
        </div>

      </div>

      {/* Footer Action */}
      <div className="p-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-end">
        <button 
          onClick={() => setShowOverlay(true)}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg"
          title="Opens Startup Manager to disable"
        >
          <Power size={12} />
          Disable Apps
        </button>
      </div>

    </Card>
  );
}
