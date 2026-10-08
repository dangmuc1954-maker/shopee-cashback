const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang cập nhật số dư và đơn hàng cho Tuyết Nga và Hà ---');

  // 1. Tìm User Tuyết Nga
  const tuyetNga = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: '0386213036' },
        { fullname: { contains: 'Tuyết Nga' } }
      ]
    }
  });

  if (tuyetNga) {
    await prisma.user.update({
      where: { id: tuyetNga.id },
      data: {
        balance: 18000,
        pendingBalance: 0
      }
    });

    // Tạo đơn hàng hoàn tiền 18k cho Tuyết Nga nếu chưa có
    const existingOrderTN = await prisma.cashbackOrder.findFirst({
      where: { userId: tuyetNga.id, orderSn: 'SP_TEST_TUYETNGA_18K' }
    });

    if (!existingOrderTN) {
      await prisma.cashbackOrder.create({
        data: {
          userId: tuyetNga.id,
          orderSn: 'SP_TEST_TUYETNGA_18K',
          subId: 'cmt2fuagjzx9',
          itemName: 'Đơn hàng hoàn tiền Shopee (Tuyết Nga)',
          totalAmount: 150000,
          shopeeCommission: 30000,
          userCashback: 18000,
          adminProfit: 12000,
          status: 'APPROVED',
          completedAt: new Date()
        }
      });
    }

    console.log(`✅ Đã cập nhật Tuyết Nga (SĐT: ${tuyetNga.phone}): Số dư 18.000 VNĐ`);
  } else {
    console.warn('⚠️ Không tìm thấy user Tuyết Nga!');
  }

  // 2. Tìm User Hà
  const ha = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: '0395957039' },
        { fullname: { contains: 'Hà' } }
      ]
    }
  });

  if (ha) {
    await prisma.user.update({
      where: { id: ha.id },
      data: {
        balance: 10000,
        pendingBalance: 0
      }
    });

    // Tạo đơn hàng hoàn tiền 10k cho Hà nếu chưa có
    const existingOrderHa = await prisma.cashbackOrder.findFirst({
      where: { userId: ha.id, orderSn: 'SP_TEST_HA_10K' }
    });

    if (!existingOrderHa) {
      await prisma.cashbackOrder.create({
        data: {
          userId: ha.id,
          orderSn: 'SP_TEST_HA_10K',
          subId: 'cmt2d6hv10k',
          itemName: 'Đơn hàng hoàn tiền Shopee (Hà)',
          totalAmount: 85000,
          shopeeCommission: 16667,
          userCashback: 10000,
          adminProfit: 6667,
          status: 'APPROVED',
          completedAt: new Date()
        }
      });
    }

    console.log(`✅ Đã cập nhật Hà (SĐT: ${ha.phone}): Số dư 10.000 VNĐ`);
  } else {
    console.warn('⚠️ Không tìm thấy user Hà!');
  }

  const fs = require('fs');
  const path = require('path');
  const [allU, allL, allO, allW, allS] = await Promise.all([
    prisma.user.findMany(),
    prisma.convertedLink.findMany(),
    prisma.cashbackOrder.findMany(),
    prisma.withdrawal.findMany(),
    prisma.systemSetting.findUnique({ where: { id: 'DEFAULT' } }),
  ]);
  const snapshot = { savedAt: new Date().toISOString(), users: allU, links: allL, orders: allO, withdrawals: allW, settings: allS };
  fs.writeFileSync(path.join(process.cwd(), 'prisma', 'data_snapshot.json'), JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log('✅ SNAPSHOT SAVED SUCCESSFULLY with', allU.length, 'users,', allO.length, 'orders');
}

main().catch(console.error).finally(() => prisma.$disconnect());
