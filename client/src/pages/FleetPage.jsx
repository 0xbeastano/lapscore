import { useState, useEffect } from 'react';
import { TopNav } from '../components/TopNav';
import { fetchPeers, fetchPeerDetails } from '../api';
import { 
  Laptop, 
  Wifi, 
  WifiOff, 
  Activity, 
  Battery, 
  Database, 
  AlertTriangle, 
  X, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  Cpu
} from 'lucide-react';

export default function FleetPage() {
  const [peers, setPeers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [peerData, setPeerData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadPeers();
    const interval = setInterval(loadPeers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPeers = async () => {
    try {
      const data = await fetchPeers();
      setPeers(data.peers || []);
      setOnlineCount(data.onlineCount || 0);
      setIsLoading(false);
    } catch (err) {
      console.error('Fleet fetch failed', err);
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (peer) => {
    setSelectedPeer(peer);
    setLoadingDetails(true);
    setPeerData(null);
    try {
      const data = await fetchPeerDetails(peer.ip);
      setPeerData(data);
    } catch (err) {
      console.error('Failed to fetch peer details');
    }
    setLoadingDetails(false);
  };

  const avgScore = peers.length > 0 
    ? Math.round(peers.reduce((acc, p) => acc + (p.score || 0), 0) / peers.length)
    : 0;

  const totalIssues = peers.reduce((acc, p) => acc + (p.issues || 0), 0);

  return (
    <div className="min-h-screen bg-[#080810] pt-24 pb-12 px-6">
      <TopNav />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
              FLEET OVERVIEW
              <span className="text-xs bg-[#16162a] border border-[#1e1e38] px-3 py-1 rounded-full text-blue-400 font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Discovery Active
              </span>
            </h1>
            <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">
              Monitoring {peers.length} machines on your local network
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-[#0f0f1e] border border-[#1e1e38] p-1.5 rounded-2xl shadow-xl">
             <div className="px-4 py-2 bg-[#16162a] rounded-xl flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Avg Score</span>
                <span className={`text-xl font-black ${avgScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{avgScore}</span>
             </div>
             <div className="px-4 py-2 bg-[#16162a] rounded-xl flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Online</span>
                <span className="text-xl font-black text-white">{onlineCount} / {peers.length}</span>
             </div>
             <div className="px-4 py-2 bg-[#16162a] rounded-xl flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Issues</span>
                <span className={`text-xl font-black ${totalIssues > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{totalIssues}</span>
             </div>
          </div>
        </div>

        {/* Machine Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[280px] bg-[#0f0f1e] border border-[#1e1e38] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : peers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-[#0f0f1e]/50 border-2 border-dashed border-[#1e1e38] rounded-[40px] text-center px-6">
             <div className="w-20 h-20 bg-[#16162a] rounded-full flex items-center justify-center mb-6 text-blue-500 border border-[#1e1e38]">
                <Wifi size={40} className="animate-pulse" />
             </div>
             <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Scanning network...</h3>
             <p className="text-gray-500 font-bold max-w-md mx-auto leading-relaxed">
               No other LapScore machines found yet. Install LapScore on other laptops in your home or office to see them appear here automatically.
             </p>
             <button className="mt-8 text-xs font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
               How to install on another machine →
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {peers.map(peer => (
              <FleetCard 
                key={peer.ip} 
                peer={peer} 
                onClick={() => handleViewDetails(peer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Side Panel Overlay */}
      {selectedPeer && (
        <div 
          className="fixed inset-0 z-[200] flex justify-end animate-fadeIn"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedPeer(null)}
        >
          <div 
            className="w-full max-w-[520px] h-full bg-[#080810] border-l border-[#1e1e38] shadow-2xl overflow-y-auto no-scrollbar relative animate-slideInRight"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="sticky top-0 z-10 bg-[#080810]/80 backdrop-blur-xl border-bottom border-[#1e1e38] p-6 flex items-center justify-between">
               <button 
                 onClick={() => setSelectedPeer(null)}
                 className="flex items-center gap-2 text-gray-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors"
               >
                 <ArrowLeft size={16} />
                 Back to Fleet
               </button>
               <div className="text-right">
                  <h2 className="text-xl font-black text-white leading-none">{selectedPeer.hostname}</h2>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedPeer.ip}</span>
               </div>
            </div>

            {/* Panel Content */}
            <div className="p-8 space-y-8">
               {loadingDetails ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                     <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                     <p className="text-gray-500 font-black text-xs uppercase tracking-widest">Fetching telemetry...</p>
                  </div>
               ) : peerData ? (
                  <MachineDetailPanel data={peerData} ip={selectedPeer.ip} />
               ) : (
                  <div className="py-20 text-center text-red-400 bg-red-500/5 border border-red-500/10 rounded-3xl p-6">
                     <AlertTriangle className="mx-auto mb-4" />
                     <p className="font-extrabold uppercase tracking-widest text-sm">Connection Failed</p>
                     <p className="text-xs text-red-400/60 mt-2">Could not reach LapScore service at {selectedPeer.ip}</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}} />
    </div>
  );
}

function FleetCard({ peer, onClick }) {
  const isOnline = peer.online;
  const isSelf = peer.ip === '127.0.0.1' || peer.ip.includes('192.168.1.something'); // Ideally we check a unique ID

  const scoreColor = peer.score >= 80 ? 'text-emerald-400' : peer.score >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = peer.score >= 80 ? 'bg-emerald-500/10' : peer.score >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10';
  const scoreBorder = peer.score >= 80 ? 'border-emerald-500/20' : peer.score >= 60 ? 'border-amber-500/20' : 'border-red-500/20';

  return (
    <div 
      className={`group relative bg-[#0f0f1e] border ${peer.ip === '127.0.0.1' ? 'border-purple-500/40' : 'border-[#1e1e38]'} rounded-[32px] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/5 cursor-pointer ${!isOnline ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
           <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-gray-500'}`} />
           <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-gray-500'}`}>
             {isOnline ? 'Online' : 'Offline'}
           </span>
        </div>
        <div className={`px-3 py-1 rounded-full border ${scoreBg} ${scoreBorder} ${scoreColor} text-[10px] font-black uppercase tracking-widest`}>
          Score: {peer.score || '??'}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
         <div className="w-16 h-16 rounded-2xl bg-[#16162a] border border-[#1e1e38] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
            <Laptop size={32} />
         </div>
         <div>
            <h3 className="text-xl font-black text-white leading-tight flex items-center gap-2">
              {peer.hostname}
              {peer.ip === '127.0.0.1' && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20">THIS PC</span>}
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{peer.ip}</p>
         </div>
      </div>

      {/* Mini Visual Score Ring */}
      <div className="flex justify-center mb-8">
         <div className="w-20 h-20 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
               <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#16162a]" />
               <circle 
                 cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" 
                 strokeDasharray={213.6}
                 strokeDashoffset={213.6 - (213.6 * (peer.score || 0)) / 100}
                 strokeLinecap="round"
                 className={scoreColor}
               />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className={`text-xl font-black ${scoreColor}`}>{peer.grade || '-'}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
         <div className="bg-[#16162a]/50 p-3 rounded-2xl border border-[#1e1e38] flex items-center gap-3">
            <Battery size={16} className="text-emerald-500" />
            <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 font-black uppercase">Battery</span>
               <span className="text-xs font-bold text-gray-200">{peer.batteryHealth || 'Unknown'}</span>
            </div>
         </div>
         <div className="bg-[#16162a]/50 p-3 rounded-2xl border border-[#1e1e38] flex items-center gap-3">
            <Activity size={16} className="text-blue-500" />
            <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 font-black uppercase">CPU Load</span>
               <span className="text-xs font-bold text-gray-200">{peer.cpuLoad}%</span>
            </div>
         </div>
         <div className="bg-[#16162a]/50 p-3 rounded-2xl border border-[#1e1e38] flex items-center gap-3">
            <Cpu size={16} className="text-purple-500" />
            <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 font-black uppercase">RAM</span>
               <span className="text-xs font-bold text-gray-200">{peer.ramUsed}%</span>
            </div>
         </div>
         <div className="bg-[#16162a]/50 p-3 rounded-2xl border border-[#1e1e38] flex items-center gap-3">
            <AlertTriangle size={16} className={peer.issues > 0 ? 'text-amber-500' : 'text-gray-600'} />
            <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 font-black uppercase">Alerts</span>
               <span className="text-xs font-bold text-gray-200">{peer.issues} Active</span>
            </div>
         </div>
      </div>

      <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 py-2 rounded-xl border border-blue-500/20">
           VIEW DETAILS →
         </div>
      </div>
      
      {!isOnline && (
        <div className="mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">
          Last seen {Math.floor((Date.now() - peer.ts) / 60000)}m ago
        </div>
      )}
    </div>
  );
}

function MachineDetailPanel({ data, ip }) {
  // simplified view of the dashboard components
  const score = data.scores?.total || 0;
  const grade = data.scores?.grade || '-';

  return (
    <div className="space-y-8 pb-12">
       {/* Score Hero */}
       <div className="bg-[#0f0f1e] border border-[#1e1e38] rounded-[32px] p-8 flex flex-col items-center text-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="64" cy="64" r="58" stroke="#16162a" strokeWidth="12" fill="transparent" />
               <circle 
                 cx="64" cy="64" r="58" stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'} 
                 strokeWidth="12" fill="transparent" 
                 strokeDasharray="364.4"
                 strokeDashoffset={364.4 - (364.4 * score) / 100}
                 strokeLinecap="round"
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{score}</span>
                <span className="text-sm font-bold text-gray-500 uppercase">Grade {grade}</span>
             </div>
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-widest">Global Health Score</h3>
          <p className="text-gray-500 text-xs font-bold mt-2">Remote Telemetry from {ip}</p>
       </div>

       {/* Sub-Metrics Section */}
       <div className="grid grid-cols-2 gap-4">
          <MetricCard 
            title="CPU Health" 
            value={data.scores?.cpu || '??'} 
            score={data.scores?.cpu} 
            icon={<Activity size={18} />} 
          />
          <MetricCard 
            title="Battery Health" 
            value={data.scores?.battery || '??'} 
            score={data.scores?.battery} 
            icon={<Battery size={18} />} 
          />
          <MetricCard 
            title="Storage Health" 
            value={data.scores?.disk || '??'} 
            score={data.scores?.disk} 
            icon={<Database size={18} />} 
          />
          <MetricCard 
            title="System Hygiene" 
            value={data.scores?.hygiene || '??'} 
            score={data.scores?.hygiene} 
            icon={<ShieldCheck size={18} />} 
          />
       </div>

       {/* Issues List */}
       <div className="space-y-4">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
             <AlertTriangle size={12} className="text-amber-500" />
             Fix Recommendations ({data.recommendations?.length || 0})
          </h4>
          <div className="space-y-2">
             {data.recommendations?.map((rec, i) => (
                <div key={i} className="bg-[#16162a] border border-[#1e1e38] p-4 rounded-2xl flex gap-4">
                   <div className={`shrink-0 w-8 h-8 rounded-lg ${rec.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'} flex items-center justify-center`}>
                      <Zap size={14} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white uppercase leading-relaxed">{rec.issue}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">{rec.impact}</p>
                   </div>
                </div>
             ))}
             {(!data.recommendations || data.recommendations.length === 0) && (
                <div className="p-8 text-center bg-emerald-500/5 border border-dashed border-emerald-500/10 rounded-2xl">
                   <ShieldCheck className="mx-auto text-emerald-500 mb-2" />
                   <p className="text-xs font-black text-emerald-500/60 uppercase">System Optimal</p>
                </div>
             )}
          </div>
       </div>

       {/* Hardware Specs Snapshot */}
       <div className="bg-[#0f0f1e] border border-[#1e1e38] rounded-3xl p-6">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Hardware Telemetry</h4>
          <div className="space-y-3">
             <SpecItem label="CPU" value={`${data.raw?.cpu?.manufacturer} ${data.raw?.cpu?.brand}`} />
             <SpecItem label="RAM" value={`${Math.round(data.raw?.memLayout?.[0]?.size / 1e9) || 16} GB ${data.raw?.memLayout?.[0]?.type || 'DDR4'}`} />
             <SpecItem label="OS" value={data.metadata?.OSVersion || 'Windows 11'} />
             <SpecItem label="Battery" value={`${data.raw?.battery?.chemistry} ${data.raw?.battery?.type}`} />
          </div>
       </div>
    </div>
  );
}

function MetricCard({ title, value, score, icon }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="bg-[#16162a] border border-[#1e1e38] p-5 rounded-3xl flex flex-col items-center text-center">
       <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center ${color} mb-3`}>
          {icon}
       </div>
       <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{title}</span>
       <span className={`text-xl font-black mt-1 ${color}`}>{value}%</span>
    </div>
  );
}

function SpecItem({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#1e1e38] last:border-0">
       <span className="text-[10px] text-gray-500 font-black uppercase">{label}</span>
       <span className="text-[11px] text-gray-300 font-bold truncate max-w-[180px]" title={value}>{value}</span>
    </div>
  );
}
