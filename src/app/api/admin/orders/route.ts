import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { saveDbSnapshot } from '@/lib/db-sync';

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

    const { orderSn, subId, userId, itemName, totalAmount, shopeeCommission, userCashback: customCashback, status } = await req.json();

    if (!orderSn) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mã đơn hàng Shopee!' }, { status: 400 });
    }

    const cleanOrderSn = String(orderSn).trim();
    const cleanSubId = String(subId || '').trim();
    const cleanAmount = Number(totalAmount) || 0;
    const cleanCommission = Number(shopeeCommission) || 0;

    // Lấy tỷ lệ hoa hồng
    const settings = await prisma.systemSetting.findUnique({ where: { id: 'DEFAULT' } });
    const userPercent = (settings?.commissionUserPercent || 60) / 100;
    const adminPercent = 1 - userPercent;

    const calculatedCashback = Math.round(cleanCommission * userPercent);
    const finalCashback = customCashback !== undefined && !isNaN(Number(customCashback))
      ? Math.max(0, Number(customCashback))
      : calculatedCashback;
    const adminProfit = Math.max(0, cleanCommission - finalCashback);
    const orderStatus = status || 'APPROVED';

    // Tìm user: Ưu tiên userId Admin chọn trực tiếp
    let matchedUserId: string | null = userId && String(userId).trim() ? String(userId).trim() : null;

    if (!matchedUserId && cleanSubId) {
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
          userCashback: finalCashback,
          adminProfit,
          status: orderStatus,
          userId: matchedUserId,
          completedAt: orderStatus === 'APPROVED' ? new Date() : null,
        },
      });

      if (orderStatus === 'APPROVED' && matchedUserId && finalCashback > 0) {
        await tx.user.update({
          where: { id: matchedUserId },
          data: { balance: { increment: finalCashback } },
        });
      }

      return newOrder;
    });

    saveDbSnapshot().catch(() => {});

    return NextResponse.json({
      success: true,
      message: orderStatus === 'APPROVED' && matchedUserId
        ? `Đã thêm đơn hàng và cộng ${finalCashback.toLocaleString('vi-VN')} đ vào ví khách!`
        : 'Thêm đơn hàng thành công!',
      order: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi thêm đơn hàng' },
      { status: 500 }
    );
  }
}

// Cập nhật trạng thái đơn hàng & duyệt chi tiền ví
export async function PUT(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { orderId, status, userCashback, totalAmount, shopeeCommission, userId: targetUserId } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin cập nhật!' }, { status: 400 });
    }

    const order = await prisma.cashbackOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng!' }, { status: 404 });
    }

    const oldStatus = order.status;
    const newStatus = status;
    const finalUserId = targetUserId || order.userId;
    const cashbackAmount = userCashback !== undefined && !isNaN(Number(userCashback))
      ? Math.max(0, Number(userCashback))
      : order.userCashback;

    // Xử lý biến động số dư khi đổi trạng thái hoặc duyệt đơn
    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái và số tiền đơn
      await tx.cashbackOrder.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          userCashback: cashbackAmount,
          userId: finalUserId,
          totalAmount: totalAmount !== undefined ? Number(totalAmount) : order.totalAmount,
          shopeeCommission: shopeeCommission !== undefined ? Number(shopeeCommission) : order.shopeeCommission,
          completedAt: newStatus === 'APPROVED' ? new Date() : order.completedAt,
        },
      });

      if (finalUserId) {
        // Trường hợp 1: Chuyển từ PENDING sang APPROVED -> Cộng đủ tiền vào ví
        if (oldStatus === 'PENDING' && newStatus === 'APPROVED') {
          if (cashbackAmount > 0) {
            await tx.user.update({
              where: { id: finalUserId },
              data: { balance: { increment: cashbackAmount } },
            });
          }
        }
        // Trường hợp 2: Đã APPROVED từ trước nhưng Admin sửa lại số tiền hoàn (ví dụ từ 0đ -> 18.000đ)
        else if (oldStatus === 'APPROVED' && newStatus === 'APPROVED') {
          // Nếu trước đó đơn chưa gán user và giờ mới gán: cộng toàn bộ tiền
          if (!order.userId && finalUserId) {
            if (cashbackAmount > 0) {
              await tx.user.update({
                where: { id: finalUserId },
                data: { balance: { increment: cashbackAmount } },
              });
            }
          } else {
            // Đã có user, tính độ lệch tiền để cộng/trừ chính xác
            const diff = cashbackAmount - order.userCashback;
            if (diff !== 0) {
              await tx.user.update({
                where: { id: finalUserId },
                data: { balance: { increment: diff } },
              });
            }
          }
        }
        // Trường hợp 3: Từ APPROVED sang REJECTED -> Trừ lại số dư đã cộng
        else if (oldStatus === 'APPROVED' && newStatus === 'REJECTED') {
          if (order.userCashback > 0) {
            await tx.user.update({
              where: { id: finalUserId },
              data: { balance: { decrement: order.userCashback } },
            });
          }
        }
        // Trường hợp 4: Từ REJECTED sang APPROVED -> Cộng lại tiền vào ví
        else if (oldStatus === 'REJECTED' && newStatus === 'APPROVED') {
          if (cashbackAmount > 0) {
            await tx.user.update({
              where: { id: finalUserId },
              data: { balance: { increment: cashbackAmount } },
            });
          }
        }
      }
    });

    saveDbSnapshot().catch(() => {});

    return NextResponse.json({
      success: true,
      message: newStatus === 'APPROVED'
        ? `Đã duyệt đơn hàng thành công và cộng ${cashbackAmount.toLocaleString('vi-VN')} đ vào ví khách!`
        : 'Cập nhật trạng thái đơn hàng thành công!',
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
