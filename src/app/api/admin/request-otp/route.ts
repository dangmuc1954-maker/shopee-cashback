import { NextResponse } from 'next/server';
import { createAdminOtp, ADMIN_PHONE } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp số điện thoại quản trị!' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanAdminPhone = ADMIN_PHONE.trim().replace(/[^0-9]/g, '');

    if (cleanPhone !== cleanAdminPhone) {
      return NextResponse.json(
        {
          success: false,
          message: `Từ chối truy cập! Chỉ duy nhất số điện thoại chủ hệ thống (${ADMIN_PHONE}) mới có quyền tạo tài khoản Quản Trị Viên!`,
        },
        { status: 403 }
      );
    }

    const result = await createAdminOtp(cleanPhone);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Mã duyệt kích hoạt đã được gửi tới số điện thoại ${ADMIN_PHONE}! (Mã xác thực: ${result.code})`,
      code: result.code, // Trả về để tiện test hoặc hiển thị cho Tris
    });
  } catch (error: any) {
    console.error('Lỗi yêu cầu OTP Admin:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
