import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

// Xuất toàn bộ dữ liệu hệ thống ra file JSON
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const [users, links, orders, withdrawals, settings] = await Promise.all([
      prisma.user.findMany({ select: { id: true, phone: true, email: true, fullname: true, role: true, balance: true, pendingBalance: true, totalWithdrawn: true, bankName: true, bankAccountNo: true, bankAccountName: true, createdAt: true } }),
      prisma.convertedLink.findMany(),
      prisma.cashbackOrder.findMany(),
      prisma.withdrawal.findMany(),
      prisma.systemSetting.findUnique({ where: { id: 'DEFAULT' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        backupDate: new Date().toISOString(),
        users,
        links,
        orders,
        withdrawals,
        settings,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xuất dữ liệu sao lưu' },
      { status: 500 }
    );
  }
}

// Khôi phục dữ liệu hệ thống từ file JSON
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { data } = await req.json();
    if (!data) {
      return NextResponse.json({ success: false, message: 'Dữ liệu sao lưu không hợp lệ!' }, { status: 400 });
    }

    const { users, links, orders, withdrawals, settings } = data;

    // Khôi phục cài đặt
    if (settings) {
      await prisma.systemSetting.upsert({
        where: { id: 'DEFAULT' },
        update: {
          shopeeAffId: settings.shopeeAffId,
          shopeeAppId: settings.shopeeAppId || null,
          shopeeAppSecret: settings.shopeeAppSecret || null,
          commissionUserPercent: settings.commissionUserPercent,
          commissionAdminPercent: settings.commissionAdminPercent,
          minWithdrawAmount: settings.minWithdrawAmount,
          announcement: settings.announcement,
        },
        create: {
          id: 'DEFAULT',
          shopeeAffId: settings.shopeeAffId || '17352020564',
          shopeeAppId: settings.shopeeAppId || null,
          shopeeAppSecret: settings.shopeeAppSecret || null,
          commissionUserPercent: settings.commissionUserPercent || 60,
          commissionAdminPercent: settings.commissionAdminPercent || 40,
          minWithdrawAmount: settings.minWithdrawAmount || 50000,
          announcement: settings.announcement || '',
        },
      });
    }

    // Khôi phục links
    if (Array.isArray(links) && links.length > 0) {
      for (const link of links) {
        try {
          await prisma.convertedLink.upsert({
            where: { subId: link.subId },
            update: { clicks: link.clicks || 0 },
            create: {
              id: link.id,
              userId: link.userId || null,
              originalUrl: link.originalUrl,
              affiliateUrl: link.affiliateUrl,
              subId: link.subId,
              productTitle: link.productTitle || null,
              clicks: link.clicks || 0,
            },
          });
        } catch (e) {}
      }
    }

    // Khôi phục orders
    if (Array.isArray(orders) && orders.length > 0) {
      for (const ord of orders) {
        try {
          await prisma.cashbackOrder.upsert({
            where: { orderSn: ord.orderSn },
            update: { status: ord.status },
            create: {
              id: ord.id,
              userId: ord.userId || null,
              orderSn: ord.orderSn,
              subId: ord.subId,
              itemName: ord.itemName || 'Đơn hàng Shopee',
              totalAmount: ord.totalAmount || 0,
              shopeeCommission: ord.shopeeCommission || 0,
              userCashback: ord.userCashback || 0,
              adminProfit: ord.adminProfit || 0,
              status: ord.status || 'APPROVED',
            },
          });
        } catch (e) {}
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Khôi phục dữ liệu hệ thống thành công!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khôi phục dữ liệu' },
      { status: 500 }
    );
  }
}
