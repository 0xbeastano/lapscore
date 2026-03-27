const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

exports.generateReport = async (options) => {
  const { deviceId, filename, includeHistory } = options;
  const reportsDir = path.join(__dirname, '..', 'data', 'reports');
  
  // Ensure directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filepath = path.join(reportsDir, filename);
  let browser;

  try {
    // 1. Launch headless Chromium via puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // 4. Set viewport
    await page.setViewport({ width: 1200, height: 900 });

    // 2. Navigate to print layout URL
    // Use localhost IP directly depending on where server runs.
    const url = `http://localhost:7821/?print=true`;
    
    // Timeouts and navigation
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // 3. Wait for React to signal that all data is parsed & loaded natively
    await page.waitForSelector('[data-report-ready="true"]', { timeout: 30000 });

    // Allow a small grace period for CSS animations and chart strokes to paint
    await new Promise(r => setTimeout(r, 1500)); 

    // 5. Generate PDF
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '15mm', 
        bottom: '15mm',
        left: '12mm', 
        right: '12mm' 
      }
    });

    await browser.close();

    // 7. Verify file creation and get size
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      return { 
        success: true,
        filepath, 
        filename, 
        sizeBytes: stats.size 
      };
    } else {
      throw new Error("PDF generation failed implicitly.");
    }

  } catch (error) {
    if (browser) await browser.close();
    return { error: 'PDF Generation failed: ' + error.message };
  }
};
