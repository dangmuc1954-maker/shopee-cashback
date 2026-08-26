import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

function setupDatabaseUrl() {
  // Khi chạy trên Vercel hoặc Serverless Environment (nơi hệ thống tệp gốc là read-only)
  const currentUrl = process.env.DATABASE_URL || 'file:./dev.db';

  if (currentUrl.startsWith('file:') && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production')) {
    try {
      const tmpDir = '/tmp';
      if (fs.existsSync(tmpDir)) {
        const tmpDbPath = path.join(tmpDir, 'dev.db');
        if (!fs.existsSync(tmpDbPath)) {
          const candidatePaths = [
            path.join(process.cwd(), 'prisma', 'dev.db'),
            path.join(process.cwd(), 'dev.db'),
            path.resolve(__dirname, '..', '..', 'prisma', 'dev.db'),
            path.resolve(__dirname, '..', 'prisma', 'dev.db'),
          ];
          for (const cand of candidatePaths) {
            if (fs.existsSync(cand)) {
              try {
                fs.copyFileSync(cand, tmpDbPath);
                break;
              } catch (e) {
                console.warn('Could not copy db from', cand, e);
              }
            }
          }
        }
        if (fs.existsSync(tmpDbPath)) {
          process.env.DATABASE_URL = `file:${tmpDbPath}`;
        }
      }
    } catch (err) {
      console.warn('Error setting up serverless SQLite:', err);
    }
  }
}

setupDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

