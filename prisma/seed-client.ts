import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 12);

  await prisma.user.upsert({
    where: { email: 'umarfarouk@yahoo.com' },
    update: {},
    create: {
      email: 'umarfarouk@yahoo.com',
      password: 'test123',
      firstName: 'Umar',
      lastName: 'Farouk',
      role: 'ADMIN',
      companyName: 'C.E.O',
      isActive: true,
      isApproved: true, 
    }
  });

  console.log('Test Admin created: umarfarouk@yahoo.com');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });