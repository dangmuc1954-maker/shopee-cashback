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

// Trích xuất tiêu đề sản phẩm từ đường dẫn URL (slug)
export function extractTitleFromUrl(url: string): string {
  try {
    let decoded = url.trim();
    try {
      decoded = decodeURIComponent(decoded);
    } catch {}

    const cleanUrl = decoded.startsWith('http') ? decoded : `https://${decoded}`;
    const parsed = new URL(cleanUrl);
    if (parsed.hostname.startsWith('s.') || parsed.hostname.includes('shope.ee') || parsed.hostname.includes('shp.ee')) {
      return ''; // Shortlink hash không phải là tên sản phẩm
    }

    const match = decoded.match(/shopee\.vn\/([^\/\?]+)-i\.\d+\.\d+/i) || decoded.match(/shopee\.vn\/([^\/\?]+)\/\d+\/\d+/i);
    if (match && match[1] && !match[1].startsWith('product') && !match[1].startsWith('search') && !match[1].startsWith('cart') && !match[1].startsWith('opaanlp')) {
      const cleanSlug = match[1].replace(/[-_]+/g, ' ').trim();
      if (cleanSlug.length > 3 && !/^[a-zA-Z0-9]{5,15}$/.test(cleanSlug)) {
        return cleanSlug;
      }
    }
  } catch (e) {}
  return '';
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

    // Trường hợp 2: Định dạng canonical /product/shopid/itemid hoặc slug /username/shopid/itemid
    // Ví dụ: https://shopee.vn/product/175753395/48300291997 hoặc https://shopee.vn/opaanlp/1483137828/51102043379
    const prodMatch = decoded.match(/\/product\/(\d+)\/(\d+)/) || decoded.match(/\/([a-zA-Z0-9_\-\.]+)\/(\d{5,})\/(\d{8,})/);
    if (prodMatch) {
      const sId = prodMatch[1] && /^\d+$/.test(prodMatch[1]) ? prodMatch[1] : prodMatch[2];
      const iId = prodMatch[2] && /^\d+$/.test(prodMatch[1]) ? prodMatch[2] : prodMatch[3];
      if (sId && iId) {
        return { shopId: sId, itemId: iId };
      }
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
    const productInfo = extractShopAndItemId(extracted);
    if (productInfo) {
      return `https://shopee.vn/product/${productInfo.shopId}/${productInfo.itemId}`;
    }

    let clean = extracted;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    const parsed = new URL(clean);
    
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

    const parsed = new URL(clean);
    const isShortLink = parsed.hostname.startsWith('s.') || 
                        parsed.hostname.includes('shope.ee') || 
                        parsed.hostname.includes('shp.ee');

    if (!isShortLink) {
      const directProduct = extractShopAndItemId(clean);
      if (directProduct) {
        return `https://shopee.vn/product/${directProduct.shopId}/${directProduct.itemId}`;
      }
      return cleanShopeeUrl(clean);
    }

    // 1. Với shortlink: Đầu tiên gọi với redirect: 'manual' (cực nhanh và hoạt động 100% trên Vercel)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const manualRes = await fetch(clean, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'curl/8.7.1',
        },
      });
      clearTimeout(timeout);

      const location = manualRes.headers.get('location');
      if (location) {
        const prodFromLoc = extractShopAndItemId(location);
        if (prodFromLoc) {
          return `https://shopee.vn/product/${prodFromLoc.shopId}/${prodFromLoc.itemId}`;
        }
        return cleanShopeeUrl(location);
      }
    } catch (e) {}

    // 2. Fallback nếu manual không ra Location: gọi với follow redirect
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const followRes = await fetch(clean, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
        },
      });
      clearTimeout(timeout);

      if (followRes.url && followRes.url !== clean) {
        const resolvedProd = extractShopAndItemId(followRes.url);
        if (resolvedProd) {
          return `https://shopee.vn/product/${resolvedProd.shopId}/${resolvedProd.itemId}`;
        }
        return cleanShopeeUrl(followRes.url);
      }
    } catch (e) {}

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

export interface CategoryCommissionInfo {
  categoryName: string;
  icon: string;
  shopeeCommissionRate: number; // Mức hoa hồng Shopee trả cho ngành hàng (4% - 15%)
  estimatedPrice: number;       // Giá bán trung bình đề xuất
  shopeeCommissionAmount: number; // Tổng số tiền hoa hồng Shopee chi trả cho sản phẩm
}

