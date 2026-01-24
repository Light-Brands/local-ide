#!/usr/bin/env node
/**
 * Generate PWA icons from SVG logo
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE = path.join(__dirname, '../public/lb-logo.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Installing...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    try {
      await sharp(SOURCE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${size}x${size}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  // Generate Apple touch icon (180x180)
  const appleTouchPath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
  try {
    await sharp(SOURCE)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 10, alpha: 1 }
      })
      .png()
      .toFile(appleTouchPath);
    console.log('✓ Generated apple-touch-icon (180x180)');
  } catch (error) {
    console.error('✗ Failed to generate apple-touch-icon:', error.message);
  }

  // Generate favicon.ico (32x32 PNG for now)
  const faviconPath = path.join(__dirname, '../public/favicon.png');
  try {
    await sharp(SOURCE)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 10, alpha: 1 }
      })
      .png()
      .toFile(faviconPath);
    console.log('✓ Generated favicon.png (32x32)');
  } catch (error) {
    console.error('✗ Failed to generate favicon:', error.message);
  }

  console.log('\nDone! Icons generated in public/icons/');
}

generateIcons().catch(console.error);
