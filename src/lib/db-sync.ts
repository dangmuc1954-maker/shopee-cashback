import fs from 'fs';
import path from 'path';
import { prisma } from './db';

const SNAPSHOT_PATH = path.join(process.cwd(), 'prisma', 'data_snapshot.json');

/**
 * Tự động lưu bản chụp Snapshot toàn bộ CSDL ra JSON để bảo toàn vĩnh viễn
 */
export async function saveDbSnapshot() {
  try {
    const [users, links, orders, withdrawals, settings] = await Promise.all([
      prisma.user.findMany(),
      prisma.convertedLink.findMany(),
      prisma.cashbackOrder.findMany(),
      prisma.withdrawal.findMany(),
      prisma.systemSetting.findUnique({ where: { id: 'DEFAULT' } }),
    ]);

    const snapshot = {
      savedAt: new Date().toISOString(),
      users,
      links,
      orders,
      withdrawals,
      settings,
    };

    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Không thể ghi file snapshot:', err);
  }
}

/**
 * Khôi phục dữ liệu từ Snapshot nếu phát hiện CSDL trống (do Vercel cold-start hoặc serverless reset)
 */
export async function autoRestoreSnapshotIfNeeded() {
  try {
    if (!fs.existsSync(SNAPSHOT_PATH)) return;

    const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
    if (!raw) return;

    const snapshot = JSON.parse(raw);
    const { users, orders, settings } = snapshot;

    // Kiểm tra xem database hiện tại đã có user nào chưa
    const userCount = await prisma.user.count();
    const orderCount = await prisma.cashbackOrder.count();

    if (userCount === 0 || orderCount === 0) {
      console.log('🔄 Đang tự động khôi phục dữ liệu từ snapshot cho Serverless...');

      // Khôi phục Users
      if (Array.isArray(users)) {
        for (const u of users) {
          await prisma.user.upsert({
            where: { phone: u.phone },
            update: {
              balance: u.balance,
              pendingBalance: u.pendingBalance,
              totalWithdrawn: u.totalWithdrawn,
              fullname: u.fullname,
            },
            create: {
              id: u.id,
              phone: u.phone,
              email: u.email,
              password: u.password,
              fullname: u.fullname,
              role: u.role,
              balance: u.balance,
              pendingBalance: u.pendingBalance,
              totalWithdrawn: u.totalWithdrawn,
              bankName: u.bankName,
              bankAccountNo: u.bankAccountNo,
              bankAccountName: u.bankAccountName,
            },
          });
        }
      }

      // Khôi phục Orders
      if (Array.isArray(orders)) {
        for (const o of orders) {
          await prisma.cashbackOrder.upsert({
            where: { orderSn: o.orderSn },
            update: {
              status: o.status,
              userCashback: o.userCashback,
              completedAt: o.completedAt ? new Date(o.completedAt) : null,
            },
            create: {
              id: o.id,
              userId: o.userId,
              orderSn: o.orderSn,
              subId: o.subId,
              itemName: o.itemName,
              totalAmount: o.totalAmount,
              shopeeCommission: o.shopeeCommission,
              userCashback: o.userCashback,
              adminProfit: o.adminProfit,
              status: o.status,
              completedAt: o.completedAt ? new Date(o.completedAt) : null,
            },
          });
        }
      }

      console.log('✅ Đã tự động đồng bộ và bảo toàn số dư ví khách hàng!');
    }
  } catch (err) {
    console.warn('Lỗi khi autoRestoreSnapshot:', err);
  }
}
