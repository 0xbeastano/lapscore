import { useState, useEffect } from 'react';

export const useLiveStream = () => {
    const [history, setHistory] = useState([]);
    const [connected, setConnected] = useState(false);
    
    useEffect(() => {
      const host = window.location.port === '5173' ? 'localhost:7821' : window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${host}`;
      
      let ws;
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'live_tick') {
              setHistory(prev => {
                const next = [...prev, msg];
                return next.slice(-40); // Keep last 40 samples
              });
            }
          } catch (err) {
            console.error("Failed to parse WS msg", err);
          }
        };
      } catch (e) {
        console.error("WS error: ", e);
      }
      return () => { if (ws) ws.close(); };
    }, []);

    return { liveData: history, connected };
};
