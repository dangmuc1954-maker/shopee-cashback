import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Từ chối truy cập!' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn file Excel báo cáo đơn hàng Shopee!' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { success: false, message: 'File Excel không có dữ liệu hoặc định dạng rỗng!' },
        { status: 400 }
      );
    }

    // Lấy tỷ lệ hoa hồng từ cấu hình
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'DEFAULT' },
    });
    const userPercent = (settings?.commissionUserPercent || 60) / 100;
    const adminPercent = (settings?.commissionAdminPercent || 40) / 100;

    let processedCount = 0;
    let newOrdersCount = 0;
    let totalShopeeCommission = 0;
    let totalCashbackCredited = 0;
    let matchedUserCount = 0;

    for (const row of rawData) {
      // Nhận diện cột linh hoạt (hỗ trợ cả tiếng Việt và tiếng Anh)
      const orderSn =
        row['Mã đơn hàng'] ||
        row['Order SN'] ||
        row['Order ID'] ||
        row['Mã Đơn'] ||
        row['order_sn'] ||
        row['Mã đơn'];

      const subIdRaw =
        row['Mã phụ'] ||
        row['Sub ID'] ||
        row['Sub_id'] ||
        row['Sub ID 1'] ||
        row['sub_id'] ||
        row['Custom ID'] ||
        '';

      const itemName =
        row['Tên sản phẩm'] ||
        row['Product Name'] ||
        row['Item Name'] ||
        row['Tên mặt hàng'] ||
        'Sản phẩm Shopee';

      const totalAmountRaw =
        row['Tổng giá trị'] ||
        row['Giá trị đơn hàng'] ||
        row['Order Amount'] ||
        row['GMV'] ||
        row['Tổng tiền'] ||
        0;

      const commissionRaw =
        row['Hoa hồng thực nhận'] ||
        row['Hoa hồng'] ||
        row['Commission'] ||
        row['Total Commission'] ||
        row['Tiền hoa hồng'] ||
        row['Tổng hoa hồng'] ||
        0;

      const statusRaw =
        row['Trạng thái'] ||
        row['Status'] ||
        row['Trạng thái đơn'] ||
        'APPROVED';

      if (!orderSn) continue;

      const cleanOrderSn = String(orderSn).trim();
      const subId = String(subIdRaw).trim();
      const totalAmount = parseFloat(String(totalAmountRaw).replace(/[^0-9.-]+/g, '')) || 0;
      const shopeeCommission = parseFloat(String(commissionRaw).replace(/[^0-9.-]+/g, '')) || 0;

      const userCashback = Math.round(shopeeCommission * userPercent);
      const adminProfit = Math.round(shopeeCommission * adminPercent);

      // Chuẩn hóa trạng thái
      let normalizedStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'APPROVED';
      const statusText = String(statusRaw).toLowerCase();
      if (statusText.includes('hủy') || statusText.includes('cancel') || statusText.includes('reject')) {
        normalizedStatus = 'REJECTED';
      } else if (statusText.includes('chờ') || statusText.includes('pending') || statusText.includes('unpaid')) {
        normalizedStatus = 'PENDING';
      }

      // Tìm User sở hữu link theo subId
      let matchedUserId: string | null = null;
      if (subId) {
        const linkRecord = await prisma.convertedLink.findFirst({
          where: { subId: subId },
        });
        if (linkRecord?.userId) {
          matchedUserId = linkRecord.userId;
        } else {
          // Thử tìm user có ID nằm trong prefix subId
          const potentialUserId = subId.split('_')[0];
          const userRecord = await prisma.user.findFirst({
            where: { id: { startsWith: potentialUserId } },
          });
          if (userRecord) {
            matchedUserId = userRecord.id;
          }
        }
      }

      // Kiểm tra đơn hàng đã tồn tại chưa
      const existingOrder = await prisma.cashbackOrder.findUnique({
        where: { orderSn: cleanOrderSn },
      });

      if (!existingOrder) {
        // Tạo đơn hàng mới
        await prisma.cashbackOrder.create({
          data: {
            orderSn: cleanOrderSn,
            subId: subId || 'NO_SUB_ID',
            itemName: String(itemName).substring(0, 250),
            totalAmount,
            shopeeCommission,
            userCashback,
            adminProfit,
            status: normalizedStatus,
            userId: matchedUserId,
          },
        });

        // Nếu đơn thành công và tìm thấy user -> Cộng trực tiếp 60% vào ví user
        if (normalizedStatus === 'APPROVED' && matchedUserId && userCashback > 0) {
          await prisma.user.update({
            where: { id: matchedUserId },
            data: {
              balance: { increment: userCashback },
            },
          });
          totalCashbackCredited += userCashback;
          matchedUserCount++;
        }

        newOrdersCount++;
      } else {
        // Nếu đơn đã tồn tại nhưng trước đó là PENDING nay chuyển sang APPROVED
        if (existingOrder.status === 'PENDING' && normalizedStatus === 'APPROVED' && existingOrder.userId) {
          await prisma.user.update({
            where: { id: existingOrder.userId },
            data: {
              balance: { increment: existingOrder.userCashback },
              pendingBalance: { decrement: existingOrder.userCashback },
            },
          });
          totalCashbackCredited += existingOrder.userCashback;
        }

        await prisma.cashbackOrder.update({
          where: { orderSn: cleanOrderSn },
          data: {
            status: normalizedStatus,
            shopeeCommission,
            userCashback,
            adminProfit,
            userId: matchedUserId || existingOrder.userId,
          },
        });
      }

      totalShopeeCommission += shopeeCommission;
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Đối soát thành công! Đã xử lý ${processedCount} đơn hàng (${newOrdersCount} đơn mới).`,
      data: {
        processedCount,
        newOrdersCount,
        totalShopeeCommission,
        totalCashbackCredited,
        matchedUserCount,
      },
    });
  } catch (error: any) {
    console.error('Lỗi import báo cáo:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xử lý file Excel' },
      { status: 500 }
    );
  }
}
