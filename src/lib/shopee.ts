/**
 * Module xử lý chuyển đổi liên kết Shopee sang Shopee Affiliate Link
 * Tối ưu hóa cho tất cả các định dạng link (Web, App Shopee, Shortlink, Universal Link)
 */

// Trích xuất link Shopee từ chuỗi văn bản bất kỳ (kể cả khi người dùng dán kèm text chia sẻ từ App)
export function extractShopeeUrl(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/https?:\/\/(?:www\.)?(?:shopee\.vn|s\.shopee\.vn|shope\.ee|vn\.shp\.ee|shp\.ee)[^\s\n"\'<>]+/i);
  return match ? match[0] : null;
}

export function isValidShopeeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return extractShopeeUrl(url) !== null;
}

// Trích xuất chính xác shopId và itemId từ mọi định dạng link Shopee
export function extractShopAndItemId(url: string): { shopId: string; itemId: string } | null {
  try {
    let decoded = url.trim();
    // Giải mã nhiều lớp nếu link bị URL-encoded từ trước
    for (let i = 0; i < 3; i++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      } catch {
        break;
      }
    }

    // Trường hợp 1: Định dạng tiêu đề i.shopid.itemid (phổ biến nhất trên Shopee VN)
    // Ví dụ: https://shopee.vn/Ten-San-Pham-i.175753395.48300291997
    const iMatch = decoded.match(/i\.(\d+)\.(\d+)/);
    if (iMatch && iMatch[1] && iMatch[2]) {
      return { shopId: iMatch[1], itemId: iMatch[2] };
    }

    // Trường hợp 2: Định dạng canonical /product/shopid/itemid
    // Ví dụ: https://shopee.vn/product/175753395/48300291997
    const prodMatch = decoded.match(/\/product\/(\d+)\/(\d+)/);
    if (prodMatch && prodMatch[1] && prodMatch[2]) {
      return { shopId: prodMatch[1], itemId: prodMatch[2] };
    }

    // Trường hợp 3: Định dạng query params ?shopid=...&itemid=...
    const cleanUrl = decoded.startsWith('http') ? decoded : `https://${decoded}`;
    const parsed = new URL(cleanUrl);
    const shopid = parsed.searchParams.get('shopid') || parsed.searchParams.get('shop_id');
    const itemid = parsed.searchParams.get('itemid') || parsed.searchParams.get('item_id');
    if (shopid && itemid && /^\d+$/.test(shopid) && /^\d+$/.test(itemid)) {
      return { shopId: shopid, itemId: itemid };
    }
  } catch (err) {
    // Không trích xuất được shopId/itemId
  }
  return null;
}

// Chuẩn hóa link Shopee về định dạng Canonical chuẩn nhất (Không dấu tiếng Việt, không param rác)
export function cleanShopeeUrl(url: string): string {
  try {
    const extracted = extractShopeeUrl(url) || url.trim();
    
    // Nếu là link sản phẩm có shopId và itemId -> Chuẩn hóa về link canonical ngắn gọn 100% ASCII
    // Đây là định dạng tốt nhất để Shopee App và hệ thống Tracking an_redir ghi nhận hoa hồng
    const productInfo = extractShopAndItemId(extracted);
    if (productInfo) {
      return `https://shopee.vn/product/${productInfo.shopId}/${productInfo.itemId}`;
    }

    let clean = extracted;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);

    // Nếu là trang shop hoặc trang sự kiện, loại bỏ các tham số rác và tracking cũ
    if (parsed.hostname.includes('shopee.vn') && !parsed.hostname.startsWith('s.')) {
      const allowedParams = ['shopid', 'itemid', 'categoryid'];
      const newSearchParams = new URLSearchParams();
      parsed.searchParams.forEach((value, key) => {
        if (allowedParams.includes(key.toLowerCase())) {
          newSearchParams.set(key, value);
        }
      });
      const search = newSearchParams.toString();
      return `${parsed.origin}${parsed.pathname}${search ? '?' + search : ''}`;
    }

    return clean;
  } catch (err) {
    return url.trim();
  }
}

