const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== USERS ===');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      fullname: true,
      balance: true,
      pendingBalance: true,
      totalWithdrawn: true,
      bankName: true,
      bankAccountNo: true,
      bankAccountName: true,
      createdAt: true
    }
  });
  console.log(JSON.stringify(users, null, 2));

  console.log('=== ORDERS ===');
  const orders = await prisma.cashbackOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  console.log(JSON.stringify(orders, null, 2));

  console.log('=== WITHDRAWALS ===');
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(withdrawals, null, 2));

  console.log('=== CONVERTED LINKS ===');
  const links = await prisma.convertedLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(links, null, 2));

  const dbList = await prisma.$queryRawUnsafe('PRAGMA database_list');
  console.log('=== PRAGMA DATABASE_LIST ===', dbList);
}

main().catch(console.error).finally(() => prisma.$disconnect());
