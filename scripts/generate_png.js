const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svgPath = path.join(__dirname, '../public/og-image.svg');
const pngPath = path.join(__dirname, '../public/og-image.png');
const thumbPath = path.join(__dirname, '../public/thumbnail.png');

const svg = fs.readFileSync(svgPath, 'utf8');

const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 1200,
  },
});

const pngData = resvg.render();
const pngBuffer = pngData.asPng();

fs.writeFileSync(pngPath, pngBuffer);
fs.writeFileSync(thumbPath, pngBuffer);

console.log('✅ ĐÃ TẠO THÀNH CÔNG ẢNH PNG THUMBNAIL CHUẨN 1200x630 CHO FACEBOOK & ZALO!');
