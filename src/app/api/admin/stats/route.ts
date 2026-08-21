import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentAdmin();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Quyền truy cập bị từ chối!' }, { status: 403 });
    }

    const [
      totalUsers,
      totalLinks,
      orders,
      pendingWithdrawals,
      paidWithdrawals,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.convertedLink.count(),
      prisma.cashbackOrder.findMany(),
      prisma.withdrawal.findMany({ where: { status: 'PENDING' } }),
      prisma.withdrawal.findMany({ where: { status: 'PAID' } }),
    ]);

    const totalOrdersCount = orders.length;
    const totalOrderAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalShopeeCommission = orders.reduce((sum, o) => sum + (o.shopeeCommission || 0), 0);
    const totalUserCashback = orders.reduce((sum, o) => sum + (o.userCashback || 0), 0);
    const totalAdminProfit = orders.reduce((sum, o) => sum + (o.adminProfit || 0), 0);

    const pendingWithdrawalCount = pendingWithdrawals.length;
    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalPaidWithdrawalAmount = paidWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalLinks,
        totalOrdersCount,
        totalOrderAmount,
        totalShopeeCommission,
        totalUserCashback,
        totalAdminProfit,
        pendingWithdrawalCount,
        pendingWithdrawalAmount,
        totalPaidWithdrawalAmount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi lấy thống kê Admin' },
      { status: 500 }
    );
  }
}
