import crypto from 'crypto';

/**
 * Module kết nối trực tiếp với Shopee Affiliate Open API (GraphQL)
 * Hỗ trợ tạo Link rút gọn chính thức và Tự động đồng bộ báo cáo đơn hàng
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
      mutation GenerateShortLink($originUrl: String!, $subIds: [String!]) {
        generateShortLink(input: {
          originUrl: $originUrl,
          subIds: $subIds
        }) {
          shortLink
        }
      }
    `;

    const variables = {
      originUrl,
      subIds: subId ? [subId] : [],
    };

    const payload = JSON.stringify({ query, variables });
    const factor = `${appId}${timestamp}${payload}${secretKey}`;
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
    if (resData.errors) {
      console.warn('Shopee Open API generateShortLink warning:', resData.errors);
    }
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
      query GetConversionReport($start: Int, $end: Int) {
        conversionReport(
          purchaseTimeStart: $start,
          purchaseTimeEnd: $end,
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

    const variables = {
      start,
      end,
    };

    const payload = JSON.stringify({ query, variables });
    const factor = `${appId}${timestamp}${payload}${secretKey}`;
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
    if (resData.errors) {
      console.warn('Shopee Open API conversionReport warning:', resData.errors);
    }
    const nodes = resData?.data?.conversionReport?.nodes;
    return Array.isArray(nodes) ? nodes : [];
  } catch (err) {
    console.error('Lỗi khi lấy Báo cáo đơn hàng từ Shopee Open API:', err);
    return null;
  }
}

// 3. Kiểm tra tính hợp lệ của App ID & Secret Key
export async function testShopeeApiCredentials(
  appId: string,
  secretKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await fetchShopeeConversionReport(appId, secretKey);
    if (result !== null) {
      return {
        success: true,
        message: 'Kết nối Shopee Open API thành công!',
      };
    }
    return {
      success: false,
      message: 'Không thể xác thực với Shopee Open API. Vui lòng kiểm tra lại App ID và Secret Key.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối Shopee API: ${err?.message || 'Không xác định'}`,
    };
  }
}

