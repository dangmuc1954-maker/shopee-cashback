import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập!' }, { status: 401 });
    }

    const { amount, bankName, bankAccountNo, bankAccountName } = await req.json();

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Số tiền rút không hợp lệ!' },
        { status: 400 }
      );
    }

    if (!bankName || !bankAccountNo || !bankAccountName) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng!' },
        { status: 400 }
      );
    }

    // Lấy cài đặt mức rút tối thiểu
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'DEFAULT' },
    });
    const minAmount = settings?.minWithdrawAmount || 50000;

    if (withdrawAmount < minAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Số tiền rút tối thiểu là ${minAmount.toLocaleString('vi-VN')} VNĐ!`,
        },
        { status: 400 }
      );
    }

    // Lấy thông tin user mới nhất từ DB
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!freshUser || freshUser.balance < withdrawAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Số dư khả dụng của bạn (${(freshUser?.balance || 0).toLocaleString('vi-VN')}đ) không đủ để rút ${withdrawAmount.toLocaleString('vi-VN')}đ!`,
        },
        { status: 400 }
      );
    }

    // Thực hiện giao dịch nguyên tử (Atomic Transaction): Trừ số dư & Tạo yêu cầu rút
    const result = await prisma.$transaction(async (tx) => {
      // 1. Trừ số dư ví
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: withdrawAmount },
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim().toUpperCase(),
        },
      });

      // 2. Tạo yêu cầu rút tiền
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount: withdrawAmount,
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim().toUpperCase(),
          status: 'PENDING',
        },
      });

      return { updatedUser, withdrawal };
    });

    return NextResponse.json({
      success: true,
      message: 'Gửi yêu cầu rút tiền thành công! Admin sẽ duyệt và chuyển khoản sớm nhất cho bạn.',
      data: {
        withdrawalId: result.withdrawal.id,
        newBalance: result.updatedUser.balance,
      },
    });
  } catch (error: any) {
    console.error('Lỗi tạo yêu cầu rút tiền:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống khi rút tiền' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập!' }, { status: 401 });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      withdrawals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi lấy lịch sử rút tiền' },
      { status: 500 }
    );
  }
}
