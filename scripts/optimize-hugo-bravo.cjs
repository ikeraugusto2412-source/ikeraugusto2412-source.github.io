const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BASE_ASSETS = path.join(__dirname, '../public/assets');

async function processHugo() {
  const folders = fs.readdirSync(BASE_ASSETS);
  const hugoFolder = folders.find(f => f.trim().toLowerCase() === 'hugo bravo');
  if (!hugoFolder) {
    console.error('Hugo Bravo folder not found!');
    return;
  }

  const inputDir = path.join(BASE_ASSETS, hugoFolder);
  const outputDir = path.join(BASE_ASSETS, 'hugo-bravo/webp');
  const thumbsDir = path.join(outputDir, 'thumbs');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(thumbsDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('.')).sort();
  console.log(`Processing Hugo Bravo: ${files.length} images from "${hugoFolder}" to "hugo-bravo/webp"...`);

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = path.parse(file).name;
    const inputPath = path.join(inputDir, file);
    const outWebp = path.join(outputDir, `${name}.webp`);
    const thumbWebp = path.join(thumbsDir, `${name}.webp`);

    try {
      const origStat = fs.statSync(inputPath);
      const origKB = Math.round(origStat.size / 1024);

      const img = sharp(inputPath);
      const meta = await img.metadata();
      const stats = await img.stats();

      const avgBrightness = Math.round((stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3);
      const avgContrast = Math.round((stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3);

      let pipeline = sharp(inputPath);
      if (meta.width > 2200 || meta.height > 2200) {
        pipeline = pipeline.resize({
          width: meta.width >= meta.height ? 2200 : null,
          height: meta.height > meta.width ? 2200 : null,
          withoutEnlargement: true
        });
      }

      await pipeline.webp({ quality: 82, effort: 4 }).toFile(outWebp);
      const webpStat = fs.statSync(outWebp);
      const newKB = Math.round(webpStat.size / 1024);

      await sharp(inputPath).resize(30).webp({ quality: 30 }).toFile(thumbWebp);

      results.push({
        file,
        name,
        relPath: `/assets/hugo-bravo/webp/${name}.webp`,
        width: meta.width,
        height: meta.height,
        aspect: Number((meta.width / meta.height).toFixed(2)),
        orientation: meta.width >= meta.height ? 'landscape' : 'portrait',
        origKB,
        newKB,
        brightness: avgBrightness,
        contrast: avgContrast
      });

      console.log(`[${i + 1}/${files.length}] ${file} (${origKB}KB -> ${newKB}KB) [${meta.width}x${meta.height}]`);
    } catch (err) {
      console.error(`Error on ${file}:`, err.message);
    }
  }

  // Also write an analysis json
  fs.writeFileSync(
    path.join(__dirname, 'hugo-bravo-assets.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\nOptimization complete! Processed ' + results.length + ' images.');
}

processHugo();
