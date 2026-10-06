const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BASE_ASSETS = path.join(__dirname, '../public/assets');

async function syncFolder(inputDir, outputDir, label) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'thumbs'), { recursive: true });

  const inputFiles = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('.'));
  const currentBaseNames = new Set(inputFiles.map(f => path.parse(f).name));

  // 1. Clean up stale webps that no longer exist in input
  const existingWebps = fs.readdirSync(outputDir).filter(f => f.endsWith('.webp'));
  for (const w of existingWebps) {
    const base = path.parse(w).name;
    if (!currentBaseNames.has(base)) {
      console.log(`🗑 Removing deleted file from ${label} webp: ${w}`);
      try { fs.unlinkSync(path.join(outputDir, w)); } catch(e) {}
      try { fs.unlinkSync(path.join(outputDir, 'thumbs', w)); } catch(e) {}
    }
  }

  // 2. Convert / update all current images to webp
  console.log(`\n🚀 Optimizing ${label} (${inputFiles.length} images)...`);
  for (const f of inputFiles) {
    const name = path.parse(f).name;
    const inPath = path.join(inputDir, f);
    const outPath = path.join(outputDir, `${name}.webp`);
    const thumbPath = path.join(outputDir, 'thumbs', `${name}.webp`);

    // Only re-generate if webp doesn't exist or input is newer
    let needsGen = true;
    if (fs.existsSync(outPath)) {
      const inMtime = fs.statSync(inPath).mtimeMs;
      const outMtime = fs.statSync(outPath).mtimeMs;
      if (outMtime > inMtime) {
        needsGen = false;
      }
    }

    if (needsGen) {
      try {
        const meta = await sharp(inPath).metadata();
        let pipeline = sharp(inPath);
        if (meta.width > 2200 || meta.height > 2200) {
          pipeline = pipeline.resize({
            width: meta.width >= meta.height ? 2200 : null,
            height: meta.height > meta.width ? 2200 : null,
            withoutEnlargement: true
          });
        }
        await pipeline.webp({ quality: 82, effort: 4 }).toFile(outPath);
        await sharp(inPath).resize(30).webp({ quality: 30 }).toFile(thumbPath);
        console.log(`  ✅ Generated WebP: ${name}.webp`);
      } catch(e) {
        console.error(`  ❌ Error generating ${f}:`, e.message);
      }
    }
  }
}

(async () => {
  // Sync London
  await syncFolder(
    path.join(BASE_ASSETS, 'london'),
    path.join(BASE_ASSETS, 'london/webp'),
    'London'
  );

  // Sync Norway
  await syncFolder(
    path.join(BASE_ASSETS, 'Noruega/fotos'),
    path.join(BASE_ASSETS, 'Noruega/webp'),
    'Norway'
  );

  // Sync Hugo Bravo
  const hugoFolder = fs.readdirSync(BASE_ASSETS).find(f => f.trim().toLowerCase() === 'hugo bravo');
  if (hugoFolder) {
    await syncFolder(
      path.join(BASE_ASSETS, hugoFolder),
      path.join(BASE_ASSETS, 'hugo-bravo/webp'),
      'Hugo Bravo'
    );
    // Ensure foto portada 2.webp exists if generated as foto portada2.webp
    const p2NoSpace = path.join(BASE_ASSETS, 'hugo-bravo/webp/foto portada2.webp');
    const p2Space = path.join(BASE_ASSETS, 'hugo-bravo/webp/foto portada 2.webp');
    if (fs.existsSync(p2NoSpace) && !fs.existsSync(p2Space)) {
      fs.copyFileSync(p2NoSpace, p2Space);
    }
  }

  // Sync Tour de France
  if (fs.existsSync(path.join(BASE_ASSETS, 'Tour de france'))) {
    await syncFolder(
      path.join(BASE_ASSETS, 'Tour de france'),
      path.join(BASE_ASSETS, 'tour-de-france/webp'),
      'Tour de France'
    );
    const tdfNoSpace = path.join(BASE_ASSETS, 'tour-de-france/webp/portada1.webp');
    const tdfSpace = path.join(BASE_ASSETS, 'tour-de-france/webp/portada 1.webp');
    if (fs.existsSync(tdfNoSpace) && !fs.existsSync(tdfSpace)) {
      fs.copyFileSync(tdfNoSpace, tdfSpace);
    }
  }

  // Sync The Weeknd
  const weekndFolder = fs.readdirSync(BASE_ASSETS).find(f => f.toLowerCase().includes('wekkend') || f.toLowerCase().includes('weeknd'));
  if (weekndFolder) {
    await syncFolder(
      path.join(BASE_ASSETS, weekndFolder),
      path.join(BASE_ASSETS, 'the-weeknd/webp'),
      'The Weeknd'
    );
  }

  console.log('\n✨ Sync and optimization complete!');
})();
