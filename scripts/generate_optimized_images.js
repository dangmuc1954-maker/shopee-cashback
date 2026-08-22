const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

async function main() {
  const svgPath = path.join(__dirname, '../public/og-image.svg');
  const svg = fs.readFileSync(svgPath, 'utf8');

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Create highly optimized JPEG (ultra fast loading for Facebook)
  const jpgBuffer = await sharp(pngBuffer)
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  const publicDir = path.join(__dirname, '../public');
  const appDir = path.join(__dirname, '../src/app');
  const brainDir = 'C:/Users/admin/.gemini/antigravity/brain/68dccdec-bc2e-4a63-ad3a-16314c6e373f';

  fs.writeFileSync(path.join(publicDir, 'og-image.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'og-image.jpg'), jpgBuffer);
  fs.writeFileSync(path.join(publicDir, 'thumbnail.jpg'), jpgBuffer);

  fs.writeFileSync(path.join(appDir, 'opengraph-image.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'opengraph-image.jpg'), jpgBuffer);

  if (fs.existsSync(brainDir)) {
    fs.writeFileSync(path.join(brainDir, 'og-image.png'), pngBuffer);
    fs.writeFileSync(path.join(brainDir, 'og-image.jpg'), jpgBuffer);
  }

  console.log('✅ Generated both PNG and JPG (JPEG size:', Math.round(jpgBuffer.length / 1024), 'KB)!');
}

main().catch(console.error);
