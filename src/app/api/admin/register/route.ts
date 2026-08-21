import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { verifyAdminOtp, ADMIN_PHONE } from '@/lib/otp';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { phone, password, otp, fullname } = await req.json();

    if (!phone || !password || !otp) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ Số điện thoại, Mật khẩu và Mã duyệt OTP!' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanAdminPhone = ADMIN_PHONE.trim().replace(/[^0-9]/g, '');

    // Kiểm tra bảo mật số điện thoại
    if (cleanPhone !== cleanAdminPhone) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại này không có quyền tạo tài khoản Quản trị viên!' },
        { status: 403 }
      );
    }

    // Xác thực mã OTP
    const isOtpValid = await verifyAdminOtp(cleanPhone, otp);
    if (!isOtpValid) {
      return NextResponse.json(
        { success: false, message: 'Mã xác thực OTP không chính xác hoặc đã hết hạn!' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Tạo mới hoặc nâng cấp tài khoản thành ADMIN
    const user = await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: {
        password: hashedPassword,
        fullname: fullname?.trim() || 'Super Admin',
        role: 'ADMIN',
      },
      create: {
        phone: cleanPhone,
        password: hashedPassword,
        fullname: fullname?.trim() || 'Super Admin',
        role: 'ADMIN',
        balance: 0,
        pendingBalance: 0,
      },
    });

    // Tạo cookie session đăng nhập
    const token = await createSessionToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
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
      message: 'Tài khoản Quản Trị Viên (Admin) đã được tạo và kích hoạt thành công!',
      user: {
        id: user.id,
        phone: user.phone,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Lỗi tạo Admin:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
