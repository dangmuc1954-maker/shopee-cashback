const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Khởi tạo cài đặt hệ thống mặc định
  await prisma.systemSetting.upsert({
    where: { id: 'DEFAULT' },
    update: {},
    create: {
      id: 'DEFAULT',
      shopeeAffId: '17300000000', // Shopee Affiliate ID mặc định của Admin
      commissionUserPercent: 60.0, // 60% tiền hoa hồng hoàn cho khách
      commissionAdminPercent: 40.0, // 40% lợi nhuận Admin giữ lại
      minWithdrawAmount: 50000.0, // Ngưỡng rút tiền tối thiểu 50k
      announcement: '🔥 Siêu Hoàn Tiền Shopee 60% Hoa Hồng - Mua sắm thông minh, tích lũy rút tiền mặt không giới hạn!',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
