import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { subId } = await req.json();

    if (!subId) {
      return NextResponse.json({ success: false, message: 'Thiếu subId' }, { status: 400 });
    }

    const updated = await prisma.convertedLink.updateMany({
      where: { subId },
      data: {
        clicks: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
