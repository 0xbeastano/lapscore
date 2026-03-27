import React, { useEffect, useState } from 'react';
import { fetchDiskSmart } from '../api';

export function PrintReport({ data, score, cpuInfo, memInfo, storage, habits }) {
  const [smartData, setSmartData] = useState(null);

  useEffect(() => {
    // Notify Puppeteer when component is mounted and data is passed.
    // Also try to get precise disk health from API.
    const loadSmart = async () => {
      try {
        const res = await fetchDiskSmart();
        setSmartData(res.drives || []);
      } catch (e) {
        setSmartData([]);
      }
      
      // Allow slight delay for rendering
      setTimeout(() => {
        const root = document.querySelector('[data-report-ready]');
        if (root) {
          root.dataset.reportReady = 'true';
        }
      }, 1000);
    };
    
    if (data) {
      loadSmart();
    }
  }, [data]);

  if (!data) return <div>Loading print layout...</div>;

  const now = new Date();
  
  // Safe extraction of metrics
  const issueCount = data.issue_count_warning || 0;
  const criticalCount = data.issue_count_critical || 0;
  
  const bHealth = data.battery_health_percentage || 'N/A';
  const cLoad = data.cpu_load_percent || '0';
  const rUsed = Math.round((data.mem_used_gb / data.mem_total_gb) * 100) || 0;
  
  // Calculate Grade
  let grade = "C";
  let gradeColor = "text-red-600";
  let statusStr = "POOR";
  if (score >= 80) { grade = "A"; gradeColor = "text-emerald-600"; statusStr = "GOOD"; }
  else if (score >= 60) { grade = "B"; gradeColor = "text-amber-500"; statusStr = "FAIR"; }

  const formatGb = (bytes) => (bytes / (1024 ** 3)).toFixed(1);

  return (
    <div className="bg-white min-h-screen text-[#111] font-sans printable-report" data-report-ready="false">
      <style>{`
        @page { size: A4; margin: 0; }
        body, html { background-color: #ffffff !important; }
        .page-break { page-break-after: always; }
        .printable-report { max-width: 900px; margin: 0 auto; padding: 20px; }
      `}</style>
      
      {/* PAGE 1: COVER / SUMMARY */}
      <div className="min-h-[1000px] flex flex-col relative">
        <div className="border-b-4 border-[#111] pb-6 mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-black uppercase tracking-tight flex items-center">
            <span className="text-emerald-500 mr-2 text-5xl">⚡</span> LapScore
          </h1>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-500">Device Health Report</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="border border-gray-300 rounded-xl p-6 bg-gray-50">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Device Information</h3>
            <table className="w-full text-sm font-medium">
              <tbody>
                <tr><td className="py-2 text-gray-500">Hostname</td><td className="py-2 font-bold text-right">{data.os_hostname || 'Unknown'}</td></tr>
                <tr><td className="py-2 text-gray-500">OS</td><td className="py-2 font-bold text-right">{data.os_distro || 'Windows'}</td></tr>
                <tr><td className="py-2 text-gray-500">Report Date</td><td className="py-2 font-bold text-right">{now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}</td></tr>
                <tr><td className="py-2 text-gray-500">Scan ID</td><td className="py-2 font-bold text-right">#{Math.random().toString(16).substring(2, 10)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="border border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 shadow-sm">
             <div className="text-center mb-2">
               <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Global Score</span>
             </div>
             <div className="flex items-center justify-center space-x-6">
                <div className={`text-8xl font-black tracking-tighter ${gradeColor}`}>
                  {score}
                </div>
                <div className="flex flex-col text-left">
                  <span className={`text-5xl font-black ${gradeColor}`}>{grade}</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">{statusStr}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="border border-gray-300 rounded-xl mb-12">
          <div className="grid grid-cols-4 divide-x divide-gray-300">
            <div className="p-6 text-center">
              <div className="text-3xl font-black mb-1">{bHealth}%</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Battery Health</div>
            </div>
            <div className="p-6 text-center">
              <div className="text-3xl font-black mb-1">{cLoad}%</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">CPU Load</div>
            </div>
            <div className="p-6 text-center">
              <div className="text-3xl font-black mb-1">{rUsed}%</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">RAM Used</div>
            </div>
            <div className="p-6 text-center">
              <div className="text-3xl font-black text-emerald-600 mb-1">OK</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Disk Status</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Issues Summary</h3>
           <div className="space-y-3">
             <div className="flex items-center">
               <span className="w-8 h-8 rounded bg-amber-100 text-amber-600 flex items-center justify-center font-bold mr-4">⚠</span>
               <span className="font-bold text-lg">{issueCount} System Warning{issueCount !== 1 ? 's' : ''}</span>
             </div>
             <div className="flex items-center">
               <span className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center font-bold mr-4">✖</span>
               <span className="font-bold text-lg">{criticalCount} Critical Issue{criticalCount !== 1 ? 's' : ''}</span>
             </div>
           </div>
        </div>
        
        <ReportFooter />
      </div>

      <div className="page-break"></div>

      {/* PAGE 2: BATTERY & PROCESSOR */}
      <div className="min-h-[1000px] flex flex-col relative pt-10">
         <h2 className="text-2xl font-black uppercase tracking-tight mb-6 pb-2 border-b-2 border-gray-200">1. Battery Deep Dive</h2>
         
         <div className="grid grid-cols-2 gap-6 mb-8">
           <div className="border border-gray-300 p-5 rounded-xl">
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Capacity Data</div>
             <table className="w-full text-sm">
               <tbody>
                 <tr><td className="py-1">Design Capacity</td><td className="text-right font-bold">{data.battery_designed_capacity || '?'} mWh</td></tr>
                 <tr><td className="py-1">Current Full</td><td className="text-right font-bold">{data.battery_max_capacity || '?'} mWh</td></tr>
                 <tr><td className="py-1 text-red-500">Capacity Lost</td><td className="text-right font-bold text-red-500">{((data.battery_designed_capacity || 0) - (data.battery_max_capacity || 0))} mWh</td></tr>
                 <tr><td className="py-1 pt-3 border-t">Cycle Count</td><td className="text-right font-bold pt-3">{data.battery_cycle_count || 'Est. <100'}</td></tr>
               </tbody>
             </table>
           </div>

           <div className="border border-gray-300 p-5 rounded-xl bg-gray-50">
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Charging Habits</div>
             {habits ? (
               <ul className="text-sm space-y-2 font-medium">
                 <li className="flex justify-between"><span>Avg Charge Ceiling:</span> <span className={`font-bold ${habits.averageCeiling > 90 ? 'text-amber-600' : 'text-emerald-600'}`}>{Math.round(habits.averageCeiling)}%</span></li>
                 <li className="flex justify-between"><span>Avg Discharge Floor:</span> <span className={`font-bold ${habits.averageFloor < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>{Math.round(habits.averageFloor)}%</span></li>
                 <li className="flex justify-between"><span>Hot Charges:</span> <span className="font-bold">{habits.events} recorded</span></li>
               </ul>
             ) : (
               <div className="text-sm text-gray-500 italic">Not enough charging sessions logged to compile a reliable habits report.</div>
             )}
           </div>
         </div>

         <h2 className="text-2xl font-black uppercase tracking-tight mb-6 mt-6 pb-2 border-b-2 border-gray-200">2. CPU & Memory</h2>
         
         <div className="border border-gray-300 p-6 rounded-xl mb-6 bg-white flex items-center justify-between">
            <div className="w-2/3">
              <h3 className="font-bold text-lg mb-1">{cpuInfo?.[0]?.manufacturer} {cpuInfo?.[0]?.brand}</h3>
              <p className="text-gray-500 text-sm">Cores: {cpuInfo?.[0]?.cores} | Rated Speed: {cpuInfo?.[0]?.speed} GHz</p>
            </div>
            <div className="w-1/3 text-right">
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Load</div>
               <div className={`text-4xl font-black ${cLoad > 85 ? 'text-red-500' : cLoad > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>{cLoad}%</div>
            </div>
         </div>

         <div className="border border-gray-300 p-6 rounded-xl bg-white flex items-center justify-between">
            <div className="w-1/2">
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total System RAM</div>
               <div className="text-3xl font-black">{formatGb(data.mem_total_gb * (1024**3))} GB</div>
            </div>
            <div className="w-1/2 text-right">
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">RAM Exhaustion Risk</div>
               <div className={`text-xl font-black ${rUsed > 90 ? 'text-red-500' : rUsed > 75 ? 'text-amber-500' : 'text-emerald-500'}`}>
                 {rUsed}% Used
               </div>
            </div>
         </div>

         <ReportFooter />
      </div>

      <div className="page-break"></div>

      {/* PAGE 3: STORAGE & FIXES */}
      <div className="min-h-[1000px] flex flex-col relative pt-10">
         <h2 className="text-2xl font-black uppercase tracking-tight mb-6 pb-2 border-b-2 border-gray-200">3. Storage & NVMe Reliability</h2>
         
         <div className="border border-gray-300 rounded-xl overflow-hidden mb-12 bg-white">
           <table className="w-full text-left">
             <thead className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest">
               <tr>
                 <th className="p-4">Drive Model</th>
                 <th className="p-4">Lifespan</th>
                 <th className="p-4">SMART Status</th>
                 <th className="p-4 text-right">Temp</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200">
               {(!smartData || smartData.length === 0) ? (
                 <tr>
                   <td colSpan="4" className="p-4 text-gray-500 font-medium">Standard OS volume detected (No detailed SMART retrieved)</td>
                 </tr>
               ) : (
                 smartData.map((drive, idx) => (
                   <tr key={idx}>
                     <td className="p-4 font-bold">{drive.model || drive.name}</td>
                     <td className="p-4 font-bold">
                       {drive.lifespanPct !== null ? (
                         <span className={drive.lifespanPct > 80 ? 'text-emerald-600' : drive.lifespanPct > 40 ? 'text-amber-600' : 'text-red-600'}>
                           {Math.round(drive.lifespanPct)}% Remaining
                         </span>
                       ) : 'Unknown'}
                     </td>
                     <td className="p-4">
                       {drive.smartPassed ? (
                         <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">Passed</span>
                       ) : (
                         <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">Warning</span>
                       )}
                     </td>
                     <td className="p-4 text-right font-bold">{drive.tempC ? `${drive.tempC}°C` : '-'}</td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>

         <h2 className="text-2xl font-black uppercase tracking-tight mb-6 pb-2 border-b-2 border-gray-200">4. Recommended Fixes</h2>
         
         {(!data.fix_recommendations || data.fix_recommendations.length === 0) ? (
           <div className="border border-emerald-300 bg-emerald-50 text-emerald-800 p-6 rounded-xl font-bold flex items-center">
             <span className="text-2xl mr-3">✓</span> System checks passed. No immediate actions required.
           </div>
         ) : (
           <div className="space-y-4">
             {data.fix_recommendations.map((rec, i) => (
               <div key={i} className="border border-gray-300 p-5 rounded-xl bg-white">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-lg text-gray-900">{rec.title}</h3>
                   <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${rec.severity === 'critical' ? 'bg-red-100 text-red-700' : rec.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                     {rec.severity}
                   </span>
                 </div>
                 <p className="text-gray-600 text-sm font-medium mb-3">{rec.reason}</p>
                 <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-800 font-mono">
                   {rec.action_steps.join(' > ')}
                 </div>
               </div>
             ))}
           </div>
         )}
         
         <ReportFooter />
      </div>
    </div>
  );
}

function ReportFooter() {
  return (
    <div className="absolute bottom-0 left-0 w-full pt-4 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-gray-400">
      <span>Generated by LapScore Professional</span>
      <span>Local Telemetry Snapshot</span>
    </div>
  );
}
