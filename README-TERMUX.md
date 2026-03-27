# LapScore on Android (Termux)

Run LapScore directly on your Android phone using Termux.

## Requirements
- Android 7.0+
- Termux (install from **F-Droid**, NOT Play Store)
  https://f-droid.org/en/packages/com.termux/

## Setup

```bash
# 1. Update Termux packages
pkg update && pkg upgrade -y

# 2. Install Node.js and Git
pkg install nodejs-lts git -y

# 3. Clone the repo
git clone https://github.com/YOUR_USERNAME/lapscore.git
cd lapscore

# 4. Install dependencies
npm run setup

# 5. Build the dashboard
npm run build

# 6. Start LapScore
npm start
```

Open your phone browser at: **http://localhost:7821**

## What Works on Android

`systeminformation` reads from `/proc` and `/sys` natively:

| Metric | Source | Works? |
|--------|--------|--------|
| Battery % | `/sys/class/power_supply/` | ✅ Yes |
| Battery charging | `/sys/class/power_supply/` | ✅ Yes |
| Battery temp | `/sys/class/power_supply/` | ✅ Yes |
| CPU load (per core) | `/proc/stat` | ✅ Yes |
| CPU frequency | `/sys/devices/system/cpu/` | ✅ Yes |
| CPU temperature | `/sys/class/thermal/` | ✅ Yes |
| RAM total/used/free | `/proc/meminfo` | ✅ Yes |
| Storage (all mounts) | `df` / `statvfs` | ✅ Yes |
| Network interfaces | `/proc/net/dev` | ✅ Yes |
| Running processes | `/proc/[pid]/stat` | ✅ Yes |
| Android version | `uname` / `getprop` | ✅ Yes |

## What Does NOT Work on Android

These are Windows-specific and will gracefully return `null`:

- **Power plan configuration** (powercfg is Windows-only)
- **SMART disk health** (requires direct disk access)
- **Device Manager drivers** (Windows-only concept)
- **GPU driver version** (Android uses different GPU stack)

## Scoring Adjustments for Mobile

LapScore uses slightly different thresholds on mobile because
Android manages resources differently:

| Metric | Desktop Warning | Mobile Warning |
|--------|----------------|----------------|
| CPU idle load | > 15% | > 30% |
| RAM usage | > 85% | > 92% |
| Disk free | < 10% | < 10% |
| Battery wear | < 80% | < 80% |

> Mobile CPU is higher because Android runs many background
> services (Google Play, push notifications) that are normal.

> Mobile RAM is higher because Android aggressively manages
> memory and high usage is expected behavior.

## Platform Detection

In `server/collector.js`, the platform is auto-detected:

```javascript
if (process.platform === 'win32')    → Windows collectors
if (process.platform === 'linux')    → Linux/Android collectors  
if (process.platform === 'darwin')   → macOS collectors
```

Android is detected by checking for `/system/build.prop`.

## Keep LapScore Running in Background

### Option 1: tmux (recommended)
```bash
pkg install tmux
tmux new -s lapscore
npm start
# Press Ctrl+B then D to detach
# Reconnect later: tmux attach -t lapscore
```

### Option 2: Termux:Boot (auto-start on phone boot)
1. Install Termux:Boot from F-Droid
2. Create: `~/.termux/boot/lapscore.sh`
```bash
#!/data/data/com.termux/files/usr/bin/bash
cd ~/lapscore && npm start
```
3. Make executable: `chmod +x ~/.termux/boot/lapscore.sh`

## Known Limitations

- **No admin fixes**: Browser cannot execute system commands.
  Fix recommendations show "Copy Command" buttons instead.
- **Battery design capacity**: Some Android devices don't
  expose `designedCapacity`, so wear % may show as N/A.
- **Temperature**: Requires `/sys/class/thermal/` access.
  Some ROMs restrict this. LapScore handles it gracefully.
- **First scan**: Takes ~3-5 seconds (systeminformation is fast).
