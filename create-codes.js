const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('🔧 Creating invite codes...\n');
    const codes = [
        { code: 'SUPERADMINA1', role: 'SUPER_ADMIN' },
        { code: 'ADMINA1', role: 'ADMIN' },
        { code: 'DEVEL1', role: 'DEVELOPER' },
        { code: 'DEVEL2', role: 'DEVELOPER' },
        { code: 'DEVEL3', role: 'DEVELOPER' },
    ];
    for (const { code, role } of codes) {
        try {
            await prisma.inviteCode.create({
                data: {
                    code,
                    role,
                    used: false,
                    createdBy: "yasmarfaq@yahoo.com"
                }
            });
            console.log(`✅ Created: ${code} (${role})`);
        }
        catch (error) {
            if (error.code === 'P2002') {
                console.log(`⏭️  Already exists: ${code}`);
            }
            else {
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
