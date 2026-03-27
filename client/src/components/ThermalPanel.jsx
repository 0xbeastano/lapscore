import { Thermometer, Wind, AlertCircle } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';

export default function ThermalPanel({ sensors }) {
  if (!sensors) return null;

  const getStatus = (temp) => {
    if (temp >= 90) return { status: 'critical', label: 'Overheating' };
    if (temp >= 75) return { status: 'warning', label: 'Sub-Optimal' };
    return { status: 'healthy', label: 'Efficient' };
  };

  const mainTemp = sensors.maxTemp || 0;
  const status = getStatus(mainTemp);

  return (
    <Card className="h-full flex flex-col" accent="from-orange-500/40 via-red-500/40 to-transparent">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
            <Thermometer size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Thermal Profile</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Sensors & Dissipation</p>
          </div>
        </div>
        <StatusBadge status={status.status} label={status.label} pulse={status.status === 'critical'} />
      </div>

      <div className="px-6 py-4 flex-1 space-y-6 flex flex-col justify-center">
        <div className="bg-[#16162a] border border-[#1e1e38] p-6 rounded-2xl text-center space-y-2 group hover:border-orange-500/30 transition-all">
          <span className={`text-5xl font-black tabular-nums tracking-tighter transition-all ${mainTemp > 80 ? 'text-red-500' : 'text-orange-500'}`}>
            {mainTemp}°<span className="text-2xl text-gray-500 ml-1">C</span>
          </span>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Package Temperature</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#16162a]/50 p-3 rounded-xl border border-[#1e1e38] flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ambient</span>
            <span className="text-xs font-black text-white">{sensors.avgTemp || '--'}°C</span>
          </div>
          <div className="bg-[#16162a]/50 p-3 rounded-xl border border-[#1e1e38] flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hottest Pin</span>
            <span className="text-xs font-black text-white">{sensors.maxTemp || '--'}°C</span>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start space-x-3">
          <AlertCircle size={14} className="text-orange-400 mt-0.5" />
          <p className="text-[11px] text-orange-200/80 leading-snug font-medium">
            Thermal {mainTemp > 85 ? 'throttling is ACTIVE. Fan speeds are pinned.' : 'overhead is GOOD. System is currently fanless if supported.'}
          </p>
        </div>
      </div>

      <div className="px-6 py-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
        <span className="text-gray-600">Airflow: 1.2 CFM</span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <Wind size={12} className="text-blue-500" /> System Steady
        </span>
      </div>
    </Card>
  );
}
