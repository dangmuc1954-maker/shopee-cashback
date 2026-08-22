import { readFile } from 'fs/promises';
import { join } from 'path';

export const alt = 'Mua Sắm Thông Minh - Hoàn 60% Hoa Hồng Shopee';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const imagePath = join(process.cwd(), 'public', 'og-image.png');
  const buffer = await readFile(imagePath);
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
