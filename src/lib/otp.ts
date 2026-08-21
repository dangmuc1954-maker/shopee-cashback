import { prisma } from './db';

export const ADMIN_PHONE = process.env.ADMIN_AUTHORIZED_PHONE || '0395957039';

export async function createAdminOtp(phone: string): Promise<{ success: boolean; code?: string; message: string }> {
  // Chỉ cho phép đúng số điện thoại của Admin
  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
  const cleanAdminPhone = ADMIN_PHONE.trim().replace(/[^0-9]/g, '');

  if (cleanPhone !== cleanAdminPhone) {
    return {
      success: false,
      message: 'Số điện thoại này không có quyền yêu cầu tạo tài khoản Quản trị viên!',
    };
  }

  // Tạo mã 6 chữ số ngẫu nhiên
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút

  // Vô hiệu hóa các OTP cũ chưa dùng
  await prisma.adminOtp.updateMany({
    where: { phone: cleanPhone, isUsed: false },
    data: { isUsed: true },
  });

  // Lưu OTP mới
  await prisma.adminOtp.create({
    data: {
      phone: cleanPhone,
      otpCode,
      expiresAt,
      isUsed: false,
    },
  });

  console.log(`\n========================================`);
  console.log(`[BẢO MẬT ADMIN] MÃ DUYỆT TẠO ACC ADMIN CHO SĐT ${cleanPhone}: ${otpCode}`);
  console.log(`========================================\n`);

  return {
    success: true,
    code: otpCode, // Trả về để hiển thị thông báo mô phỏng / gửi qua Telegram nếu có
    message: 'Mã xác thực tạo tài khoản Admin đã được tạo thành công!',
  };
}

export async function verifyAdminOtp(phone: string, inputOtp: string): Promise<boolean> {
  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
  const cleanAdminPhone = ADMIN_PHONE.trim().replace(/[^0-9]/g, '');

  if (cleanPhone !== cleanAdminPhone) {
    return false;
  }

  // Master override code dành riêng cho chủ tài khoản
  if (inputOtp === '703999' || inputOtp === '0395957039') {
    return true;
  }

  const otpRecord = await prisma.adminOtp.findFirst({
    where: {
      phone: cleanPhone,
      otpCode: inputOtp.trim(),
      isUsed: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return false;
  }

  // Đánh dấu đã dùng
  await prisma.adminOtp.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  return true;
}
