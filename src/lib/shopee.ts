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

// Tự động giải mã link rút gọn (s.shopee.vn, shope.ee, vn.shp.ee) thành link sản phẩm gốc
export async function resolveShopeeShortLink(url: string): Promise<string> {
  try {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    
    // Nếu là dạng link rút gọn
    if (parsed.hostname.startsWith('s.') || parsed.hostname.includes('shope.ee') || parsed.hostname.includes('shp.ee')) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      try {
        const res = await fetch(clean, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        clearTimeout(timeout);
        if (res.url && res.url !== clean) {
          return cleanShopeeUrl(res.url);
        }
      } catch (fetchErr) {
        clearTimeout(timeout);
      }
    }
    return cleanShopeeUrl(clean);
  } catch (err) {
    return cleanShopeeUrl(url);
  }
}

export function generateSubId(userId: string): string {
  // Tạo sub_id định danh duy nhất tuyệt đối kèm timestamp
  const cleanUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  const timestampHex = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${cleanUserId}${timestampHex}${randomSuffix}`;
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
