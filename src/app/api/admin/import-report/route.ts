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

    const contentType = req.headers.get('content-type') || '';

    // =========================================================================
    // CASE 1: ADMIN XÁC NHẬN GIẢI NGÂN (ACTION === 'CONFIRM')
    // =========================================================================
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { action, items } = body;

      if (action !== 'confirm' || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Dữ liệu xác nhận giải ngân không hợp lệ!' },
          { status: 400 }
        );
      }

      let totalCredited = 0;
      let usersCreditedCount = 0;
      let ordersProcessed = 0;

      // Thực thi giải ngân trong một Database Transaction duy nhất
      await prisma.$transaction(async (tx) => {
        // Nhóm tiền theo từng user để cập nhật ví
        const userCashbackMap = new Map<string, number>();

        for (const item of items) {
          const { orderSn, subId, itemName, totalAmount, shopeeCommission, userCashback, adminProfit, status, userId } = item;

          if (!orderSn) continue;

          // 1. Tìm đơn hàng xem đã tồn tại chưa (theo mã đơn hoặc Sub_ID)
          let existing = await tx.cashbackOrder.findUnique({
            where: { orderSn },
          });

          if (!existing && subId) {
            existing = await tx.cashbackOrder.findFirst({
              where: {
                subId: subId,
                status: 'PENDING',
              },
            });
          }

          const finalUserId = userId || existing?.userId;

          if (!existing) {
            await tx.cashbackOrder.create({
              data: {
                orderSn,
                subId: subId || 'NO_SUB_ID',
                itemName: String(itemName || 'Sản phẩm Shopee').substring(0, 250),
                totalAmount: Number(totalAmount) || 0,
                shopeeCommission: Number(shopeeCommission) || 0,
                userCashback: Number(userCashback) || 0,
                adminProfit: Number(adminProfit) || 0,
                status: status || 'APPROVED',
                userId: finalUserId || null,
              },
            });
          } else {
            await tx.cashbackOrder.update({
              where: { id: existing.id },
              data: {
                orderSn,
                status: status || 'APPROVED',
                totalAmount: Number(totalAmount) || existing.totalAmount,
                shopeeCommission: Number(shopeeCommission) || existing.shopeeCommission,
                userCashback: Number(userCashback) || existing.userCashback,
                adminProfit: Number(adminProfit) || existing.adminProfit,
                userId: finalUserId || existing.userId,
              },
            });
          }

          // 2. Nếu đơn thành công (APPROVED) và có người nhận hợp lệ
          if (status === 'APPROVED' && finalUserId && Number(userCashback) > 0) {
            const current = userCashbackMap.get(finalUserId) || 0;
            userCashbackMap.set(finalUserId, current + Number(userCashback));
            totalCredited += Number(userCashback);
          }

          ordersProcessed++;
        }

        // 3. Thực hiện cộng tiền vào ví của từng khách hàng
        for (const [uid, amount] of userCashbackMap.entries()) {
          if (amount > 0) {
            await tx.user.update({
              where: { id: uid },
              data: {
                balance: { increment: amount },
              },
            });
            usersCreditedCount++;
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Phê duyệt & Giải ngân thành công! Đã cộng tổng cộng ${totalCredited.toLocaleString('vi-VN')} đ vào ví cho ${usersCreditedCount} khách hàng (${ordersProcessed} đơn hàng).`,
        data: {
          totalCredited,
          usersCreditedCount,
          ordersProcessed,
        },
      });
    }

    // =========================================================================
    // CASE 2: ĐỌC FILE EXCEL & TÍNH TOÁN BẢNG XEM TRƯỚC (PREVIEW MODE)
    // =========================================================================
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

    // Lấy tỷ lệ hoa hồng từ cấu hình (Chuẩn 60% cho khách, 40% cho Admin)
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'DEFAULT' },
    });
    const userPercent = (settings?.commissionUserPercent || 60) / 100;
    const adminPercent = 1 - userPercent;

    // Tải trước danh sách Users và Links để đối soát nhanh trong bộ nhớ
    const [allUsers, allLinks, pendingOrders] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, fullname: true, phone: true },
      }),
      prisma.convertedLink.findMany({
        select: { subId: true, userId: true },
      }),
      prisma.cashbackOrder.findMany({
        where: { status: 'PENDING' },
        select: { id: true, subId: true, orderSn: true, userId: true },
      }),
    ]);

    const usersMap = new Map(allUsers.map((u) => [u.id, u]));
    const linksMap = new Map(allLinks.map((l) => [l.subId.toLowerCase(), l.userId]));
    const pendingSubIdMap = new Map(pendingOrders.map((o) => [o.subId.toLowerCase(), o]));
    const pendingOrderSnMap = new Map(pendingOrders.map((o) => [o.orderSn.toLowerCase(), o]));

    const validItems: any[] = [];
    const userGroupsMap = new Map<string, {
      userId: string;
      fullname: string;
      phone: string;
      orderCount: number;
      totalShopeeCommission: number;
      totalCashback: number;
      orders: any[];
    }>();

    const unmatchedOrders: any[] = [];
    let totalShopeeCommission = 0;
    let totalUserCashback = 0;
    let totalAdminProfit = 0;

    for (const row of rawData) {
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

      let normalizedStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'APPROVED';
      const statusText = String(statusRaw).toLowerCase();
      if (statusText.includes('hủy') || statusText.includes('cancel') || statusText.includes('reject')) {
        normalizedStatus = 'REJECTED';
      } else if (statusText.includes('chờ') || statusText.includes('pending') || statusText.includes('unpaid')) {
        normalizedStatus = 'PENDING';
      }

      // THUẬT TOÁN ĐỐI SOÁT 2 LỚP
      let matchedUserId: string | null = null;

      // 1. Thử khớp theo mã Sub_ID trong ConvertedLink
      if (subId && linksMap.has(subId.toLowerCase())) {
        matchedUserId = linksMap.get(subId.toLowerCase()) || null;
      }

      // 2. Thử khớp theo đơn khách đã bấm tick báo mua trước đó
      if (!matchedUserId && subId && pendingSubIdMap.has(subId.toLowerCase())) {
        matchedUserId = pendingSubIdMap.get(subId.toLowerCase())?.userId || null;
      }

      if (!matchedUserId && cleanOrderSn && pendingOrderSnMap.has(cleanOrderSn.toLowerCase())) {
        matchedUserId = pendingOrderSnMap.get(cleanOrderSn.toLowerCase())?.userId || null;
      }

      // 3. Khớp theo prefix user ID trong subId (u_cm4a1b2c_...)
      if (!matchedUserId && subId) {
        const cleanSub = subId.replace(/^(u_|u|user_)/i, '');
        const potentialPrefix = cleanSub.split('_')[0].toLowerCase();
        if (potentialPrefix && potentialPrefix.length >= 3 && potentialPrefix !== 'guest') {
          const found = allUsers.find((u) => u.id.toLowerCase().startsWith(potentialPrefix));
          if (found) {
            matchedUserId = found.id;
          }
        }
      }

      const orderItem = {
        orderSn: cleanOrderSn,
        subId: subId || 'NO_SUB_ID',
        itemName: String(itemName).substring(0, 250),
        totalAmount,
        shopeeCommission,
        userCashback,
        adminProfit,
        status: normalizedStatus,
        userId: matchedUserId,
      };

      validItems.push(orderItem);

      totalShopeeCommission += shopeeCommission;
      if (normalizedStatus === 'APPROVED') {
        totalUserCashback += userCashback;
        totalAdminProfit += adminProfit;
      }

      // Gom nhóm theo khách hàng
      if (matchedUserId && usersMap.has(matchedUserId)) {
        const u = usersMap.get(matchedUserId)!;
        const existingGroup = userGroupsMap.get(matchedUserId);
        if (existingGroup) {
          existingGroup.orderCount += 1;
          existingGroup.totalShopeeCommission += shopeeCommission;
          if (normalizedStatus === 'APPROVED') {
            existingGroup.totalCashback += userCashback;
          }
          existingGroup.orders.push(orderItem);
        } else {
          userGroupsMap.set(matchedUserId, {
            userId: matchedUserId,
            fullname: u.fullname || 'Chưa đặt tên',
            phone: u.phone,
            orderCount: 1,
            totalShopeeCommission: shopeeCommission,
            totalCashback: normalizedStatus === 'APPROVED' ? userCashback : 0,
            orders: [orderItem],
          });
        }
      } else {
        unmatchedOrders.push(orderItem);
      }
    }

    const userGroups = Array.from(userGroupsMap.values());

    return NextResponse.json({
      success: true,
      preview: true,
      summary: {
        totalRows: rawData.length,
        validOrders: validItems.length,
        matchedOrders: validItems.length - unmatchedOrders.length,
        unmatchedOrders: unmatchedOrders.length,
        totalShopeeCommission,
        totalUserCashback,
        totalAdminProfit,
        userPercent: userPercent * 100,
        adminPercent: adminPercent * 100,
        matchedUserCount: userGroups.length,
      },
      userGroups,
      unmatchedOrders,
      rawItems: validItems,
    });
  } catch (error: any) {
    console.error('Lỗi import báo cáo:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi xử lý file Excel' },
      { status: 500 }
    );
  }
}
