"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const connectDatabase = async () => {
    try {
        await prisma_1.default.$connect();
        console.log('✅ Database connected');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    await prisma_1.default.$disconnect();
};
exports.disconnectDatabase = disconnectDatabase;
exports.default = prisma_1.default;
