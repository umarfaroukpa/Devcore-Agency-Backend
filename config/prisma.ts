import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  // Disable features not compatible with PgBouncer transaction mode
  transactionOptions: {
    maxWait: 2000, // 2 seconds max wait
    timeout: 5000, // 5 seconds timeout
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle disconnection gracefully
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;