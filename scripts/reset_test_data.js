const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetTestData() {
  console.log('🧹 Đang làm sạch dữ liệu kiểm thử...');
  
  await prisma.withdrawal.deleteMany({});
  await prisma.cashbackOrder.deleteMany({});
  await prisma.convertedLink.deleteMany({});
  await prisma.user.deleteMany({
    where: { role: 'USER' },
  });

  console.log('✅ ĐÃ DỌN SẠCH TOÀN BỘ DỮ LIỆU TEST! (Chỉ giữ lại tài khoản Admin và Cài Đặt Hệ Thống)');
}

resetTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
