const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, '..', 'public', 'images', 'photos');

async function convert() {
  const files = [
    { name: 'team-portrait-02.jpg', out: 'team-portrait-02.webp' },
    { name: 'photo-table-four.png', out: 'photo-table-four.webp' },
    { name: 'photo-standing.png', out: 'photo-standing.webp' },
    { name: 'team-wide-01.png', out: 'team-wide-01.webp' },
  ];

  for (const f of files) {
    const inputPath = path.join(photosDir, f.name);
    const outputPath = path.join(photosDir, f.out);

    const origStat = fs.statSync(inputPath);
    await sharp(inputPath)
      .webp({ quality: 82, effort: 6 })
      .toFile(outputPath);
    const newStat = fs.statSync(outputPath);

    console.log(`${f.name} (${(origStat.size / 1024).toFixed(1)} KB) -> ${f.out} (${(newStat.size / 1024).toFixed(1)} KB) [reduction: ${(100 - (newStat.size / origStat.size) * 100).toFixed(1)}%]`);
  }
}

convert().catch(console.error);
