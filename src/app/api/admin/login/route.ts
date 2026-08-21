import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { ADMIN_PHONE } from '@/lib/otp';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ thông tin!' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanAdminPhone = ADMIN_PHONE.trim().replace(/[^0-9]/g, '');

    if (cleanPhone !== cleanAdminPhone) {
      return NextResponse.json(
        { success: false, message: 'Từ chối truy cập! Số điện thoại không thuộc danh sách Quản Trị Viên.' },
        { status: 403 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: { phone: cleanPhone, role: 'ADMIN' },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản Quản Trị Viên chưa được khởi tạo. Vui lòng kích hoạt tài khoản Admin trước!' },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu quản trị không chính xác!' },
        { status: 401 }
      );
    }

    // Tạo cookie session riêng biệt cho Admin: admin_token
    const token = await createSessionToken({
      id: admin.id,
      role: 'ADMIN',
      phone: admin.phone,
    });

    cookies().set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập Quản Trị Viên thành công!',
      admin: {
        id: admin.id,
        phone: admin.phone,
        fullname: admin.fullname,
        role: 'ADMIN',
      },
    });
  } catch (error: any) {
    console.error('Lỗi đăng nhập Admin:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
