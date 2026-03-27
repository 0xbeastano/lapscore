# LapScore — PC Health Monitor

> Battery life in years. AI session tracking. Fleet monitoring.
> Free. Open source. No cloud. No account.

![LapScore Dashboard](assets/icon.png)

## Quick Start

**Requirements:** [Node.js 18+](https://nodejs.org) · Git

```bash
git clone https://github.com/0xbeastano/lapscore
cd lapscore
npm run setup
```

Then open **http://localhost:7821** in your browser.

That's it.

---

## What It Does

| Feature | Description |
|---|---|
| **Health Score** | 0–100 score with grade A–F for your laptop |
| **Battery Intelligence** | Cycle count → years remaining forecast |
| **AI Session Monitor** | Tracks Ollama, LM Studio battery drain |
| **CPU Throttle Radar** | Detects thermal throttling in real-time |
| **Fleet Management** | Monitor all LAN machines from one screen |
| **Power Cost Tracker** | Real electricity cost in ₹, $, or € |

---

## Manual Setup

```bash
# 1. Clone the repo
git clone https://github.com/0xbeastano/lapscore
cd lapscore

# 2. Install server dependencies
npm install

# 3. Install client dependencies
cd client && npm install && cd ..

# 4. Build the React frontend
npm run build

# 5. Start the server
npm start

# 6. Open your browser
# http://localhost:7821
```

---

## Development Mode (hot reload)

```bash
npm run dev
```
Starts both server and React dev server simultaneously.
Frontend changes reflect instantly without rebuild.

---

## Access From Other Devices

LapScore prints your network IP on startup:
```
Local:   http://localhost:7821
Network: http://192.168.1.5:7821  ← open this on phone/tablet
```

---

## Fleet Monitoring

Any machine on your LAN running LapScore is
auto-discovered via UDP. Open the **FLEET** tab
to see all machines.

Requirements:
- Both machines on the same WiFi/LAN
- Port 7822 (UDP) not blocked by firewall

---

## Tech Stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Frontend:** React, Vite, Tailwind CSS
- **Hardware:** systeminformation
- **Desktop:** Electron (optional, for .exe build)

---

## License

MIT — free to use, modify, and distribute.
