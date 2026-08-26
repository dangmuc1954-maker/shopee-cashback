import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { fetchShopeeConversionReport } from '@/lib/shopee-api';

export async function POST() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findUnique({ where: { id: 'DEFAULT' } });
    if (!settings?.shopeeAppId || !settings?.shopeeAppSecret) {
      return NextResponse.json({
        success: false,
        message: 'Bạn chưa cấu hình Shopee Open API (App ID & Secret Key) trong phần Cài Đặt. Hãy vào affiliate.shopee.vn -> Open API để lấy mã.',
      }, { status: 400 });
    }

    // Gọi Shopee Open API lấy báo cáo đơn hàng
    const nodes = await fetchShopeeConversionReport(settings.shopeeAppId, settings.shopeeAppSecret);
    if (!nodes) {
      return NextResponse.json({
        success: false,
        message: 'Không thể kết nối với Shopee Open API. Vui lòng kiểm tra lại App ID và Secret Key.',
      }, { status: 500 });
    }

    if (nodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Đã kết nối Shopee thành công! Chưa có đơn hàng mới nào phát sinh trong 30 ngày qua.',
        data: { syncedCount: 0 },
      });
    }

    const userPercent = (settings.commissionUserPercent || 60) / 100;
    const adminPercent = (settings.commissionAdminPercent || 40) / 100;

    let syncedCount = 0;
    let totalCommissionSynced = 0;

    for (const node of nodes) {
      const orderSn = String(node.orderSn || '').trim();
      if (!orderSn) continue;

      const subId = Array.isArray(node.subIds) && node.subIds.length > 0 ? String(node.subIds[0]).trim() : '';
      const rawCommission = Number(node.totalCommission) || (node.items?.reduce((sum: number, it: any) => sum + (Number(it.commission) || 0), 0)) || 0;
      const totalAmount = Number(node.actualAmount) || 0;
      const itemName = node.items?.[0]?.itemName || 'Đơn hàng Shopee';

      // Tính hoa hồng
      const userCashback = Math.round(rawCommission * userPercent);
      const adminProfit = Math.round(rawCommission * adminPercent);

      // Trạng thái đơn Shopee
      let status = 'PENDING';
      const shopeeStatus = String(node.orderStatus || '').toUpperCase();
      if (shopeeStatus.includes('COMPLETE') || shopeeStatus.includes('PAID') || shopeeStatus === 'APPROVED') {
        status = 'APPROVED';
      } else if (shopeeStatus.includes('CANCEL') || shopeeStatus.includes('INVALID')) {
        status = 'REJECTED';
      }

      // Tìm user theo subId
      let matchedUserId: string | null = null;
      if (subId) {
        const link = await prisma.convertedLink.findFirst({
          where: {
            OR: [
              { subId: subId },
              { subId: subId.toLowerCase() },
              { subId: subId.toUpperCase() },
            ],
          },
        });
        if (link?.userId) {
          matchedUserId = link.userId;
        } else {
          const cleanSub = subId.replace(/^(u_|u|user_)/i, '');
          const potentialPrefix = cleanSub.split('_')[0].toLowerCase();
          if (potentialPrefix && potentialPrefix.length >= 3 && potentialPrefix !== 'guest') {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            const foundUser = allUsers.find((u) => u.id.toLowerCase().startsWith(potentialPrefix));
            if (foundUser) matchedUserId = foundUser.id;
          }
        }
      }

      // Lưu đơn vào DB
      const existingOrder = await prisma.cashbackOrder.findUnique({ where: { orderSn } });
      if (existingOrder) {
        if (existingOrder.status !== status) {
          await prisma.cashbackOrder.update({
            where: { orderSn },
            data: { status },
          });

          // Nếu đơn chuyển sang APPROVED -> Cộng tiền ví
          if (existingOrder.status !== 'APPROVED' && status === 'APPROVED' && matchedUserId && userCashback > 0) {
            await prisma.user.update({
              where: { id: matchedUserId },
              data: { balance: { increment: userCashback } },
            });
          }
        }
      } else {
        await prisma.cashbackOrder.create({
          data: {
            orderSn,
            subId: subId || 'SHOPEE_API',
            itemName,
            totalAmount,
            shopeeCommission: rawCommission,
            userCashback,
            adminProfit,
            status,
            userId: matchedUserId,
          },
        });

        if (status === 'APPROVED' && matchedUserId && userCashback > 0) {
          await prisma.user.update({
            where: { id: matchedUserId },
            data: { balance: { increment: userCashback } },
          });
        }
        syncedCount++;
        totalCommissionSynced += rawCommission;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đồng bộ thành công ${nodes.length} đơn hàng từ Shopee Open API! (${syncedCount} đơn mới)`,
      data: {
        totalOrdersFromShopee: nodes.length,
        newOrdersSynced: syncedCount,
        totalCommissionSynced,
      },
    });
  } catch (error: any) {
    console.error('Lỗi đồng bộ Shopee Open API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi đồng bộ đơn từ Shopee' },
      { status: 500 }
    );
  }
}
