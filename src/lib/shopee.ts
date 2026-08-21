/**
 * Module xử lý chuyển đổi liên kết Shopee sang Shopee Affiliate Link
 */

export function isValidShopeeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const pattern = /^(https?:\/\/)?((www\.)?shopee\.vn|s\.shopee\.vn|shope\.ee|vn\.shp\.ee)/i;
  return pattern.test(url.trim());
}

export function cleanShopeeUrl(url: string): string {
  try {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    
    // Nếu là domain shopee.vn chính, lọc bỏ các query param rác như sp_atk, xptdk
    if (parsed.hostname.includes('shopee.vn') && !parsed.hostname.startsWith('s.')) {
      const allowedParams = ['shopid', 'itemid'];
      const searchParams = new URLSearchParams();
      parsed.searchParams.forEach((value, key) => {
        if (allowedParams.includes(key.toLowerCase())) {
          searchParams.set(key, value);
        }
      });
      const search = searchParams.toString();
      return `${parsed.origin}${parsed.pathname}${search ? '?' + search : ''}`;
    }
    
    return parsed.toString();
  } catch (err) {
    return url.trim();
  }
}

export function generateSubId(userId: string): string {
  // Tạo sub_id định danh duy nhất ngắn gọn: U{userId_8_ky_tu}_{timestamp_hex}
  const cleanUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${cleanUserId}_${randomSuffix}`;
}

export interface ConvertLinkResult {
  affiliateUrl: string;
  subId: string;
  cleanOriginalUrl: string;
}

export function convertToAffiliateUrl(
  originalUrl: string,
  shopeeAffId: string,
  subId: string
): ConvertLinkResult {
  const cleanOriginal = cleanShopeeUrl(originalUrl);
  
  // Xây dựng Shopee Universal Tracking URL gắn Affiliate ID và Sub_ID
  // Đây là định dạng chuẩn của Shopee Affiliate Network cho phép tracking cả trên Mobile App và Web Browser
  const encodedUrl = encodeURIComponent(cleanOriginal);
  
  // Format 1: Shopee an_redir Universal tracking
  const affiliateUrl = `https://shope.ee/an_redir?origin_link=${encodedUrl}&affiliate_id=${shopeeAffId}&sub_id=${subId}`;

  return {
    affiliateUrl,
    subId,
    cleanOriginalUrl: cleanOriginal,
  };
}
