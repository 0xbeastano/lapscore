import { useState, useEffect } from 'react';
import { TopNav } from '../components/TopNav';
import { fetchSettings, saveSettings } from '../api';
import { 
  Settings, 
  Bell, 
  Cpu, 
  Activity, 
  Battery, 
  Database, 
  Thermometer, 
  Zap, 
  Bot, 
  Share2, 
  Save, 
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newAiApp, setNewAiApp] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await saveSettings(settings);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings');
    }
    setSaving(false);
  };

  const updateSection = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateAlert = (category, type, value) => {
    setSettings(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        [category]: {
          ...prev.alerts[category],
          [type]: parseInt(value, 10)
        }
      }
    }));
  };

  const addAiApp = () => {
    if (!newAiApp.trim()) return;
    const newList = [...settings.aiMonitoring.processList, newAiApp.trim().toLowerCase()];
    updateSection('aiMonitoring', 'processList', Array.from(new Set(newList)));
    setNewAiApp('');
  };

  const removeAiApp = (app) => {
    const newList = settings.aiMonitoring.processList.filter(a => a !== app);
    updateSection('aiMonitoring', 'processList', newList);
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-[#080810] pt-32 flex flex-col items-center justify-center">
        <RefreshCw className="text-blue-500 animate-spin mb-4" size={32} />
        <p className="text-gray-500 font-black text-xs uppercase tracking-widest">Loading Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] pt-24 pb-20 px-6">
      <TopNav />

      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
           <div>
             <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-4 uppercase">
               Settings
               <Settings className="text-gray-700" size={24} />
             </h1>
             <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">
               Global control center for PCMon
             </p>
           </div>
           
           <button 
             onClick={handleSave}
             disabled={saving}
             className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
               saved 
                 ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                 : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
             } ${saving ? 'opacity-70 cursor-wait' : ''}`}
           >
             {saving ? <RefreshCw className="animate-spin" size={16} /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
             {saving ? 'Saving...' : saved ? 'Settings Saved' : 'Save Changes'}
           </button>
        </header>

        <div className="space-y-6">
           {/* Monitoring Section */}
           <Section title="Monitoring" icon={<Activity size={18} />}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <h4 className="text-white font-bold text-sm">Auto-scan interval</h4>
                    <p className="text-gray-500 text-[11px] font-bold">How often LapScore runs a full health diagnostic (minutes)</p>
                 </div>
                 <input 
                   type="number" 
                   value={settings.monitoring.autoScanIntervalMin} 
                   onChange={e => updateSection('monitoring', 'autoScanIntervalMin', parseInt(e.target.value, 10))}
                   className="w-24 bg-[#16162a] border border-[#1e1e38] rounded-xl px-4 py-2 text-white font-bold focus:border-blue-500 outline-none"
                 />
              </div>
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#1e1e38]">
                 <div>
                    <h4 className="text-white font-bold text-sm">Background polling</h4>
                    <p className="text-gray-500 text-[11px] font-bold">Collect real-time CPU and Memory stats every 5 seconds</p>
                 </div>
                 <Toggle 
                   active={settings.monitoring.backgroundPolling} 
                   onToggle={() => updateSection('monitoring', 'backgroundPolling', !settings.monitoring.backgroundPolling)} 
                 />
              </div>
           </Section>

           {/* Alerts Section */}
           <Section title="Alert Thresholds" icon={<Bell size={18} />}>
              <p className="text-gray-500 text-[11px] font-bold mb-6">Define when metrics trigger warnings (Amber) or critical (Red) alerts.</p>
              <div className="space-y-6">
                 <ThresholdRow 
                    label="CPU Load" 
                    icon={<Cpu size={14} className="text-blue-400" />} 
                    warn={settings.alerts.cpu.warn} 
                    critical={settings.alerts.cpu.critical} 
                    onWarnChange={v => updateAlert('cpu', 'warn', v)}
                    onCriticalChange={v => updateAlert('cpu', 'critical', v)}
                    unit="%"
                 />
                 <ThresholdRow 
                    label="RAM Usage" 
                    icon={<Activity size={14} className="text-emerald-400" />} 
                    warn={settings.alerts.ram.warn} 
                    critical={settings.alerts.ram.critical} 
                    onWarnChange={v => updateAlert('ram', 'warn', v)}
                    onCriticalChange={v => updateAlert('ram', 'critical', v)}
                    unit="%"
                 />
                 <ThresholdRow 
                    label="Battery Health" 
                    icon={<Battery size={14} className="text-amber-400" />} 
                    warn={settings.alerts.battery.warn} 
                    critical={settings.alerts.battery.critical} 
                    onWarnChange={v => updateAlert('battery', 'warn', v)}
                    onCriticalChange={v => updateAlert('battery', 'critical', v)}
                    unit="%"
                    desc="Warn when health falls below"
                 />
                 <ThresholdRow 
                    label="Temperature" 
                    icon={<Thermometer size={14} className="text-red-400" />} 
                    warn={settings.alerts.temp.warn} 
                    critical={settings.alerts.temp.critical} 
                    onWarnChange={v => updateAlert('temp', 'warn', v)}
                    onCriticalChange={v => updateAlert('temp', 'critical', v)}
                    unit="°C"
                 />
                 <ThresholdRow 
                    label="Disk Full" 
                    icon={<Database size={14} className="text-purple-400" />} 
                    warn={settings.alerts.disk.warn} 
                    critical={settings.alerts.disk.critical} 
                    onWarnChange={v => updateAlert('disk', 'warn', v)}
                    onCriticalChange={v => updateAlert('disk', 'critical', v)}
                    unit="%"
                 />
              </div>
           </Section>

           {/* Power Section */}
           <Section title="Power & Cost" icon={<Zap size={18} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                    <label className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">Electricity Rate</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={settings.power.ratePerKwh} 
                      onChange={e => updateSection('power', 'ratePerKwh', parseFloat(e.target.value))}
                      className="w-full bg-[#16162a] border border-[#1e1e38] rounded-xl px-4 py-2 text-white font-bold focus:border-blue-500 outline-none"
                    />
                    <p className="text-gray-600 text-[10px] font-bold mt-2">Rate per kilowatt-hour (kWh)</p>
                 </div>
                 <div>
                    <label className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">Currency</label>
                    <select 
                      value={settings.power.currency} 
                      onChange={e => updateSection('power', 'currency', e.target.value)}
                      className="w-full bg-[#16162a] border border-[#1e1e38] rounded-xl px-4 py-2 text-white font-bold focus:border-blue-500 outline-none appearance-none"
                    >
                       <option value="INR">INR (₹)</option>
                       <option value="USD">USD ($)</option>
                       <option value="EUR">EUR (€)</option>
                       <option value="GBP">GBP (£)</option>
                    </select>
                 </div>
              </div>
           </Section>

           {/* AI Section */}
           <Section title="AI Monitoring" icon={<Bot size={18} />}>
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h4 className="text-white font-bold text-sm">Real-time AI Tracking</h4>
                    <p className="text-gray-500 text-[11px] font-bold">Monitor battery drain and thermals for local LLMs</p>
                 </div>
                 <Toggle 
                   active={settings.aiMonitoring.enabled} 
                   onToggle={() => updateSection('aiMonitoring', 'enabled', !settings.aiMonitoring.enabled)} 
                 />
              </div>
              
              <div className="space-y-4">
                 <label className="text-gray-500 text-[10px] font-black uppercase tracking-widest block">Process Watch-list</label>
                 <div className="flex flex-wrap gap-2">
                    {settings.aiMonitoring.processList.map(app => (
                       <span key={app} className="flex items-center gap-2 bg-[#16162a] border border-[#1e1e38] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          {app}
                          <button onClick={() => removeAiApp(app)} className="text-gray-500 hover:text-red-400">
                             <Trash2 size={12} />
                          </button>
                       </span>
                    ))}
                 </div>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add process name (e.g. ollama)"
                      value={newAiApp}
                      onChange={e => setNewAiApp(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addAiApp()}
                      className="flex-1 bg-[#16162a] border border-[#1e1e38] rounded-xl px-4 py-2 text-white font-bold text-xs focus:border-blue-500 outline-none"
                    />
                    <button 
                      onClick={addAiApp}
                      className="bg-[#1e1e38] text-blue-400 p-2 rounded-xl hover:bg-[#252545] transition-colors"
                    >
                       <Plus size={20} />
                    </button>
                 </div>
              </div>
           </Section>

           {/* Fleet Section */}
           <Section title="Fleet discovery" icon={<Share2 size={18} />}>
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h4 className="text-white font-bold text-sm">LAN Discovery (UDP)</h4>
                    <p className="text-gray-500 text-[11px] font-bold">Allow other machines to see this laptop on the local network</p>
                 </div>
                 <Toggle 
                   active={settings.fleet.discoveryEnabled} 
                   onToggle={() => updateSection('fleet', 'discoveryEnabled', !settings.fleet.discoveryEnabled)} 
                 />
              </div>
              <div>
                 <label className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">UDP Broadcast Port</label>
                 <input 
                    type="number" 
                    value={settings.fleet.broadcastPort} 
                    onChange={e => updateSection('fleet', 'broadcastPort', parseInt(e.target.value, 10))}
                    className="w-32 bg-[#16162a] border border-[#1e1e38] rounded-xl px-4 py-2 text-white font-bold focus:border-blue-500 outline-none"
                 />
                 <p className="text-gray-600 text-[10px] font-bold mt-2">Standard port is 7822. Change only if port conflict exists.</p>
              </div>
           </Section>

           <div className="pt-8 pb-12 flex justify-center">
              <p className="text-gray-700 text-xs font-black uppercase tracking-[0.3em]">PCMon Engine v1.0.4 Pre-Alpha</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-[#0f0f1e] border border-[#1e1e38] rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10">
       <div className="bg-[#16162a]/30 border-b border-[#1e1e38] px-8 py-5 flex items-center gap-3">
          <div className="text-blue-500">{icon}</div>
          <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">{title}</h3>
       </div>
       <div className="p-8">
          {children}
       </div>
    </div>
  );
}

function Toggle({ active, onToggle }) {
  return (
    <button 
      onClick={onToggle}
      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-[#1e1e38]'}`}
    >
       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${active ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function ThresholdRow({ label, icon, warn, critical, onWarnChange, onCriticalChange, unit, desc }) {
  return (
     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-[#16162a] border border-[#1e1e38] flex items-center justify-center">
              {icon}
           </div>
           <div>
              <h4 className="text-white font-bold text-sm">{label}</h4>
              <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{desc || 'Set alarm points'}</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-500 uppercase">Warn</span>
              <input 
                type="number" 
                value={warn} 
                onChange={e => onWarnChange(e.target.value)}
                className="w-24 bg-[#16162a] border border-amber-500/20 rounded-xl pl-10 pr-6 py-2 text-white font-bold focus:border-amber-500 outline-none text-right text-xs"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600">{unit}</span>
           </div>
           <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-red-500 uppercase">Crit</span>
              <input 
                type="number" 
                value={critical} 
                onChange={e => onCriticalChange(e.target.value)}
                className="w-24 bg-[#16162a] border border-red-500/20 rounded-xl pl-10 pr-6 py-2 text-white font-bold focus:border-red-500 outline-none text-right text-xs"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600">{unit}</span>
           </div>
        </div>
     </div>
  );
}
