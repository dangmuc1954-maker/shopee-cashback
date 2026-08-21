const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.systemSetting.upsert({
    where: { id: 'DEFAULT' },
    update: { shopeeAffId: '17352020564' },
    create: {
      id: 'DEFAULT',
      shopeeAffId: '17352020564',
      commissionUserPercent: 60,
      commissionAdminPercent: 40,
      minWithdrawAmount: 50000,
      announcement: 'Siêu Hoàn Tiền Shopee 60% Hoa Hồng - Mua sắm thông minh, tích lũy rút tiền mặt không giới hạn!',
    },
  });
  console.log('SUCCESSFULLY UPDATED SYSTEM SETTING TO 17352020564:', JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
