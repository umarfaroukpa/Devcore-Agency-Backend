"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const password = await bcryptjs_1.default.hash('123456', 12);
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
