const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '../assets/icon.png');
const OUT_ICO = path.join(__dirname, '../assets/icon.ico');
const OUT_TRAY = path.join(__dirname, '../assets/tray-icon.png');

const SIZES = [16, 24, 32, 48, 64, 128, 256];

const run = async () => {
  const { default: pngToIco } = await import('png-to-ico');

  if (!fs.existsSync(path.join(__dirname, '../assets'))) {
    fs.mkdirSync(path.join(__dirname, '../assets'));
  }

  // Step 1: Resize source PNG to all required sizes
  const tempFiles = [];
  for (const size of SIZES) {
    const tmpPath = path.join(__dirname, `../assets/tmp-${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 8, g: 8, b: 16, alpha: 1 } // matches #080810
      })
      .png()
      .toFile(tmpPath);
    tempFiles.push(tmpPath);
  }
  
  // Step 2: Combine all sizes into one .ico file
  const icoBuffer = await pngToIco(tempFiles);
  fs.writeFileSync(OUT_ICO, icoBuffer);
  console.log(`✓ icon.ico created (${Math.round(icoBuffer.length / 1024)} KB) — contains ${SIZES.length} sizes`);
  
  // Step 3 & 4: SVGs for pure pixel-perfect crisp 16x16 icon generation
  const variants = {
    'good': '#22c55e',
    'warn': '#f59e0b',
    'critical': '#ef4444'
  };

  const getSvg = (color, type) => {
    let pathD = '';
    // Scaled paths to fit symmetrically in 32x32 viewbox context for downrezzing
    if (type === 'good') pathD = 'M0,16 L10,16 L14,6 L18,26 L22,16 L32,16';
    if (type === 'warn') pathD = 'M0,16 L8,16 L12,8 L16,26 L19,10 L22,20 L26,16 L32,16';
    if (type === 'critical') pathD = 'M0,16 L8,16 L12,10 L16,22 L20,16 L32,16';
    
    return `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="miter" stroke-linecap="butt" shape-rendering="crispEdges"/>
    </svg>`;
  };

  for (const [name, color] of Object.entries(variants)) {
    const svgBuffer = Buffer.from(getSvg(color, name));
    
    // 32x32 Variant
    await sharp(svgBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }})
      .png()
      .toFile(path.join(__dirname, `../assets/tray-${name}.png`));
    
    // 16x16 variant
    await sharp(svgBuffer)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }})
      .png()
      .toFile(path.join(__dirname, `../assets/tray-${name}-16.png`));
      
    console.log(`✓ tray-${name}.png & tray-${name}-16.png created`);
  }
  
  // Also create a default tray-icon.png mapping to good
  fs.copyFileSync(path.join(__dirname, `../assets/tray-good.png`), OUT_TRAY);
  fs.copyFileSync(path.join(__dirname, `../assets/tray-good-16.png`), path.join(__dirname, '../assets/tray-icon-16.png'));
  console.log(`✓ tray-icon.png created (32x32 & 16x16 defaults)`);
  
  // Clean temp files
  tempFiles.forEach(f => fs.unlinkSync(f));
  console.log('✓ Temp files cleaned up');
  
  // Verification
  const icoStat = fs.statSync(OUT_ICO);
  if (icoStat.size < 50000) {
    console.error('⚠ icon.ico is too small — may be corrupt');
    process.exit(1);
  }
  
  console.log(`\n✓ All icons generated successfully`);
  console.log(`  icon.ico:      ${Math.round(icoStat.size/1024)} KB`);
};

run().catch(err => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
