import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập số điện thoại và mật khẩu!' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản không tồn tại!' },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu không chính xác!' },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
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
      message: 'Đăng nhập thành công!',
      user: {
        id: user.id,
        phone: user.phone,
        fullname: user.fullname,
        role: user.role,
        balance: user.balance,
        pendingBalance: user.pendingBalance,
      },
    });
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống khi đăng nhập' },
      { status: 500 }
    );
  }
}
