const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '../assets/screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function takeScreenshots() {
  console.log('Starting headless browser for screenshots...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a nice 16:9 ratio for readme
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:7821/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000)); // wait for animations
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard.png') });
  
  // Navigate to history
  console.log('Navigating to history...');
  await page.goto('http://localhost:7821/history', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'history.png') });
  
  // Navigate to fleet
  console.log('Navigating to fleet...');
  await page.goto('http://localhost:7821/fleet', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'fleet.png') });
  
  // Navigate to settings
  console.log('Navigating to settings...');
  await page.goto('http://localhost:7821/settings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT_DIR, 'settings.png') });

  // For specific cards on dashboard, go back to dashboard and take full page
  await page.goto('http://localhost:7821/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-full.png'), fullPage: true });

  await browser.close();
  console.log('Screenshots saved to assets/screenshots!');
}

takeScreenshots().catch(console.error);
