import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { UserSession } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-jwt-key-shopee-affiliate-cashback-2026-tris-eni'
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: {
  id: string;
  role: string;
  phone: string;
  fullname?: string | null;
  balance?: number;
  pendingBalance?: number;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<{
  id: string;
  role: string;
  phone: string;
  fullname?: string | null;
  balance?: number;
  pendingBalance?: number;
} | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as any;
  } catch (err) {
    return null;
  }
}

// Lấy thông tin khách hàng thông thường (Web Chính) qua cookie auth_token
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.id || !payload?.phone) return null;

    let user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        phone: true,
        email: true,
        fullname: true,
        role: true,
        balance: true,
        pendingBalance: true,
        totalWithdrawn: true,
      },
    });

    // CƠ CHẾ TỰ ĐỘNG PHỤC HỒI PHIÊN (Self-Healing Session cho Serverless):
    // Nếu container này vừa khởi động lại và chưa có user trong SQLite cục bộ,
    // tự động phục hồi user từ Token đã ký mã hóa của máy chủ, không bao giờ để khách bị rớt phiên!
    if (!user && payload.phone) {
      try {
        const restored = await prisma.user.upsert({
          where: { phone: payload.phone },
          update: {
            fullname: payload.fullname || undefined,
          },
          create: {
            id: payload.id,
            phone: payload.phone,
            fullname: payload.fullname || null,
            role: payload.role || 'USER',
            password: '', // Xác thực qua chữ ký mật máy chủ JWT
            balance: payload.balance || 0,
            pendingBalance: payload.pendingBalance || 0,
            totalWithdrawn: 0,
          },
        });
        user = {
          id: restored.id,
          phone: restored.phone,
          email: restored.email,
          fullname: restored.fullname,
          role: restored.role,
          balance: restored.balance,
          pendingBalance: restored.pendingBalance,
          totalWithdrawn: restored.totalWithdrawn,
        };
      } catch (err) {
        console.warn('Lỗi tự phục hồi user trong container:', err);
      }
    }

    if (!user) {
      // Trường hợp khẩn cấp SQLite đang bị khóa tạm thời: vẫn trả về phiên đăng nhập hợp lệ
      return {
        id: payload.id,
        phone: payload.phone,
        email: null,
        fullname: payload.fullname || null,
        role: (payload.role as 'USER' | 'ADMIN') || 'USER',
        balance: payload.balance || 0,
        pendingBalance: payload.pendingBalance || 0,
        totalWithdrawn: 0,
      };
    }

    return {
      ...user,
      role: user.role as 'USER' | 'ADMIN',
    };
  } catch (error) {
    return null;
  }
}

// Lấy thông tin Quản Trị Viên (Web Quản Lý) qua cookie riêng biệt admin_token
export async function getCurrentAdmin(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get('admin_token')?.value;
    if (!token) {
      token = cookieStore.get('auth_token')?.value;
    }
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.id || payload.role !== 'ADMIN') return null;

    let admin = await prisma.user.findUnique({
      where: { id: payload.id, role: 'ADMIN' },
      select: {
        id: true,
        phone: true,
        email: true,
        fullname: true,
        role: true,
        balance: true,
        pendingBalance: true,
        totalWithdrawn: true,
      },
    });

    if (!admin && payload.phone) {
      try {
        const restored = await prisma.user.upsert({
          where: { phone: payload.phone },
          update: { role: 'ADMIN' },
          create: {
            id: payload.id,
            phone: payload.phone,
            fullname: payload.fullname || 'Admin',
            role: 'ADMIN',
            password: '',
            balance: payload.balance || 0,
            pendingBalance: payload.pendingBalance || 0,
            totalWithdrawn: 0,
          },
        });
        admin = {
          id: restored.id,
          phone: restored.phone,
          email: restored.email,
          fullname: restored.fullname,
          role: 'ADMIN',
          balance: restored.balance,
          pendingBalance: restored.pendingBalance,
          totalWithdrawn: restored.totalWithdrawn,
        };
      } catch (err) {}
    }

    if (!admin) {
      return {
        id: payload.id,
        phone: payload.phone,
        email: null,
        fullname: payload.fullname || 'Admin',
        role: 'ADMIN',
        balance: payload.balance || 0,
        pendingBalance: payload.pendingBalance || 0,
        totalWithdrawn: 0,
      };
    }

    return {
      ...admin,
      role: 'ADMIN',
    };
  } catch (error) {
    return null;
  }
}
