/**
 * Comprehensive Image Optimization Script
 * Converts all images to optimized WebP format with sharp.
 * Originals are preserved.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const FOLDERS = ['ny', 'london', 'profile', 'porfolio', 'Empresas'];
const BASE_IN = path.join(__dirname, '../public/assets');
const QUALITY = 82; // Visually lossless modern WebP compression
const MAX_WIDTH = 2200; // Ultra high-res 2K max width (perfect for retina displays)

async function processFolder(folder) {
  const inputDir = path.join(BASE_IN, folder);
  const webpSubdir = path.join(BASE_IN, folder, 'webp');
  const thumbDir = path.join(BASE_IN, folder, 'webp', 'thumbs');

  if (!fs.existsSync(inputDir)) return;
  fs.mkdirSync(webpSubdir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter((f) =>
    /\.(jpg|jpeg|png)$/i.test(f)
  );

  console.log(`\n📁 Optimizing folder: ${folder} (${files.length} images)`);

  for (const file of files) {
    const name = path.parse(file).name;
    const inputPath = path.join(inputDir, file);

    // Direct WebP in same folder and in /webp/
    const directWebpPath = path.join(inputDir, `${name}.webp`);
    const subWebpPath = path.join(webpSubdir, `${name}.webp`);
    const thumbPath = path.join(thumbDir, `${name}.webp`);

    try {
      const originalStat = fs.statSync(inputPath);
      const originalKB = Math.round(originalStat.size / 1024);

      // Convert to full-res WebP (bounded to MAX_WIDTH for optimal performance)
      const imageInstance = sharp(inputPath);
      const metadata = await imageInstance.metadata();

      let pipeline = sharp(inputPath);
      if (metadata.width && metadata.width > MAX_WIDTH) {
        pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      }

      const webpBuffer = await pipeline
        .webp({ quality: QUALITY, effort: 4 })
        .toBuffer();

      // Write both locations
      fs.writeFileSync(directWebpPath, webpBuffer);
      fs.writeFileSync(subWebpPath, webpBuffer);

      // Create thumb placeholder
      await sharp(inputPath)
        .resize(24)
        .webp({ quality: 35 })
        .toFile(thumbPath);

      const newKB = Math.round(webpBuffer.length / 1024);
      const pct = Math.round((1 - newKB / originalKB) * 100);

      process.stdout.write(`  ✅ ${file}: ${originalKB}KB → ${newKB}KB (-${pct}%)\n`);
    } catch (err) {
      console.error(`  ❌ Error processing ${file}:`, err.message);
    }
  }
}

(async () => {
  console.log('🚀 Starting WebP optimization for all portfolio assets...\n');
  const start = Date.now();

  for (const folder of FOLDERS) {
    await processFolder(folder);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n🎉 WebP optimization complete in ${duration}s!`);
})();
