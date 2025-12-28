"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Initialize Prisma Client
const prisma = new client_1.PrismaClient({
    // Optional: Add logging for better debugging in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
exports.default = prisma;
