import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isValidShopeeUrl, convertToAffiliateUrl, generateSubId } from '@/lib/shopee';

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
        { success: false, message: 'Đường link không hợp lệ! Vui lòng nhập link từ shopee.vn, s.shopee.vn hoặc shope.ee' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    // Lấy cài đặt hệ thống (Shopee Affiliate ID của Admin)
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'DEFAULT' },
    });

    const shopeeAffId = settings?.shopeeAffId || '17300000000';
    const userIdentifier = user ? user.id : 'GUEST';
    const subId = generateSubId(userIdentifier);

    // Chuyển đổi link
    const { affiliateUrl, cleanOriginalUrl } = convertToAffiliateUrl(url, shopeeAffId, subId);

    // Lưu vào database nếu người dùng đã đăng nhập hoặc lưu tracking
    let savedLink = null;
    try {
      savedLink = await prisma.convertedLink.create({
        data: {
          userId: user ? user.id : null,
          originalUrl: cleanOriginalUrl,
          affiliateUrl: affiliateUrl,
          subId: subId,
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
        subId,
        isLoggedIn: !!user,
        commissionRate: settings?.commissionUserPercent || 60,
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
