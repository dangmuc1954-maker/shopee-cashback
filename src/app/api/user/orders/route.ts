import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập!' }, { status: 401 });
    }

    const orders = await prisma.cashbackOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi lấy danh sách đơn hàng' },
      { status: 500 }
    );
  }
}

// Khách hàng xác nhận đã mua hàng thành công
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập để gửi thông tin đơn hàng!' },
        { status: 401 }
      );
    }

    const { subId, orderSn, itemName, imageUrl, productUrl, customerNote } = await req.json();

    if (!subId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã Sub_ID của link mua sắm!' },
        { status: 400 }
      );
    }

    // Nếu khách không điền mã đơn Shopee, tự sinh mã định danh theo SubID
    const cleanSubId = String(subId).trim();
    const cleanOrderSn = orderSn && String(orderSn).trim()
      ? String(orderSn).trim()
      : `DH_${cleanSubId}_${Date.now().toString().slice(-4)}`;

    // Kiểm tra xem đơn hàng với mã này đã tồn tại chưa
    const existingOrder = await prisma.cashbackOrder.findFirst({
      where: {
        OR: [
          { orderSn: cleanOrderSn },
          { subId: cleanSubId, userId: user.id },
        ],
      },
    });

    if (existingOrder) {
      // Cập nhật lại thông tin mới nhất nếu có
      const updated = await prisma.cashbackOrder.update({
        where: { id: existingOrder.id },
        data: {
          orderSn: cleanOrderSn,
          itemName: itemName || existingOrder.itemName,
          imageUrl: imageUrl || existingOrder.imageUrl,
          productUrl: productUrl || existingOrder.productUrl,
          customerNote: customerNote || existingOrder.customerNote,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đơn hàng của bạn đã được cập nhật và đang trong hàng đợi đối soát!',
        order: updated,
      });
    }

    // Tạo đơn hàng mới với trạng thái PENDING
    const newOrder = await prisma.cashbackOrder.create({
      data: {
        userId: user.id,
        orderSn: cleanOrderSn,
        subId: cleanSubId,
        itemName: itemName || 'Sản phẩm Shopee',
        imageUrl: imageUrl || null,
        productUrl: productUrl || null,
        customerNote: customerNote || null,
        totalAmount: 0,
        shopeeCommission: 0,
        userCashback: 0,
        adminProfit: 0,
        status: 'PENDING',
        orderTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ghi nhận đơn hàng thành công! Admin sẽ đối soát và hoàn tiền vào ví sau khi Shopee hoàn tất.',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Lỗi lưu đơn khách báo:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi gửi thông tin đơn hàng' },
      { status: 500 }
    );
  }
}
