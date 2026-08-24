import crypto from 'crypto';

/**
 * Module kết nối trực tiếp với Shopee Affiliate Open API (GraphQL)
 */

// 1. Tạo Link rút gọn tiếp thị chính thức từ Shopee Open API
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
    console.error('Lỗi khi gọi Shopee Open API generateShortLink:', err);
    return null;
  }
}

// 2. Lấy Báo Cáo Đơn Hàng Tự Động Từ Shopee Open API (Conversion Report)
export async function fetchShopeeConversionReport(
  appId: string,
  secretKey: string,
  startTimeSeconds?: number,
  endTimeSeconds?: number
): Promise<any[] | null> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const now = timestamp;
    const start = startTimeSeconds || (now - 30 * 24 * 60 * 60); // 30 ngày gần nhất
    const end = endTimeSeconds || now;

    const query = `
      query {
        conversionReport(
          purchaseTimeStart: ${start},
          purchaseTimeEnd: ${end},
          limit: 100
        ) {
          nodes {
            orderSn
            purchaseTime
            orderStatus
            completeTime
            subIds
            totalCommission
            actualAmount
            items {
              itemId
              itemName
              itemPrice
              commissionRate
              commission
            }
          }
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
    const nodes = resData?.data?.conversionReport?.nodes;
    return Array.isArray(nodes) ? nodes : [];
  } catch (err) {
    console.error('Lỗi khi lấy Báo cáo đơn hàng từ Shopee Open API:', err);
    return null;
  }
}
