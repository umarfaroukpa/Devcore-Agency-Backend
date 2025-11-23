const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating invite codes...\n');

  const codes = [
    { code: 'ADMIN001', role: 'ADMIN' },
    { code: 'ADMIN002', role: 'ADMIN' },
    { code: 'DEV001', role: 'DEVELOPER' },
    { code: 'DEV002', role: 'DEVELOPER' },
    { code: 'DEV003', role: 'DEVELOPER' },
  ];

  for (const { code, role } of codes) {
    try {
      await prisma.inviteCode.create({
        data: { code, role, used: false }
      });
      console.log(`✅ Created: ${code} (${role})`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⏭️  Already exists: ${code}`);
      } else {
        console.error(`❌ Error creating ${code}:`, error.message);
      }
    }
  }

  console.log('\n🎉 Done!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });