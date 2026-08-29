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
  const t = (titleOrUrl || '').toLowerCase();

  let categoryName = 'Sản Phẩm Shopee Phổ Thông';
  let icon = '🛍️';
  let price = 250000;
  let shopeeRate = 8.0; // Mặc định 8% hoa hồng Shopee

  // 1. Điện thoại, Laptop & Thiết bị công nghệ
  if (/iphone\s*1[456]/i.test(t)) {
    categoryName = 'Điện Thoại Cao Cấp';
    icon = '📱';
    price = /pro\s*max/i.test(t) ? 29000000 : /pro/i.test(t) ? 24000000 : /plus/i.test(t) ? 20000000 : 18000000;
    shopeeRate = 3.5;
  } else if (/iphone\s*(1[123]|xs|xr|x|8|se)/i.test(t)) {
    categoryName = 'Điện Thoại iPhone';
    icon = '📱';
    price = 8500000;
    shopeeRate = 3.5;
  } else if (/samsung\s*(galaxy\s*)?(s2[234]|z\s*fold|z\s*flip)/i.test(t)) {
    categoryName = 'Điện Thoại Flagship';
    icon = '📱';
    price = 18000000;
    shopeeRate = 3.5;
  } else if (/samsung|xiaomi|oppo|realme|vivo/i.test(t)) {
    categoryName = 'Điện Thoại & Smartphone';
    icon = '📱';
    price = 4500000;
    shopeeRate = 4.0;
  } else if (/laptop|macbook/i.test(t)) {
    categoryName = 'Máy Tính & Laptop';
    icon = '💻';
    price = /macbook/i.test(t) ? 22000000 : 14000000;
    shopeeRate = 3.5;
  } else if (/ipad|máy tính bảng|tablet/i.test(t)) {
    categoryName = 'Máy Tính Bảng / iPad';
    icon = '📱';
    price = 9500000;
    shopeeRate = 3.5;
  } else if (/tai nghe|airpods|headphone|earbuds/i.test(t)) {
    categoryName = 'Tai Nghe & Âm Thanh';
    icon = '🎧';
    price = /airpods|sony|marshall/i.test(t) ? 2800000 : /havit|baseus|soundpeats/i.test(t) ? 450000 : 250000;
    shopeeRate = 6.0;
  } else if (/chuột|bàn phím|loa bluetooth|sạc dự phòng|củ sạc|cáp sạc|pin dự phòng|smartwatch|đồng hồ thông minh/i.test(t)) {
    categoryName = 'Phụ Kiện Công Nghệ';
    icon = '🔌';
    price = /cáp|dây sạc/i.test(t) ? 90000 : /sạc dự phòng|củ sạc/i.test(t) ? 280000 : /loa/i.test(t) ? 550000 : 350000;
    shopeeRate = 7.0;
  }

  // 2. Nội thất, Đồ gia dụng & Đời sống
  else if (/bàn\s*làm\s*việc|bàn\s*gaming|bàn\s*chân\s*(chữ\s*)?[kzuz]|ghế\s*gaming|ghế\s*công\s*thái\s*học/i.test(t)) {
    categoryName = 'Nội Thất & Bàn Ghế Gaming';
    icon = '🪑';
    price = /kèm\s*kệ|kệ\s*lửng|2x4/i.test(t) ? 562500 : 438750;
    shopeeRate = 9.0; // 9% hoa hồng Shopee Extra đối tác
  } else if (/nồi\s*chiên|máy\s*hút\s*bụi|máy\s*lọc\s*không\s*khí|máy\s*rửa\s*bát|máy\s*giặt|tủ\s*lạnh/i.test(t)) {
    categoryName = 'Thiết Bị Gia Dụng Lớn';
    icon = '🏠';
    price = /lock&lock|philips|tefal|xiaomi/i.test(t) ? 1650000 : 850000;
    shopeeRate = 8.5;
  } else if (/nồi|chảo|nồi\s*cơm|ấm\s*siêu\s*tốc|bếp\s*từ|máy\s*xay/i.test(t)) {
    categoryName = 'Dụng Cụ Nhà Bếp';
    icon = '🍳';
    price = 450000;
    shopeeRate = 8.5;
  } else if (/chăn|ga|gối|đệm|rèm|tủ\s*quần\s*áo|kệ\s*sách|kệ|tủ|đèn/i.test(t)) {
    categoryName = 'Đồ Gia Dụng & Trang Trí';
    icon = '🏡';
    price = 320000;
    shopeeRate = 9.0;
  }

  // 3. Thời trang, Giày dép & Phụ kiện
  else if (/giày|sneaker|dép|sandal/i.test(t)) {
    categoryName = 'Giày Dép & Sneaker';
    icon = '👟';
    price = /nike|adidas|mlb|converse/i.test(t) ? 800000 : 200000;
    shopeeRate = 12.0;
  } else if (/túi\s*xách|balo|ví\s*nam|ví\s*nữ/i.test(t)) {
    categoryName = 'Túi Xách & Balo';
    icon = '👜';
    price = 180000;
    shopeeRate = 12.0;
  } else if (/áo\s*khoác|áo\s*hoodie|áo\s*len|áo\s*vest/i.test(t)) {
    categoryName = 'Thời Trang Thu Đông';
    icon = '🧥';
    price = 220000;
    shopeeRate = 12.0;
  } else if (/đầm|váy/i.test(t)) {
    categoryName = 'Váy & Đầm Nữ';
    icon = '👗';
    price = 100000; // Giá váy trung bình Shopee 100.000đ
    shopeeRate = 12.0; // Hoa hồng Shopee 12% = 12.000đ -> Khách nhận 40% = 4.800đ (Chuẩn 4.8k)
  } else if (/áo\s*(thun|polo|sơ\s*mi)|quần\s*(jean|tây|short|kaki)/i.test(t)) {
    categoryName = 'Quần Áo Thời Trang';
    icon = '👕';
    price = 100000; // Giá áo quần phổ thông 100.000đ -> Hoa hồng 12.000đ -> Khách nhận 40% = 4.800đ
    shopeeRate = 12.0;
  } else if (/đồ\s*lót|tất|vớ|nón|mũ|thắt\s*lưng|phụ\s*kiện/i.test(t)) {
    categoryName = 'Phụ Kiện Thời Trang';
    icon = '🧢';
    price = 40000;
    shopeeRate = 12.0;
  }

  // 4. Mỹ phẩm & Chăm sóc sắc đẹp
  else if (/nước\s*hoa/i.test(t)) {
    categoryName = 'Nước Hoa Cao Cấp';
    icon = '✨';
    price = 550000;
    shopeeRate = 12.0;
  } else if (/serum|kem\s*dưỡng|kem\s*chống\s*nắng|tretinoin|retinol|skincare/i.test(t)) {
    categoryName = 'Mỹ Phẩm & Dưỡng Da';
    icon = '🧴';
    price = /anessa|la\s*roche|kiehl|skinceuticals/i.test(t) ? 650000 : 320000;
    shopeeRate = 11.0;
  } else if (/son|son\s*kem|son\s*thỏi|son\s*bóng|tint/i.test(t)) {
    categoryName = 'Son Môi & Trang Điểm';
    icon = '💄';
    price = 120000; // Giá son phổ thông 120.000đ -> Hoa hồng 12.000đ -> Khách nhận 40% = 4.800đ
    shopeeRate = 10.0;
  } else if (/sữa\s*rửa\s*mặt|tẩy\s*trang|toner|mặt\s*nạ|dầu\s*gội|sữa\s*tắm/i.test(t)) {
    categoryName = 'Chăm Sóc Cá Nhân';
    icon = '🫧';
    price = 120000;
    shopeeRate = 10.0;
  }

  // 5. Mẹ & Bé
  else if (/sữa\s*bột|sữa\s*công\s*thức|xe\s*đẩy|nôi|ghế\s*ăn\s*dặm/i.test(t)) {
    categoryName = 'Sữa & Đồ Dùng Trẻ Em';
    icon = '🍼';
    price = 580000;
    shopeeRate = 8.0;
  } else if (/bỉm|tã|bình\s*sữa|núm\s*ti/i.test(t)) {
    categoryName = 'Tã Bỉm & Vệ Sinh Cho Bé';
    icon = '👶';
    price = 280000;
    shopeeRate = 8.0;
  } else if (/đồ\s*chơi|lego|gấu\s*bông/i.test(t)) {
    categoryName = 'Đồ Chơi Cho Bé';
    icon = '🧸';
    price = 160000;
    shopeeRate = 9.0;
  }

  // 6. Thực phẩm & Bách hóa
  else if (/thực\s*phẩm\s*chức\s*năng|collagen|vitamin|omega|whey/i.test(t)) {
    categoryName = 'Thực Phẩm Bổ Sung';
    icon = '💊';
    price = 450000;
    shopeeRate = 9.0;
  } else if (/bánh|kẹo|trà|cà\s*phê|coffee|hạt|khô\s*bò|khô\s*gà|ăn\s*vặt/i.test(t)) {
    categoryName = 'Bách Hóa & Thực Phẩm';
    icon = '🍪';
    price = 110000;
    shopeeRate = 7.0;
  }

  const shopeeCommissionAmount = Math.round(price * (shopeeRate / 100));

  return {
    categoryName,
    icon,
    shopeeCommissionRate: shopeeRate,
    estimatedPrice: price,
    shopeeCommissionAmount,
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
      const targetUrls = [
        `https://shopee.vn/a-i.${shopId}.${itemId}`,
        `https://shopee.vn/product/${shopId}/${itemId}`,
      ];

      for (const pageUrl of targetUrls) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

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
            const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+property="og:title"/i);
            const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+property="og:image"/i);

            if (ogTitle && ogTitle[1] && !ogTitle[1].includes('Shopee Việt Nam | Mua và Bán')) {
              title = ogTitle[1].replace(/ \| Shopee Việt Nam/i, '').trim();
            }
            if (ogImage && ogImage[1] && !ogImage[1].includes('homepagefe')) {
              imageUrl = ogImage[1];
            }

            // Phân tích trạng thái Shop Mall
            if (html.includes('Shopee Mall') || html.includes('Official Store') || html.includes('shopee_mall')) {
              isOfficialShop = true;
            }

            if (title && imageUrl) break;
          }
        } catch (e) {
          // Thử URL tiếp theo
        }
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