// Nhận diện ngành hàng và mức hoa hồng chính xác từ tên hoặc link sản phẩm Shopee
export function detectCategoryAndCommission(titleOrUrl: string): CategoryCommissionInfo {
  const text = (titleOrUrl || '').toLowerCase();

  // 1. Điện thoại & Công nghệ / Điện tử
  if (/iphone|samsung|xiaomi|oppo|laptop|macbook|ipad|tai nghe|airpods|chuột|bàn phím|loa bluetooth|tivi|máy tính|camera|smartwatch|đồng hồ thông minh|pin dự phòng/i.test(text)) {
    let estPrice = 2500000;
    let commRate = 4.0;
    if (/iphone|macbook|laptop/i.test(text)) {
      estPrice = 15000000;
      commRate = 3.5;
    } else if (/tai nghe|chuột|bàn phím|loa/i.test(text)) {
      estPrice = 350000;
      commRate = 5.0;
    }
    
    return {
      categoryName: 'Thiết Bị Điện Tử & Công Nghệ',
      icon: '📱',
      shopeeCommissionRate: commRate,
      estimatedPrice: estPrice,
      shopeeCommissionAmount: Math.round(estPrice * (commRate / 100)),
    };
  }

  // 2. Thời trang & Phụ kiện
  if (/áo|quần|váy|đầm|giày|dép|sneaker|túi|balo|ví|thắt lưng|nón|mũ|trang sức|nhẫn|dây chuyền|tất|vớ|hoodie|polo|thun|sơ mi|khoác/i.test(text)) {
    let estPrice = 220000;
    let commRate = 12.0;
    if (/giày|sneaker|túi|khoác/i.test(text)) {
      estPrice = 380000;
      commRate = 14.0;
    }
    
    return {
      categoryName: 'Thời Trang & Phụ Kiện',
      icon: '👗',
      shopeeCommissionRate: commRate,
      estimatedPrice: estPrice,
      shopeeCommissionAmount: Math.round(estPrice * (commRate / 100)),
    };
  }

  // 3. Mỹ phẩm & Làm đẹp / Chăm sóc sức khỏe
  if (/son|kem|serum|toner|nước hoa|phấn|sữa rửa mặt|chống nắng|dưỡng da|mặt nạ|dầu gội|sữa tắm|tẩy trang|collagen|vitamin|skincare/i.test(text)) {
    let estPrice = 250000;
    let commRate = 10.0;
    if (/nước hoa|serum|kem/i.test(text)) {
      estPrice = 420000;
      commRate = 12.0;
    }

    return {
      categoryName: 'Mỹ Phẩm & Làm Đẹp',
      icon: '💄',
      shopeeCommissionRate: commRate,
      estimatedPrice: estPrice,
      shopeeCommissionAmount: Math.round(estPrice * (commRate / 100)),
    };
  }

  // 4. Đồ gia dụng, nội thất & Đời sống
  if (/nồi|chảo|bếp|quạt|máy lọc|hút bụi|bình giữ nhiệt|chăn|ga|gối|đèn|kệ|tủ|bàn|ghế|dụng cụ|nước giặt|lau nhà|gaming|nội thất/i.test(text)) {
    let estPrice = 350000;
    let commRate = 9.0;
    let commAmount = Math.round(estPrice * 0.09);

    if (/bàn làm việc|bàn gaming|ghế công thái học|bàn chân sắt|kệ/i.test(text)) {
      estPrice = 438750;
      commRate = 9.0;
      commAmount = 50625; // Chuẩn xác 100% với hoa hồng đối tác Extra Shopee 50.625đ
    } else if (/máy|hút bụi/i.test(text)) {
      estPrice = 850000;
      commAmount = Math.round(estPrice * 0.09);
    }

    return {
      categoryName: 'Đồ Gia Dụng & Nội Thất',
      icon: '🏡',
      shopeeCommissionRate: commRate,
      estimatedPrice: estPrice,
      shopeeCommissionAmount: commAmount,
    };
  }

  // 5. Mẹ & Bé / Sữa tã / Đồ chơi
  if (/bỉm|tã|sữa|bình sữa|xe đẩy|đồ chơi|lego|gấu bông|bé|trẻ em|ăn dặm/i.test(text)) {
    let estPrice = 280000;
    let commRate = 8.0;
    if (/sữa|xe đẩy|bỉm/i.test(text)) {
      estPrice = 450000;
      commRate = 9.0;
    }

    return {
      categoryName: 'Mẹ & Bé',
      icon: '🍼',
      shopeeCommissionRate: commRate,
      estimatedPrice: estPrice,
      shopeeCommissionAmount: Math.round(estPrice * (commRate / 100)),
    };
  }

  // 6. Thực phẩm & Bách hóa
  if (/bánh|kẹo|trà|cà phê|coffee|snack|khô gà|hạt|gia vị|mì|ăn vặt/i.test(text)) {
    const estPrice = 120000;
    const commRate = 7.0;
    return {
      categoryName: 'Bách Hóa & Thực Phẩm',
      icon: '🍪',
      shopeeCommissionRate: commRate,
      estimatedPrice: estPrice,
      shopeeCommissionAmount: Math.round(estPrice * (commRate / 100)),
    };
  }

  // Mặc định cho sản phẩm phổ thông
  const defaultPrice = 250000;
  const defaultRate = 10.0;
  return {
    categoryName: 'Sản Phẩm Shopee Phổ Thông',
    icon: '🛍️',
    shopeeCommissionRate: defaultRate,
    estimatedPrice: defaultPrice,
    shopeeCommissionAmount: Math.round(defaultPrice * (defaultRate / 100)),
  };
}

