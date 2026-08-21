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
        { subId: { contains: search } },
        { originalUrl: { contains: search } },
        { user: { phone: { contains: search } } },
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
      take: 200,
    });

    return NextResponse.json({
      success: true,
      links,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi lấy danh sách links' },
      { status: 500 }
    );
  }
}
