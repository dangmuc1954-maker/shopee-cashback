import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'DEFAULT' },
    });

    return NextResponse.json({
      success: true,
      settings: settings || {
        shopeeAffId: '17352020564',
        commissionUserPercent: 40,
        commissionAdminPercent: 60,
        minWithdrawAmount: 50000,
        announcement: '',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi lấy cài đặt' },
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

    const {
      shopeeAffId,
      shopeeAppId,
      shopeeAppSecret,
      commissionUserPercent,
      commissionAdminPercent,
      minWithdrawAmount,
      announcement,
    } = await req.json();

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'DEFAULT' },
      update: {
        ...(shopeeAffId ? { shopeeAffId: String(shopeeAffId).trim() } : {}),
        ...(shopeeAppId !== undefined ? { shopeeAppId: shopeeAppId ? String(shopeeAppId).trim() : null } : {}),
        ...(shopeeAppSecret !== undefined ? { shopeeAppSecret: shopeeAppSecret ? String(shopeeAppSecret).trim() : null } : {}),
        ...(commissionUserPercent !== undefined ? { commissionUserPercent: Number(commissionUserPercent) } : {}),
        ...(commissionAdminPercent !== undefined ? { commissionAdminPercent: Number(commissionAdminPercent) } : {}),
        ...(minWithdrawAmount !== undefined ? { minWithdrawAmount: Number(minWithdrawAmount) } : {}),
        ...(announcement !== undefined ? { announcement: String(announcement).trim() } : {}),
      },
      create: {
        id: 'DEFAULT',
        shopeeAffId: String(shopeeAffId || '17352020564').trim(),
        shopeeAppId: shopeeAppId ? String(shopeeAppId).trim() : null,
        shopeeAppSecret: shopeeAppSecret ? String(shopeeAppSecret).trim() : null,
        commissionUserPercent: Number(commissionUserPercent || 40),
        commissionAdminPercent: Number(commissionAdminPercent || 60),
        minWithdrawAmount: Number(minWithdrawAmount || 50000),
        announcement: String(announcement || ''),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cài đặt hệ thống thành công!',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi lưu cài đặt' },
      { status: 500 }
    );
  }
}
