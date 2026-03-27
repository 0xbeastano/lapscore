import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RefreshCw, Download, Check, Clock, History, LayoutDashboard, Share2, Settings, Minus, Square, X, Maximize2 } from 'lucide-react';
import { timeAgo } from '../utils/time';
import { enableScheduler, disableScheduler, fetchSchedulerStatus } from '../api';
import { requestPermission } from '../utils/osNotify';

const isElectron = typeof window !== 'undefined' && !!window.electron;

export function TopNav({ lastScanTimestamp, startScan, scanning }) {
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoOn, setAutoOn] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchSchedulerStatus().then(d => { if (d) setAutoOn(d.enabled); });
    requestPermission();

    // Poll maximized state for the window control icon
    if (isElectron) {
      const checkMax = async () => {
        try {
          const max = await window.electron.isMaximized();
          setIsMaximized(max);
        } catch {}
      };
      checkMax();
      const interval = setInterval(checkMax, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/report');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lapscore-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch(e) { console.error(e) }
    setExporting(false);
  };

  const toggleAuto = async () => {
    if (autoOn) {
      await disableScheduler();
      setAutoOn(false);
    } else {
      await enableScheduler(60);
      setAutoOn(true);
    }
  };

  const isHome = location?.pathname === '/' || location?.pathname === '/dashboard';
  const isHistory = location?.pathname === '/history';
  const isFleet = location?.pathname === '/fleet';
  const isSettings = location?.pathname === '/settings';

  return (
    <nav 
      className="fixed top-0 left-0 w-full h-[64px] glass-nav flex items-center justify-between px-6 z-[100] transition-colors duration-300"
      style={isElectron ? { WebkitAppRegion: 'drag' } : undefined}
    >
      <Link to="/" className="flex items-center gap-3 group" style={isElectron ? { WebkitAppRegion: 'no-drag' } : undefined}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7733ff] to-[#3b82f6] flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(124,58,237,0.4)] group-hover:scale-110 transition-transform">
          L
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-white font-black text-xl tracking-tighter uppercase">
            Lap<span className="text-[#3b82f6]">Score</span>
          </span>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Health Monitor</span>
        </div>
      </Link>

      <div className="flex items-center space-x-4 lg:space-x-6" style={isElectron ? { WebkitAppRegion: 'no-drag' } : undefined}>
        {/* Nav Tabs */}
        <div className="hidden md:flex items-center space-x-1">
          <Link 
            to="/" 
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 ${isHome ? 'text-white bg-[#16162a] border border-[#1e1e38]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <LayoutDashboard size={12} />
            Dashboard
          </Link>
          <Link 
            to="/fleet" 
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 ${isFleet ? 'text-white bg-[#16162a] border border-[#1e1e38]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Share2 size={12} />
            Fleet
          </Link>
          <Link 
            to="/history" 
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 ${isHistory ? 'text-white bg-[#16162a] border border-[#1e1e38]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <History size={12} />
            History
          </Link>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest text-[#475569]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#475569] animate-pulse" />
          <span>{lastScanTimestamp ? `Last scan ${timeAgo(lastScanTimestamp)}` : 'No scan history'}</span>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* AUTO toggle */}
          <button
            onClick={toggleAuto}
            title={autoOn ? 'AUTO: Scans every 60 minutes — click to disable' : 'AUTO: OFF — click to enable hourly scans'}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
              autoOn 
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
                : 'text-gray-500 border-[#1e1e38] bg-transparent hover:border-gray-600'
            }`}
          >
            <Clock size={12} className={autoOn ? 'animate-pulse' : ''} />
            Auto {autoOn ? '●' : '○'}
          </button>

          {startScan && (
            <button 
              onClick={startScan}
              disabled={scanning}
              className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all duration-300 border shadow-sm ${
                scanning 
                   ? 'bg-purple-600 border-purple-500 text-white animate-glow-pulse cursor-not-allowed' 
                   : 'bg-[#16162a] border-[#1e1e38] text-gray-300 hover:border-purple-500 hover:text-white hover:bg-[#1f1f3a]'
              }`}
            >
              <RefreshCw size={14} className={scanning ? 'spin-anim shrink-0' : 'shrink-0 text-blue-500'} />
              <span className="hidden sm:inline">{scanning ? 'Scanning...' : 'Scan Again'}</span>
            </button>
          )}

          <button
            onClick={handleExport}
            disabled={exporting}
            className={`hidden lg:flex items-center space-x-2 border border-[#1e1e38] bg-transparent hover:bg-[#16162a] text-gray-300 px-4 py-2 rounded-lg transition-all duration-300 font-bold text-[11px] uppercase tracking-widest ${exporting ? 'opacity-50' : ''}`}
          >
            {exporting ? (
              <RefreshCw size={14} className="shrink-0 text-purple-500 animate-spin" />
            ) : saved ? (
              <Check size={14} className="shrink-0 text-emerald-500" />
            ) : (
              <Download size={14} className="shrink-0 text-purple-500" />
            )}
            <span>{exporting ? 'Exporting...' : saved ? '✓ Saved' : 'Export'}</span>
          </button>

          <Link
            to="/settings"
            className={`p-2 rounded-lg border transition-all duration-300 flex items-center justify-center ${
              isSettings 
               ? 'bg-purple-500/20 border-purple-500 text-purple-400' 
               : 'bg-[#16162a] border-[#1e1e38] text-gray-400 hover:border-gray-600 hover:text-white'
            }`}
            title="Settings"
          >
            <Settings size={18} />
          </Link>

          {/* ── Electron Window Controls ─────────────────────── */}
          {isElectron && (
            <div className="flex items-center ml-2 border-l border-[#1e1e38] pl-3 space-x-1">
              <button
                onClick={() => window.electron.minimize()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-[#16162a] transition-all"
                title="Minimize"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => window.electron.maximize()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-[#16162a] transition-all"
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <Maximize2 size={12} /> : <Square size={12} />}
              </button>
              <button
                onClick={() => window.electron.close()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Close to tray"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
