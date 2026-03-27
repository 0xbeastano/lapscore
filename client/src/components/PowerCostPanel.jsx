import { useState, useEffect } from 'react';
import { BatteryCharging, DollarSign, Settings, TrendingUp, Info } from 'lucide-react';
import { fetchPowerStats, setPowerTariff } from '../api';
import Card from './ui/Card';

export default function PowerCostPanel() {
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState(8);
  const [currency, setCurrency] = useState('INR');

  const load = () => {
    fetchPowerStats().then(d => {
      setStats(d);
      setRate(d.ratePerKwh);
      setCurrency(d.currency);
    });
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const handleSave = () => {
    setPowerTariff(rate, currency).then(d => {
      setStats(d.stats);
      setEditing(false);
    });
  };

  if (!stats) return null;

  return (
    <Card className="h-full flex flex-col" accent="from-amber-500/40 via-orange-500/40 to-transparent">
      <div className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
             <BatteryCharging size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#f1f5f9] tracking-tighter uppercase">Power & Cost</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Energy Efficiency & Billing</p>
          </div>
        </div>
        <button 
          onClick={() => editing ? handleSave() : setEditing(true)}
          className="p-2 rounded-lg bg-[#16162a] border border-[#1e1e38] text-gray-500 hover:text-white transition-colors"
        >
          {editing ? <Info size={16} className="text-emerald-500" /> : <Settings size={16} />}
        </button>
      </div>

      <div className="px-6 py-6 flex-1 space-y-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'TODAY', wh: stats.todayWh, cost: stats.todayCost },
            { label: 'WEEK', wh: stats.weekWh, cost: stats.weekCost },
            { label: 'MONTH', wh: stats.monthWh, cost: stats.monthCost }
          ].map((m, i) => (
            <div key={i} className="bg-[#16162a] border border-[#1e1e38] p-4 rounded-xl flex flex-col items-center justify-center transition-all hover:bg-[#1a1a35]">
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">{m.label}</span>
              <span className="text-xs font-black text-gray-300 tabular-nums">{m.wh} Wh</span>
              <span className="text-xl font-black text-white tabular-nums tracking-tighter mt-1">{currency === 'INR' ? '₹' : '$'}{m.cost}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t border-[#1e1e38]">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-amber-500" />
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Live Draw</span>
            </div>
            <span className="text-lg font-black text-white tabular-nums tracking-tighter">~28W</span>
          </div>
          
          <div className="h-1.5 w-full bg-[#16162a] rounded-full overflow-hidden border border-[#1e1e38]">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 w-[28%] shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all duration-1000" />
          </div>

          <div className="bg-[#16162a]/50 p-4 rounded-xl border border-dashed border-[#1e1e38]">
            {editing ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">Elect. Rate ({currency}/kWh)</p>
                  <input 
                    type="number" 
                    value={rate} 
                    onChange={e => setRate(parseFloat(e.target.value))}
                    className="w-full bg-[#080810] border border-amber-500/20 rounded-lg p-2 text-sm font-black text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">Cur.</p>
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                    className="bg-[#080810] border border-amber-500/20 rounded-lg p-2 text-sm font-black text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-gray-500" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Rate per kWh:</span>
                </div>
                <span className="text-xs font-black text-emerald-400">{currency === 'INR' ? '₹' : '$'}{rate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#080810]/50 border-t border-[#1e1e38] flex justify-between items-center px-6">
        <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase">Estimator: CPU Load Heuristic</span>
        <span className="text-[9px] text-amber-500 font-bold tracking-widest uppercase">₹/kWh BASE: {rate}</span>
      </div>
    </Card>
  );
}
