import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma = globalForPrisma.prisma ?? new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

// Extend the client with retry logic for stale connections
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            return await query(args);
          } catch (error: any) {
            attempts++;

            const isStaleConnection =
              error.message?.includes('Server has closed the connection') ||
              error.code === 'P1017';

            if (isStaleConnection && attempts < maxAttempts) {
              console.warn(
                `Prisma: Stale connection detected on ${model}.${operation} (attempt ${attempts}/${maxAttempts}) – retrying...`
              );
              // Exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, 100 * attempts)
              );
              continue;
            }

            // Non-retryable error
            throw error;
          }
        }

        throw new Error('Max retry attempts exceeded');
      },
    },
  },
});

export default prisma;