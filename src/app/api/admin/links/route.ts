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
    const type = searchParams.get('type'); // 'ALL' | 'USER' | 'GUEST'

    const whereClause: any = {};
    if (type === 'USER') {
      whereClause.userId = { not: null };
    } else if (type === 'GUEST') {
      whereClause.userId = null;
    }

    if (search) {
      whereClause.OR = [
        { subId: { contains: search } },
        { originalUrl: { contains: search } },
        { affiliateUrl: { contains: search } },
      ];
    }

    const links = await prisma.convertedLink.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return NextResponse.json({
      success: true,
      links,
    });
  } catch (error: any) {
    console.error('Lỗi API admin/links:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi lấy danh sách links' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu link ID!' }, { status: 400 });
    }

    await prisma.convertedLink.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa link khỏi hệ thống!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xóa link' },
      { status: 500 }
    );
  }
}
