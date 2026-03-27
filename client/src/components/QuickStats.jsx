import { Monitor, Activity, ShieldCheck, Database, Zap } from 'lucide-react';
import Card from './ui/Card';
import Skeleton from './ui/Skeleton';

export default function QuickStats({ scanData, isScanning = false }) {
  if (!scanData) return null;

  const battery = scanData?.battery || scanData?.raw?.battery;
  const cpu     = scanData?.cpu || scanData?.raw?.cpu;
  const ram     = scanData?.ram || scanData?.raw?.ram;

  // Battery health (same logic as BatteryPanel Fix 1)
  const batteryHealth = (() => {
    const wp = battery?.wearPercent;
    const fc = battery?.FullChargeCapacity;
    const dc = battery?.DesignCapacity;
    if (wp != null && !isNaN(wp))
      return Math.max(0, Math.min(100, Math.round(100 - wp)));
    if (fc && dc) return Math.round((fc / dc) * 100);
    return null;
  })();

  const stats = [
    {
      label: 'PCSCORE',
      val: scanData?.scores?.total
        ? `${scanData.scores.total}/100`
        : '—',
      sub: scanData?.scores?.grade ?? '—',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      icon: Activity
    },
    {
      label: 'BATTERY',
      val: batteryHealth != null
        ? `${batteryHealth}% health`
        : '—',
      sub: battery?.percent != null
        ? `${battery.percent}% charge`
        : '—',
      color: batteryHealth >= 80 ? 'text-emerald-500'
           : batteryHealth >= 60 ? 'text-yellow-500'
           : batteryHealth != null ? 'text-red-500'
           : 'text-gray-500',
      bg: batteryHealth >= 80 ? 'bg-emerald-500/10'
        : batteryHealth >= 60 ? 'bg-yellow-500/10'
        : batteryHealth != null ? 'bg-red-500/10'
        : 'bg-gray-500/10',
      icon: Zap
    },
    {
      label: 'CPU LOAD',
      val: cpu?.CurrentLoad != null
        ? `${Number(cpu.CurrentLoad).toFixed(1)}%`
        : (cpu?.LoadPercentage != null ? `${Number(cpu.LoadPercentage).toFixed(1)}%` : '—'),
      sub: (cpu?.brand?.split(' ').slice(-2).join(' ') || cpu?.Name?.split(' ').slice(1).join(' '))
        ?? '—',
      color: (cpu?.CurrentLoad || cpu?.LoadPercentage) > 80 ? 'text-red-500'
           : (cpu?.CurrentLoad || cpu?.LoadPercentage) > 60 ? 'text-yellow-500'
           : 'text-emerald-500',
      bg: (cpu?.CurrentLoad || cpu?.LoadPercentage) > 80 ? 'bg-red-500/10'
        : (cpu?.CurrentLoad || cpu?.LoadPercentage) > 60 ? 'bg-yellow-500/10'
        : 'bg-emerald-500/10',
      icon: Activity
    },
    {
      label: 'RAM USED',
      val: ram?.TotalVisibleMemorySize != null && ram?.FreePhysicalMemory != null
        ? `${Math.round(((ram.TotalVisibleMemorySize - ram.FreePhysicalMemory) / ram.TotalVisibleMemorySize) * 100)}%`
        : (ram?.usedPercent != null ? `${Math.round(ram.usedPercent)}%` : '—'),
      sub: ram?.TotalVisibleMemorySize
        ? `${((ram.TotalVisibleMemorySize - ram.FreePhysicalMemory)/1024/1024).toFixed(1)}/${(ram.TotalVisibleMemorySize/1024/1024).toFixed(0)} GB`
        : '—',
      color: ram?.TotalVisibleMemorySize != null && ((ram.TotalVisibleMemorySize - ram.FreePhysicalMemory) / ram.TotalVisibleMemorySize) > 0.85 ? 'text-red-500'
           : ram?.TotalVisibleMemorySize != null && ((ram.TotalVisibleMemorySize - ram.FreePhysicalMemory) / ram.TotalVisibleMemorySize) > 0.70 ? 'text-yellow-500'
           : 'text-emerald-500',
      bg: ram?.TotalVisibleMemorySize != null && ((ram.TotalVisibleMemorySize - ram.FreePhysicalMemory) / ram.TotalVisibleMemorySize) > 0.85 ? 'bg-red-500/10'
        : ram?.TotalVisibleMemorySize != null && ((ram.TotalVisibleMemorySize - ram.FreePhysicalMemory) / ram.TotalVisibleMemorySize) > 0.70 ? 'bg-yellow-500/10'
        : 'bg-emerald-500/10',
      icon: Database
    },
    {
      label: 'ISSUES',
      val: (() => {
        const recs = scanData?.recommendations ?? [];
        const cr = recs.filter(r=>r.severity==='critical').length;
        const wr = recs.filter(r=>r.severity==='warning').length;
        return `${cr} cr, ${wr} wr`;
      })(),
      sub: 'found this scan',
      color: (() => {
        const recs = scanData?.recommendations ?? [];
        const cr = recs.filter(r=>r.severity==='critical').length;
        return cr > 0 ? 'text-red-500'
          : recs.length > 0 ? 'text-yellow-500'
          : 'text-emerald-500';
      })(),
      bg: (() => {
        const recs = scanData?.recommendations ?? [];
        const cr = recs.filter(r=>r.severity==='critical').length;
        return cr > 0 ? 'bg-red-500/10'
          : recs.length > 0 ? 'bg-yellow-500/10'
          : 'bg-emerald-500/10';
      })(),
      icon: ShieldCheck
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((s, i) => (
        <Card key={i} className="p-4 flex items-center space-x-4 border-none shadow-none bg-[#111122]/40 backdrop-blur-md">
          <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
            <s.icon size={20} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] mb-1">{s.label}</span>
            <span className={`text-sm font-black truncate tracking-tight uppercase ${s.color}`}>
              {isScanning ? <Skeleton w="60px" h={12} className="mt-1" /> : s.val}
            </span>
            <span className="text-[8px] text-gray-500 font-bold truncate tracking-widest uppercase">
              {isScanning ? <Skeleton w="40px" h={8} className="mt-1" /> : s.sub}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
