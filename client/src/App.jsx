import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/HistoryPage';
import FleetPage from './pages/FleetPage';
import SettingsPage from './pages/SettingsPage';
import { PrintReport } from './components/PrintReport';
import { fetchLatestScan, fetchBatteryIntelligence } from './api';
import { ToastProvider } from './components/ui/Toast';

function Report() {
  return <div className="p-8 text-center text-gray-400 mt-16 font-black uppercase tracking-widest">Model Analysis Report · COMING SOON</div>;
}

function PrintLayout() {
  const [data, setData] = useState(null);
  const [intelData, setIntelData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchLatestScan();
        setData(result);
        const intel = await fetchBatteryIntelligence();
        setIntelData(intel);
      } catch (e) {
        console.error("Print fetch failed");
      }
    }
    load();
  }, []);

  if (!data) return <div className="p-8 flex items-center justify-center font-bold text-[#111] bg-white h-screen">Loading report data...</div>;

  return (
    <PrintReport 
      data={{...data.scan, ...data.raw, ...data.raw?.diskLayout}} 
      score={data.scores?.total || data.scores} 
      cpuInfo={data.raw?.cpu} 
      memInfo={data.raw?.memLayout} 
      storage={data.raw?.diskLayout} 
      habits={intelData} 
    />
  );
}

function App() {
  const isPrintMode = new URLSearchParams(window.location.search).get('print') === 'true';

  if (isPrintMode) {
    return <PrintLayout />;
  }
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#080810] text-[#f1f5f9] font-sans selection:bg-purple-500/30 selection:text-white">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/index.html" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/fleet" element={<FleetPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/report/:id" element={
              <>
                <TopNav />
                <Report />
              </>
            } />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
