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
    const search = searchParams.get('q')?.trim();

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { phone: { contains: search } },
        { fullname: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        phone: true,
        fullname: true,
        email: true,
        role: true,
        balance: true,
        pendingBalance: true,
        totalWithdrawn: true,
        bankName: true,
        bankAccountNo: true,
        bankAccountName: true,
        createdAt: true,
        _count: {
          select: {
            links: true,
            orders: true,
            withdrawals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi lấy danh sách user' },
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

    const { userId, balance, pendingBalance } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Thiếu userId!' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(balance !== undefined ? { balance: Number(balance) } : {}),
        ...(pendingBalance !== undefined ? { pendingBalance: Number(pendingBalance) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật số dư người dùng thành công!',
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi cập nhật user' },
      { status: 500 }
    );
  }
}
