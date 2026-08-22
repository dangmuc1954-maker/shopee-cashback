import crypto from 'crypto';

/**
 * Module kết nối trực tiếp với Shopee Affiliate Open API (GraphQL)
 * Tạo ra link rút gọn chính thức s.shopee.vn trực tiếp từ máy chủ Shopee
 */
export async function generateShopeeApiShortLink(
  originUrl: string,
  subId: string,
  appId: string,
  secretKey: string
): Promise<string | null> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const query = `
      mutation {
        generateShortLink(input: {
          originUrl: "${originUrl}",
          subIds: ["${subId}"]
        }) {
          shortLink
        }
      }
    `;

    const payload = JSON.stringify({ query });
    const factor = appId + timestamp + payload + secretKey;
    const signature = crypto.createHash('sha256').update(factor).digest('hex');

    const response = await fetch('https://open-api.affiliate.shopee.vn/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
      },
      body: payload,
    });

    const resData = await response.json();
    const shortLink = resData?.data?.generateShortLink?.shortLink;
    return shortLink || null;
  } catch (err) {
    console.error('Lỗi khi gọi Shopee Open API:', err);
    return null;
  }
}
