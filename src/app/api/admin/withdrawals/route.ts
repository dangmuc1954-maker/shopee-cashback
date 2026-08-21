import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullname: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      withdrawals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi lấy danh sách rút tiền' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { withdrawalId, status, adminNote } = await req.json();

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin cập nhật!' },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy yêu cầu rút tiền!' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: `Yêu cầu này đã được xử lý trước đó (${withdrawal.status})!` },
        { status: 400 }
      );
    }

    // Xử lý cập nhật
    if (status === 'PAID') {
      // Đánh dấu đã thanh toán thành công
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'PAID',
            adminNote: adminNote || 'Đã chuyển khoản thành công',
            paidAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: withdrawal.userId },
          data: {
            totalWithdrawn: { increment: withdrawal.amount },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Đã xác nhận thanh toán chuyển khoản cho khách hàng!',
      });
    } else if (status === 'REJECTED') {
      // Từ chối và hoàn tiền lại ví cho khách
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'REJECTED',
            adminNote: adminNote || 'Từ chối yêu cầu rút tiền',
          },
        }),
        prisma.user.update({
          where: { id: withdrawal.userId },
          data: {
            balance: { increment: withdrawal.amount },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Đã từ chối và hoàn tiền lại vào ví của khách hàng!',
      });
    }

    return NextResponse.json({ success: false, message: 'Trạng thái không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi duyệt rút tiền:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
