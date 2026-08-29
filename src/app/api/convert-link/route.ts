import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isValidShopeeUrl, convertToAffiliateUrl, generateSubId, resolveShopeeShortLink, fetchShopeeProductPreview } from '@/lib/shopee';
import { generateShopeeApiShortLink, fetchShopeeProductOffer } from '@/lib/shopee-api';
import { extractShopAndItemId } from '@/lib/shopee';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đường link sản phẩm Shopee!' },
        { status: 400 }
      );
    }

    if (!isValidShopeeUrl(url)) {
      return NextResponse.json(
        { success: false, message: 'Đường link không hợp lệ! Vui lòng nhập link từ shopee.vn, s.shopee.vn, shope.ee hoặc vn.shp.ee' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    // Lấy cài đặt hệ thống (Shopee Affiliate ID của Admin) với cơ chế fallback an toàn
    let settings = null;
    try {
      settings = await prisma.systemSetting.findUnique({
        where: { id: 'DEFAULT' },
      });
    } catch (dbErr) {
      console.warn('Không thể đọc settings từ DB, sử dụng giá trị mặc định:', dbErr);
    }

    const shopeeAffId = settings?.shopeeAffId || '17352020564';
    const userIdentifier = user ? user.id : 'GUEST';
    const subId = generateSubId(userIdentifier);
    
    // Tự động giải mã link rút gọn thành link sản phẩm gốc
    const cleanOriginalUrl = await resolveShopeeShortLink(url);
    const conv = convertToAffiliateUrl(cleanOriginalUrl, shopeeAffId, subId);

    // Quét thông tin sản phẩm (Tiêu đề, ảnh bìa, shop Mall, thương hiệu)
    let productPreview = await fetchShopeeProductPreview(cleanOriginalUrl);

    let affiliateUrl = '';

    // Nếu Admin đã cấu hình Open API App ID & Secret Key, ưu tiên gọi thẳng Shopee API
    if (settings?.shopeeAppId && settings?.shopeeAppSecret) {
      // 1. Lấy Link rút gọn chính thức qua API
      const apiShortLink = await generateShopeeApiShortLink(
        cleanOriginalUrl,
        subId,
        settings.shopeeAppId,
        settings.shopeeAppSecret
      );
      if (apiShortLink) {
        affiliateUrl = apiShortLink;
      }

      // 2. Truy vấn trực tiếp hoa hồng thật 100% của sản phẩm từ máy chủ Shopee GraphQL (productOfferV2)
      const directProd = extractShopAndItemId(cleanOriginalUrl);
      if (directProd?.itemId) {
        const liveOffer = await fetchShopeeProductOffer(
          directProd.itemId,
          settings.shopeeAppId,
          settings.shopeeAppSecret
        );
        if (liveOffer) {
          productPreview = {
            title: liveOffer.productName || productPreview?.title || 'Sản Phẩm Shopee Đủ Điều Kiện Hoàn Tiền',
            imageUrl: liveOffer.imageUrl || productPreview?.imageUrl || '',
            brand: productPreview?.brand || '',
            isOfficialShop: productPreview?.isOfficialShop || false,
            shopId: directProd.shopId,
            itemId: directProd.itemId,
            categoryName: productPreview?.categoryName || 'Sản Phẩm Shopee',
            categoryIcon: productPreview?.categoryIcon || '🛍️',
            shopeeCommissionRate: liveOffer.commissionRate || productPreview?.shopeeCommissionRate || 8,
            estimatedPrice: liveOffer.price || productPreview?.estimatedPrice || 100000,
            shopeeCommissionAmount: liveOffer.commission || productPreview?.shopeeCommissionAmount || 0,
          };
        }
      }
    }

    // Nếu không có API Key hoặc API trả về rỗng -> Sử dụng định dạng Universal Tracking s.shopee.vn/an_redir chính thức
    if (!affiliateUrl) {
      affiliateUrl = conv.affiliateUrl;
    }

    // Lưu vào database
    try {
      await prisma.convertedLink.create({
        data: {
          userId: user ? user.id : null,
          originalUrl: cleanOriginalUrl,
          affiliateUrl: affiliateUrl,
          subId: subId,
          productTitle: productPreview?.title || null,
          clicks: 0,
        },
      });
    } catch (dbErr) {
      console.warn('Lưu link vào DB thất bại:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Chuyển đổi link Shopee Affiliate thành công!',
      data: {
        originalUrl: cleanOriginalUrl,
        affiliateUrl,
        directUrl: conv.directUrl,
        subId,
        isLoggedIn: !!user,
        commissionRate: 40,
        productPreview,
      },
    });
  } catch (error: any) {
    console.error('Lỗi chuyển đổi link:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống khi chuyển đổi link' },
      { status: 500 }
    );
  }
}
