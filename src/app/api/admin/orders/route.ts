import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('q')?.trim();

    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { orderSn: { contains: search } },
        { subId: { contains: search } },
        { itemName: { contains: search } },
      ];
    }

    const orders = await prisma.cashbackOrder.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi lấy danh sách đơn hàng' },
      { status: 500 }
    );
  }
}

// Thêm đơn hàng thủ công
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { orderSn, subId, itemName, totalAmount, shopeeCommission, status } = await req.json();

    if (!orderSn) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mã đơn hàng Shopee!' }, { status: 400 });
    }

    const cleanOrderSn = String(orderSn).trim();
    const cleanSubId = String(subId || '').trim();
    const cleanAmount = Number(totalAmount) || 0;
    const cleanCommission = Number(shopeeCommission) || 0;

    // Lấy tỷ lệ hoa hồng
    const settings = await prisma.systemSetting.findUnique({ where: { id: 'DEFAULT' } });
    const userPercent = (settings?.commissionUserPercent || 40) / 100;
    const adminPercent = 1 - userPercent;

    const userCashback = Math.round(cleanCommission * userPercent);
    const adminProfit = Math.round(cleanCommission * adminPercent);
    const orderStatus = status || 'APPROVED';

    // Tìm user theo subId
    let matchedUserId: string | null = null;
    if (cleanSubId) {
      const link = await prisma.convertedLink.findFirst({
        where: {
          OR: [
            { subId: cleanSubId },
            { subId: cleanSubId.toLowerCase() },
            { subId: cleanSubId.toUpperCase() },
          ],
        },
      });
      if (link?.userId) {
        matchedUserId = link.userId;
      } else {
        const cleanSub = cleanSubId.replace(/^(u_|u|user_)/i, '');
        const potentialPrefix = cleanSub.split('_')[0].toLowerCase();
        if (potentialPrefix && potentialPrefix.length >= 3 && potentialPrefix !== 'guest') {
          const allUsers = await prisma.user.findMany({ select: { id: true } });
          const foundUser = allUsers.find((u) => u.id.toLowerCase().startsWith(potentialPrefix));
          if (foundUser) matchedUserId = foundUser.id;
        }
      }
    }

    // Tạo đơn hàng và cộng tiền nếu APPROVED
    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.cashbackOrder.create({
        data: {
          orderSn: cleanOrderSn,
          subId: cleanSubId || 'MANUAL',
          itemName: itemName || 'Đơn thêm thủ công',
          totalAmount: cleanAmount,
          shopeeCommission: cleanCommission,
          userCashback,
          adminProfit,
          status: orderStatus,
          userId: matchedUserId,
        },
      });

      if (orderStatus === 'APPROVED' && matchedUserId && userCashback > 0) {
        await tx.user.update({
          where: { id: matchedUserId },
          data: { balance: { increment: userCashback } },
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Thêm đơn hàng thành công!',
      order: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi thêm đơn hàng' },
      { status: 500 }
    );
  }
}

// Cập nhật trạng thái đơn hàng
export async function PUT(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin cập nhật!' }, { status: 400 });
    }

    const order = await prisma.cashbackOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng!' }, { status: 404 });
    }

    const oldStatus = order.status;
    const newStatus = status;

    if (oldStatus === newStatus) {
      return NextResponse.json({ success: true, message: 'Trạng thái không đổi' });
    }

    // Xử lý biến động số dư khi đổi trạng thái
    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái đơn
      await tx.cashbackOrder.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      if (order.userId) {
        // Từ PENDING sang APPROVED -> Cộng số dư
        if (oldStatus === 'PENDING' && newStatus === 'APPROVED') {
          await tx.user.update({
            where: { id: order.userId },
            data: {
              balance: { increment: order.userCashback },
              pendingBalance: { decrement: order.userCashback },
            },
          });
        }
        // Từ APPROVED sang REJECTED -> Trừ lại số dư đã cộng
        else if (oldStatus === 'APPROVED' && newStatus === 'REJECTED') {
          await tx.user.update({
            where: { id: order.userId },
            data: {
              balance: { decrement: order.userCashback },
            },
          });
        }
        // Từ REJECTED sang APPROVED -> Cộng lại tiền vào ví
        else if (oldStatus === 'REJECTED' && newStatus === 'APPROVED') {
          await tx.user.update({
            where: { id: order.userId },
            data: {
              balance: { increment: order.userCashback },
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi cập nhật đơn hàng' },
      { status: 500 }
    );
  }
}

// Xóa đơn hàng
export async function DELETE(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Thiếu orderId!' }, { status: 400 });
    }

    await prisma.cashbackOrder.delete({ where: { id: orderId } });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa đơn hàng khỏi hệ thống!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xóa đơn hàng' },
      { status: 500 }
    );
  }
}
