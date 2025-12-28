"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Create Super Admin
    const hashedPassword = await bcryptjs_1.default.hash('SuperAdmin@123', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'yasmarfaq@yahoo.com' },
        update: {},
        create: {
            email: 'yasmarfaq@yahoo.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            isActive: true,
            isApproved: true,
            // Super admin has all permissions by default
            canApproveUsers: true,
            canDeleteUsers: true,
            canManageProjects: true,
            canAssignTasks: true,
            canViewAllProjects: true
        }
    });
    console.log('✅ Super Admin created:', superAdmin.email);
    // Create a regular admin with limited permissions
    const regularAdminPassword = await bcryptjs_1.default.hash('Admin@123', 10);
    const regularAdmin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: regularAdminPassword,
            firstName: 'Regular',
            lastName: 'Admin',
            role: 'ADMIN',
            isActive: true,
            isApproved: true,
            // Limited permissions
            canApproveUsers: true,
            canDeleteUsers: false,
            canManageProjects: true,
            canAssignTasks: true,
            canViewAllProjects: false
        }
    });
    console.log('✅ Regular Admin created:', regularAdmin.email);
    // Create a sample developer
    const developerPassword = await bcryptjs_1.default.hash('Developer@123', 10);
    const developer = await prisma.user.upsert({
        where: { email: 'developer@example.com' },
        update: {},
        create: {
            email: 'developer@example.com',
            password: developerPassword,
            firstName: 'John',
            lastName: 'Developer',
            role: 'DEVELOPER',
            isActive: true,
            isApproved: true,
            skills: 'React, Node.js, TypeScript',
            experience: '3 years',
            githubUsername: 'johndeveloper'
        }
    });
    console.log('✅ Developer created:', developer.email);
    console.log('\n📝 Login Credentials:');
    console.log('Super Admin: superadmin@example.com / SuperAdmin@123');
    console.log('Regular Admin: admin@example.com / Admin@123');
    console.log('Developer: developer@example.com / Developer@123');
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