// Tự động giải mã link rút gọn (s.shopee.vn, shope.ee, vn.shp.ee, shp.ee) thành link sản phẩm gốc
export async function resolveShopeeShortLink(url: string): Promise<string> {
  try {
    const extracted = extractShopeeUrl(url) || url.trim();
    let clean = extracted;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    // Nếu đã chứa shopId và itemId thì trả về link chuẩn ngay, không cần fetch
    const directProduct = extractShopAndItemId(clean);
    if (directProduct) {
      return `https://shopee.vn/product/${directProduct.shopId}/${directProduct.itemId}`;
    }

    const parsed = new URL(clean);
    const isShortLink = parsed.hostname.startsWith('s.') || 
                        parsed.hostname.includes('shope.ee') || 
                        parsed.hostname.includes('shp.ee');

    if (isShortLink) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(clean, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });
        clearTimeout(timeout);

        if (res.url && res.url !== clean) {
          const resolvedProd = extractShopAndItemId(res.url);
          if (resolvedProd) {
            return `https://shopee.vn/product/${resolvedProd.shopId}/${resolvedProd.itemId}`;
          }
          return cleanShopeeUrl(res.url);
        }

        // Đọc HTML content nếu redirect xảy ra bằng Javascript/meta-refresh
        const text = await res.text();
        const htmlMatch = text.match(/https?:\/\/(?:www\.)?shopee\.vn\/[^\s\n"\'<>]+/i);
        if (htmlMatch) {
          const htmlProd = extractShopAndItemId(htmlMatch[0]);
          if (htmlProd) {
            return `https://shopee.vn/product/${htmlProd.shopId}/${htmlProd.itemId}`;
          }
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

// Tạo SubID định danh người dùng chuẩn Shopee (Alphanumeric, không dấu, tối đa 20 ký tự)
export function generateSubId(userId: string): string {
  const cleanUserId = (userId || 'GUEST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const timestampHex = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${cleanUserId}_${timestampHex}${randomSuffix}`;
}

export interface ConvertLinkResult {
  affiliateUrl: string;
  directUrl: string;
  subId: string;
  cleanOriginalUrl: string;
}

export function convertToAffiliateUrl(
  originalUrl: string,
  shopeeAffId: string,
  subId: string
): ConvertLinkResult {
  const cleanOriginal = cleanShopeeUrl(originalUrl);
  const cleanAffId = String(shopeeAffId || '17352020564').trim();
  
  // 1. Điểm chuyển hướng tracking chính thức của Shopee Affiliate Network (an_redir)
  // Shopee sẽ tự động gắn credential_token, uls_trackid, mmp_pid và kích hoạt mở App Shopee
  const encodedOrigin = encodeURIComponent(cleanOriginal);
  const affiliateUrl = `https://s.shopee.vn/an_redir?origin_link=${encodedOrigin}&affiliate_id=${cleanAffId}&sub_id=${subId}`;

  // 2. Direct Universal Link với các tham số chuẩn UTM và aff_sid
  const productInfo = extractShopAndItemId(cleanOriginal);
  const directUrl = productInfo
    ? `https://shopee.vn/product/${productInfo.shopId}/${productInfo.itemId}?aff_sid=${subId}&aff_sub=${subId}&affiliate_id=${cleanAffId}&utm_source=an_${cleanAffId}&utm_medium=affiliates`
    : `${cleanOriginal}${cleanOriginal.includes('?') ? '&' : '?'}aff_sid=${subId}&affiliate_id=${cleanAffId}&utm_source=an_${cleanAffId}&utm_medium=affiliates`;

  return {
    affiliateUrl,
    directUrl,
    subId,
    cleanOriginalUrl: cleanOriginal,
  };
}

