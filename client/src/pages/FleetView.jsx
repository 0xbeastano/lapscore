import { useState, useEffect } from 'react';
import { fetchDevices, fetchDeviceSummary } from '../api';
import { Server, Activity, Thermometer, Database, Battery, AlertTriangle, Monitor, Laptop, Clock, ShieldCheck, WifiOff } from 'lucide-react';


export function FleetView() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchDevices();
        if (mounted) {
          setDevices(data);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const onlineDevices = devices.filter(d => d.is_online === 1);
  const offlineDevices = devices.filter(d => d.is_online === 0);
  
  const warnings = devices.reduce((sum, d) => sum + (d.last_score < 80 && d.last_score >= 60 ? 1 : 0), 0);
  const criticals = devices.reduce((sum, d) => sum + (d.last_score < 60 && d.last_score > 0 ? 1 : 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 relative pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center mb-1">
            Fleet Overview
            <span className="ml-4 bg-[#111] border border-[#333] px-3 py-0.5 rounded-full text-sm text-gray-400">
              {devices.length} {devices.length === 1 ? 'device' : 'devices'}
            </span>
          </h1>
          <p className="text-sm font-bold text-gray-500 flex items-center">
            <Server size={14} className="mr-2" />
            Local network discovery · Updates every 60s
          </p>
        </div>
        
        {/* Summary Bar */}
        <div className="flex bg-[#0a0a0a] border border-[#222] rounded-2xl p-2 gap-2 text-xs font-bold shadow-lg">
          <div className="px-3 py-1.5 flex items-center bg-[#111] border border-[#222] rounded-xl text-emerald-400">
            <Activity size={12} className="mr-1.5" />
            {onlineDevices.length} Online
          </div>
          {warnings > 0 && (
            <div className="px-3 py-1.5 flex items-center bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
              <AlertTriangle size={12} className="mr-1.5" />
              {warnings} Warning
            </div>
          )}
          {criticals > 0 && (
            <div className="px-3 py-1.5 flex items-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
              <AlertTriangle size={12} className="mr-1.5" />
              {criticals} Critical
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-[#0a0a0a] border border-[#222] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-red-500 font-bold flex items-center">
          <AlertTriangle className="mr-3" /> Failed to load fleet data. Is the local LapScore service running?
        </div>
      ) : (
        <>
          {/* Active Devices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {onlineDevices.map((device, i) => (
              <DeviceCard key={device.device_id} device={device} isFirst={i === 0} />
            ))}
            
            {onlineDevices.length === 0 && (
               <div className="col-span-full h-40 flex flex-col items-center justify-center border border-dashed border-[#333] rounded-3xl text-gray-500">
                 <Server size={32} className="mb-3 opacity-20" />
                 <p className="font-bold">No functional devices found on the local network.</p>
               </div>
            )}
          </div>

          {/* Offline / Inactive Devices */}
          {offlineDevices.length > 0 && (
            <div className="mt-12">
              <h3 className="text-sm font-black text-gray-500 tracking-widest uppercase mb-4 flex items-center">
                <WifiOff size={14} className="mr-2" /> Offline ({offlineDevices.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offlineDevices.map((device) => (
                  <DeviceCard key={device.device_id} device={device} isOffline />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DeviceCard({ device, isFirst, isOffline }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (isOffline) return;

    const load = async () => {
      try {
        const data = await fetchDeviceSummary(device.device_id);
        if (mounted) setSummary(data);
      } catch (e) {
        // ignore
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [device.device_id, isOffline]);

  const score = isOffline ? 0 : Math.round(summary?.score_total || device.last_score || 0);
  
  let borderColor = "border-[#222]";
  let statusColor = "text-gray-500";
  let statusDot = "bg-gray-500";
  let grade = "?";

  if (!isOffline) {
    if (score >= 80) {
      borderColor = "border-l-emerald-500 border-t-[#222] border-r-[#222] border-b-[#222]";
      statusColor = "text-emerald-500";
      statusDot = "bg-emerald-500 shadow-[0_0_8px_#10b981]";
      grade = "A";
    } else if (score >= 60) {
      borderColor = "border-l-amber-500 border-t-[#222] border-r-[#222] border-b-[#222]";
      statusColor = "text-amber-500";
      statusDot = "bg-amber-500 shadow-[0_0_8px_#f59e0b]";
      grade = "B";
    } else {
      borderColor = "border-l-red-500 border-t-[#222] border-r-[#222] border-b-[#222]";
      statusColor = "text-red-500";
      statusDot = "bg-red-500 shadow-[0_0_8px_#ef4444]";
      grade = "C";
    }
  }

  const handleView = () => {
    if (isFirst) {
      window.location.hash = "#/";
    } else {
      window.open(`http://${device.ip_address}:7821`, '_blank');
    }
  };

  const getRelativeTime = (ts) => {
    if (!ts) return 'Never';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `Just now`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const batteryScore = summary?.score_battery;
  const cpuScore = summary?.score_cpu;
  const diskScore = summary?.score_disk;

  return (
    <div className={`bg-[#0a0a0a] border-l-4 rounded-2xl flex flex-col p-5 hover:bg-[#0f0f0f] transition-colors relative shadow-lg ${borderColor} ${isOffline ? 'opacity-60 grayscale' : ''}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="truncate pr-4">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${statusDot}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
              {isOffline ? 'Offline' : 'Online'} {isFirst && <span className="text-gray-500 ml-1">(This PC)</span>}
            </span>
          </div>
          <h3 className="text-base font-bold text-white truncate" title={device.hostname}>
            {device.hostname || 'Unknown Device'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {device.ip_address} · {device.os_name?.split(' ')[0] || 'Unknown OS'}
          </p>
        </div>
        
        {/* Simplified Score mini-display */}
        <div className="flex-shrink-0 bg-[#111] border border-[#222] rounded-xl p-2 w-16 h-16 flex flex-col items-center justify-center shadow-inner">
          <span className={`text-xl font-black ${statusColor}`}>
            {score || '-'}
          </span>
          <span className="text-[10px] text-gray-600 font-bold uppercase">{grade}</span>
        </div>
      </div>

      {/* Metrics Row */}
      {!isOffline && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[#111] rounded-lg p-2 border border-[#222] flex flex-col items-center justify-center">
            <Battery size={12} className={batteryScore < 60 ? "text-red-500 mb-1" : "text-gray-400 mb-1"} />
            <span className="text-[11px] font-bold text-gray-300">{batteryScore ? `${Math.round(batteryScore)}%` : '-'}</span>
          </div>
          <div className="bg-[#111] rounded-lg p-2 border border-[#222] flex flex-col items-center justify-center">
            <Activity size={12} className={cpuScore < 60 ? "text-red-500 mb-1" : "text-gray-400 mb-1"} />
            <span className="text-[11px] font-bold text-gray-300">{cpuScore ? `${Math.round(cpuScore)}%` : '-'}</span>
          </div>
          <div className="bg-[#111] rounded-lg p-2 border border-[#222] flex flex-col items-center justify-center">
            <Database size={12} className={diskScore < 60 ? "text-red-500 mb-1" : "text-gray-400 mb-1"} />
            <span className="text-[11px] font-bold text-gray-300">{diskScore ? `${Math.round(diskScore)}%` : '-'}</span>
          </div>
        </div>
      )}

      {/* Offline specific UI */}
      {isOffline && (
        <div className="flex items-center text-xs font-bold text-gray-500 mb-5 bg-[#111] p-3 rounded-xl">
          <Clock size={12} className="mr-2" />
          Last seen: {getRelativeTime(device.last_seen)}
        </div>
      )}

      {/* Footer / Action */}
      <div className="mt-auto pt-4 border-t border-[#1a1a1a] flex justify-between items-center">
        {summary?.issue_count_warning > 0 && !isOffline ? (
          <span className="text-[10px] font-bold text-amber-500 flex items-center bg-amber-500/10 px-2 py-1 rounded">
            <AlertTriangle size={10} className="mr-1" />
            {summary.issue_count_warning} {summary.issue_count_warning === 1 ? 'Warning' : 'Warnings'}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-gray-600 flex items-center">
            <ShieldCheck size={10} className="mr-1" /> Protected
          </span>
        )}
        
        <button 
          onClick={handleView}
          disabled={isOffline && !isFirst}
          className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
            isOffline && !isFirst 
              ? 'text-gray-600 bg-transparent cursor-not-allowed' 
              : 'text-white bg-[#111] border border-[#333] hover:bg-[#222] hover:border-blue-500'
          }`}
        >
          {isFirst ? 'Dashboard' : 'View →'}
        </button>
      </div>
    </div>
  );
}
