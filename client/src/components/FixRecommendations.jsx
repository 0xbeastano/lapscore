import { AlertTriangle, Info, ShieldAlert, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';

export default function FixRecommendations({ issues }) {
  if (!issues || issues.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4" accent="from-emerald-500/40 via-blue-500/20 to-transparent">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
          <ShieldAlert size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tighter uppercase">Fully Optimized</h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">No critical risks detected in your current profile.</p>
        </div>
      </Card>
    );
  }

  const getSeverityInfo = (type) => {
    switch (type) {
      case 'critical':
        return { color: 'text-red-500', barCol: 'bg-red-500', bg: 'bg-red-500/5', icon: AlertTriangle, status: 'critical' };
      case 'warning':
        return { color: 'text-amber-500', barCol: 'bg-amber-500', bg: 'bg-amber-500/5', icon: AlertTriangle, status: 'warning' };
      default:
        return { color: 'text-blue-500', barCol: 'bg-blue-500', bg: 'bg-blue-500/5', icon: Info, status: 'info' };
    }
  };

  return (
    <Card className="h-full flex flex-col" accent="from-red-500/60 via-amber-500/40 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.1)]">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shadow-inner">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Fix Recommendations</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Automated Risk Mitigation</p>
          </div>
        </div>
        <StatusBadge status="critical" label={`${issues.length} Risks`} pulse />
      </div>

      <div className="px-6 py-4 flex-1 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
        {issues.map((issue, idx) => {
          const info = getSeverityInfo(issue.type);
          return (
            <div 
              key={idx} 
              className={`relative overflow-hidden group/item flex flex-col p-4 rounded-xl border border-[#1e1e38] transition-all duration-300 hover:border-[#2d2d50] hover:translate-x-1 animate-slide-in-right ${info.bg}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${info.barCol}`} />
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <info.icon size={16} className={info.color} />
                  <span className={`text-xs font-black uppercase tracking-widest ${info.color}`}>{issue.title}</span>
                </div>
                <StatusBadge status={info.status} label={issue.type === 'critical' ? 'High Impact' : 'Medium Impact'} />
              </div>

              <p className="text-sm text-gray-400 leading-relaxed font-medium mb-4">{issue.description}</p>
              
              {issue.steps && (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-[#1e1e38] pb-1.5 mb-2">Correction Steps</p>
                  {issue.steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-3 bg-black/20 p-2.5 rounded-lg border border-transparent hover:border-[#1e1e38] transition-colors">
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-bold">{sIdx + 1}</span>
                      </div>
                      <span className="text-xs text-gray-300 leading-relaxed font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 border-t border-[#1e1e38] bg-[#080810]/50 text-center">
        <button className="flex items-center justify-center space-x-2 w-full text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-[0.2em] group">
          <span>Explore Knowledge Base</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Card>
  );
}
