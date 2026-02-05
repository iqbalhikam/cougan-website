import { PrismaClient } from '../prisma/generated/prisma/client';// Sesuaikan path jika perlu
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Setup Pool dengan batasan koneksi
  const pool = new Pool({
    connectionString,
    // PENTING: Di local (dev), batasi max 1 koneksi agar tidak cepat penuh.
    // Di production, bisa lebih banyak (misal 10 atau default).
    max: process.env.NODE_ENV === 'production' ? 10 : 1,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error'], // Hanya tampilkan log error agar terminal bersih
  });
};

// Singleton pattern untuk mencegah multiple instance saat hot-reload
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;