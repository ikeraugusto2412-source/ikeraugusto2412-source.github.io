const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BASE_ASSETS = path.join(__dirname, '../public/assets');

async function processWeeknd() {
  const folders = fs.readdirSync(BASE_ASSETS);
  const weekndFolder = folders.find(f => f.toLowerCase().includes('wekkend') || f.toLowerCase().includes('weeknd'));
  if (!weekndFolder) {
    console.error('The Weeknd folder not found!');
    return;
  }

  const inputDir = path.join(BASE_ASSETS, weekndFolder);
  const outputDir = path.join(BASE_ASSETS, 'the-weeknd/webp');
  const thumbsDir = path.join(outputDir, 'thumbs');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(thumbsDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('.')).sort();
  console.log(`Processing The Weeknd: ${files.length} images from "${weekndFolder}" to "the-weeknd/webp"...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = path.parse(file).name;
    const inPath = path.join(inputDir, file);
    const outPath = path.join(outputDir, `${name}.webp`);
    const thumbPath = path.join(thumbsDir, `${name}.webp`);

    const img = sharp(inPath);
    const meta = await img.metadata();

    let pipeline = sharp(inPath);
    if (meta.width > 2200 || meta.height > 2200) {
      pipeline = pipeline.resize({
        width: meta.width >= meta.height ? 2200 : null,
        height: meta.height > meta.width ? 2200 : null,
        withoutEnlargement: true
      });
    }

    await pipeline.webp({ quality: 84, effort: 4 }).toFile(outPath);
    await sharp(inPath).resize(30).webp({ quality: 30 }).toFile(thumbPath);

    console.log(`[${i + 1}/${files.length}] ${file} -> ${name}.webp`);
  }

  console.log('\nOptimization complete!');
}

processWeeknd();
