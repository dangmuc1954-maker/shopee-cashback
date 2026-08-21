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

export async function createSessionToken(payload: { id: string; role: string; phone: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<{ id: string; role: string; phone: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as { id: string; role: string; phone: string };
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
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
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

    if (!user) return null;

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
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.id || payload.role !== 'ADMIN') return null;

    const admin = await prisma.user.findUnique({
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

    if (!admin) return null;

    return {
      ...admin,
      role: 'ADMIN',
    };
  } catch (error) {
    return null;
  }
}
