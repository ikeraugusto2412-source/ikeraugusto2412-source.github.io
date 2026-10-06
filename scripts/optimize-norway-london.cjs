const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BASE_ASSETS = path.join(__dirname, '../public/assets');

async function processDir(inputDir, outputDir, label) {
  if (!fs.existsSync(inputDir)) {
    console.log(`Directory not found: ${inputDir}`);
    return [];
  }
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'thumbs'), { recursive: true });

  const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('.'));
  console.log(`\nProcessing ${label}: ${files.length} images...`);

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = path.parse(file).name;
    const inputPath = path.join(inputDir, file);
    const outWebp = path.join(outputDir, `${name}.webp`);
    const thumbWebp = path.join(outputDir, 'thumbs', `${name}.webp`);

    try {
      const origStat = fs.statSync(inputPath);
      const origKB = Math.round(origStat.size / 1024);

      const img = sharp(inputPath);
      const meta = await img.metadata();
      const stats = await img.stats();

      // Sharpness estimate using highpass edge filter
      let sharpnessScore = 0;
      try {
        const edgeStats = await sharp(inputPath)
          .resize(400, 400, { fit: 'inside' })
          .greyscale()
          .convolve({
            width: 3,
            height: 3,
            kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
          })
          .stats();
        sharpnessScore = Math.round(edgeStats.channels[0].stdev);
      } catch (e) {}

      // Calculate contrast and brightness
      const avgBrightness = Math.round((stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3);
      const avgContrast = Math.round((stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3);

      // Convert to 2K WebP
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

      // Low-res thumb
      await sharp(inputPath).resize(30).webp({ quality: 30 }).toFile(thumbWebp);

      results.push({
        file,
        name,
        relPath: outWebp.replace(path.join(__dirname, '../public'), ''),
        width: meta.width,
        height: meta.height,
        aspect: Number((meta.width / meta.height).toFixed(2)),
        orientation: meta.width >= meta.height ? 'landscape' : 'portrait',
        origKB,
        newKB,
        brightness: avgBrightness,
        contrast: avgContrast,
        sharpness: sharpnessScore,
        // Overall composite aesthetic score
        score: avgContrast * 1.5 + sharpnessScore * 2 - Math.abs(avgBrightness - 110) * 0.5
      });

      console.log(`[${i + 1}/${files.length}] ${file} (${origKB}KB -> ${newKB}KB, contrast:${avgContrast}, sharp:${sharpnessScore})`);
    } catch (err) {
      console.error(`Error on ${file}:`, err.message);
    }
  }

  return results;
}

(async () => {
  const norwayResults = await processDir(
    path.join(BASE_ASSETS, 'Noruega/fotos'),
    path.join(BASE_ASSETS, 'Noruega/webp'),
    'Norway Photos'
  );

  const londonResults = await processDir(
    path.join(BASE_ASSETS, 'london'),
    path.join(BASE_ASSETS, 'london/webp'),
    'London Photos'
  );

  fs.writeFileSync(
    path.join(__dirname, 'analyzed-assets.json'),
    JSON.stringify({ norway: norwayResults, london: londonResults }, null, 2)
  );

  console.log('\nDone! Analysis saved to scripts/analyzed-assets.json');
})();
