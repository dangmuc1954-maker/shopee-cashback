import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { saveDbSnapshot } from '@/lib/db-sync';

export async function POST(req: Request) {
  try {
    const { phone, password, fullname, email } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ số điện thoại và mật khẩu!' },
        { status: 400 }
      );
    }

    let cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('84') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại không hợp lệ!' },
        { status: 400 }
      );
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existing = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại này đã được đăng ký tài khoản!' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        phone: cleanPhone,
        password: hashedPassword,
        fullname: fullname?.trim() || null,
        email: email?.trim() || null,
        role: 'USER',
        balance: 0,
        pendingBalance: 0,
      },
    });

    saveDbSnapshot().catch(() => {});

    // Tạo cookie session đăng nhập
    const token = await createSessionToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
      fullname: user.fullname,
      balance: user.balance,
      pendingBalance: user.pendingBalance,
    });

    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 ngày
    });

    return NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: {
        id: user.id,
        phone: user.phone,
        fullname: user.fullname,
        role: user.role,
        balance: user.balance ?? 0,
        pendingBalance: user.pendingBalance ?? 0,
        totalWithdrawn: user.totalWithdrawn ?? 0,
      },
    });
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống khi đăng ký' },
      { status: 500 }
    );
  }
}
