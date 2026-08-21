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
    
    // Nếu là domain shopee.vn chính, lọc bỏ các query param rác
    if (parsed.hostname.includes('shopee.vn') && !parsed.hostname.startsWith('s.')) {
      const allowedParams = ['shopid', 'itemid', 'sp_atk', 'xptdk'];
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
  // Tạo sub_id định danh duy nhất ngắn gọn không chứa ký tự đặc biệt
  const cleanUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${cleanUserId}${randomSuffix}`;
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
  
  // Điểm chuyển hướng tracking chính thức của Shopee Affiliate Network (an_redir)
  // Đây là điểm bắt buộc để Shopee tạo credential_token, uls_trackid, mmp_pid và ghi nhận hoa hồng
  const encodedOrigin = encodeURIComponent(cleanOriginal);
  const affiliateUrl = `https://s.shopee.vn/an_redir?origin_link=${encodedOrigin}&affiliate_id=${shopeeAffId}&sub_id=${subId}`;

  return {
    affiliateUrl,
    subId,
    cleanOriginalUrl: cleanOriginal,
  };
}
