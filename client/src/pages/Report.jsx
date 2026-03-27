import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchScanById } from '../api';
import { ArrowLeft, Clock } from 'lucide-react';
import { DataProvider } from '../context/DataContext';

import { TopNav } from '../components/TopNav';
import { ScoreCard } from '../components/ScoreCard';
import { QuickStats } from '../components/QuickStats';
import { PowerBlockers } from '../components/PowerBlockers';
import { BatteryPanel } from '../components/BatteryPanel';
import { CpuPanel } from '../components/CpuPanel';
import { RamPanel } from '../components/RamPanel';
import { ThermalPanel } from '../components/ThermalPanel';
import { DiskPanel } from '../components/DiskPanel';
import { DriverPanel } from '../components/DriverPanel';
import { FixRecommendations } from '../components/FixRecommendations';

export function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchScanById(id);
        if (!result) throw new Error("Scan not found");
        setData(result);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <TopNav />
        <div className="flex h-screen items-center justify-center pt-14">
          <div className="w-8 h-8 border-4 border-[#333] border-t-white rounded-full spin-anim" />
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <TopNav />
        <div className="flex h-screen items-center justify-center pt-14 flex-col gap-5">
          <div className="text-red-500 font-bold bg-red-500/10 border border-red-500/30 px-6 py-4 rounded-xl">{errorMsg || "Scan not found"}</div>
          <button onClick={() => navigate('/history')} className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors border border-[#333] hover:bg-[#222] px-5 py-2.5 rounded-xl font-bold tracking-wide">
            <ArrowLeft size={16} />
            <span>Back to History</span>
          </button>
        </div>
      </div>
    );
  }

  const scanDate = new Date(data.scan.timestamp).toLocaleString(undefined, {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <DataProvider value={data}>
      <TopNav lastScanTimestamp={data.scan?.timestamp} />
      
      <div className="w-full bg-yellow-500/10 border-b border-yellow-500/30 pt-14 pb-3 px-6 z-40 relative shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 min-h-[40px]">
          <div className="flex items-center space-x-3 text-yellow-500">
            <Clock size={16} className="shrink-0 mt-0.5" />
            <span className="text-[11px] sm:text-xs font-bold tracking-wide leading-relaxed">
              You are viewing a historical scan from <span className="text-yellow-400">{scanDate}</span>. This is not your current PC state.
            </span>
          </div>
          <button onClick={() => navigate('/')} className="shrink-0 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1.5 rounded-full transition-colors shadow-md w-full sm:w-auto mt-2 sm:mt-0">
            View Latest Scan
          </button>
        </div>
      </div>

      <div className="pb-16 w-full pt-6">
        <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          <button onClick={() => navigate('/history')} className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors mb-6 group w-fit bg-[#111] border border-[#222] px-3 py-1.5 rounded-md hover:border-[#333]">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to History</span>
          </button>
          
          <ScoreCard 
             scores={data.scores} 
             deviceModel={data.raw?.metadata?.Model}
             lastScanTime={data.scan?.timestamp}
             issueCount={data.scan?.issue_count_critical || 0}
             scanId={data.scan?.id}
             raw={data.raw}
          />
        </div>
        
        <div className="mt-8 mb-2">
           <QuickStats />
        </div>
        
        <div className="p-4 sm:p-6 lg:px-12 max-w-7xl mx-auto space-y-6">
          <PowerBlockers />
          <BatteryPanel />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="col-span-1 flex flex-col">
              <CpuPanel />
            </div>
            <div className="col-span-1 flex flex-col gap-6">
              <RamPanel />
              <ThermalPanel />
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="col-span-1 flex flex-col">
              <DiskPanel />
            </div>
            <div className="col-span-1 flex flex-col">
              <DriverPanel />
            </div>
          </div>
          <div className="mt-8">
            <FixRecommendations />
          </div>
        </div>
      </div>
    </DataProvider>
  );
}
