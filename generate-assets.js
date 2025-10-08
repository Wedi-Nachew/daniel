/**
 * Generate placeholder asset images for Mill Receipt Pro
 * Run: node generate-assets.js
 * 
 * This creates simple purple placeholder images.
 * Replace with professional designs before production.
 */

const fs = require('fs');
const path = require('path');

// Simple PNG generator without dependencies
// Creates a minimal valid PNG file with solid color

function createPNG(width, height, r, g, b) {
  const png = require('png-js');
  
  // For simplicity, we'll create an SVG and instruct user to convert
  // Or use the Python script if available
  
  console.log('Note: This script requires additional setup.');
  console.log('Please use one of these alternatives:\n');
  console.log('1. Run the Python script: python create_assets.py');
  console.log('2. Use online tool: https://www.appicon.co/');
  console.log('3. Create manually in any image editor:');
  console.log('   - icon.png: 1024x1024, purple #7C3AED');
  console.log('   - splash.png: 1284x2778, purple #7C3AED');
  console.log('   - adaptive-icon.png: 1024x1024, purple #7C3AED\n');
}

// Create SVG placeholders instead
function createSVGIcon(size, filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#7C3AED"/>
  <text x="50%" y="50%" font-size="${size/2}" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">M</text>
</svg>`;
  
  fs.writeFileSync(filename, svg);
  console.log(`✓ Created ${filename}`);
}

function createSVGSplash(filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#7C3AED"/>
  <text x="50%" y="50%" font-size="100" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">Mill Receipt Pro</text>
</svg>`;
  
  fs.writeFileSync(filename, svg);
  console.log(`✓ Created ${filename}`);
}

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

console.log('Generating SVG placeholder assets...\n');

createSVGIcon(1024, path.join(assetsDir, 'icon.svg'));
createSVGIcon(1024, path.join(assetsDir, 'adaptive-icon.svg'));
createSVGSplash(path.join(assetsDir, 'splash.svg'));

console.log('\n⚠️  SVG files created, but Expo needs PNG files.');
console.log('\nTo convert SVG to PNG:');
console.log('1. Open each SVG in a browser');
console.log('2. Take screenshot or use browser dev tools to export');
console.log('3. Save as PNG with correct dimensions');
console.log('\nOR use the Python script for direct PNG creation:');
console.log('   pip install pillow');
console.log('   python create_assets.py');