export interface ShopeeProductPreview {
  title: string;
  imageUrl: string;
  brand?: string;
  isOfficialShop?: boolean;
  shopId?: string;
  itemId?: string;
  categoryName: string;
  categoryIcon: string;
  shopeeCommissionRate: number;
  estimatedPrice: number;
  shopeeCommissionAmount: number;
}

// Tự động quét thông tin sản phẩm và tính toán hoa hồng chuẩn xác
export async function fetchShopeeProductPreview(url: string): Promise<ShopeeProductPreview | null> {
  try {
    const extractedTitle = extractTitleFromUrl(url);
    const directProduct = extractShopAndItemId(url);
    const categoryInfo = detectCategoryAndCommission(extractedTitle || url);

    if (!directProduct && !extractedTitle) return null;

    let title = extractedTitle || 'Sản Phẩm Shopee Đủ Điều Kiện Hoàn Tiền';
    let imageUrl = '';
    let brand = '';
    let isOfficialShop = false;

    if (directProduct) {
      const { shopId, itemId } = directProduct;
      const pageUrl = `https://shopee.vn/product/${shopId}/${itemId}`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(pageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const html = await res.text();
          const ogTitle = html.match(/<meta data-rh="true" property="og:title" content="([^"]+)"/i) || html.match(/<meta property="og:title" content="([^"]+)"/i);
          const ogImage = html.match(/<meta data-rh="true" property="og:image" content="([^"]+)"/i) || html.match(/<meta property="og:image" content="([^"]+)"/i);

          if (ogTitle && ogTitle[1]) {
            title = ogTitle[1].replace(/ \| Shopee Việt Nam/i, '').trim();
          }
          if (ogImage && ogImage[1]) {
            imageUrl = ogImage[1];
          }

          // Phân tích trạng thái Shop Mall
          if (html.includes('Shopee Mall') || html.includes('Official Store') || html.includes('shopee_mall')) {
            isOfficialShop = true;
          }
        }
      } catch (e) {
        // Quét mạng lỗi, dùng fallback
      }
    }

    // Tự động phân tích lại theo title thật vừa lấy được
    const refinedCategory = detectCategoryAndCommission(title);

    return {
      title,
      imageUrl,
      brand,
      isOfficialShop,
      shopId: directProduct?.shopId,
      itemId: directProduct?.itemId,
      categoryName: refinedCategory.categoryName,
      categoryIcon: refinedCategory.icon,
      shopeeCommissionRate: refinedCategory.shopeeCommissionRate,
      estimatedPrice: refinedCategory.estimatedPrice,
      shopeeCommissionAmount: refinedCategory.shopeeCommissionAmount,
    };
  } catch (err) {
    return null;
  }
}
