"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const helmet_1 = __importDefault(require("helmet"));
const prisma_1 = __importDefault(require("./config/prisma"));
const ErrorHandler_1 = require("./middleware/ErrorHandler");
const AuthRoutes_1 = __importDefault(require("./routes/AuthRoutes"));
const AdminRoutes_1 = __importDefault(require("./routes/AdminRoutes"));
const TaskRoutes_1 = __importDefault(require("./routes/TaskRoutes"));
const ProjectsRoutes_1 = __importDefault(require("./routes/ProjectsRoutes"));
const UserRoutes_1 = __importDefault(require("./routes/UserRoutes"));
const DeveloperRoutes_1 = __importDefault(require("./routes/DeveloperRoutes"));
const ClientRoutes_1 = __importDefault(require("./routes/ClientRoutes"));
const ContactRoutes_1 = __importDefault(require("./routes/ContactRoutes"));
const ServicesRoutes_1 = __importDefault(require("./routes/ServicesRoutes"));
const InviteCode_routes_1 = __importDefault(require("./routes/InviteCode.routes"));
const SystemSettingsRoutes_1 = __importDefault(require("./routes/SystemSettingsRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const ReportRoutes_1 = __importDefault(require("./routes/ReportRoutes"));
const ForgotPasswordRoutes_1 = __importDefault(require("./routes/ForgotPasswordRoutes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Set up allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:3001',
];
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS Configuration 
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Cache-Control',
        'X-Requested-With'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
// Request logging middleware
app.use((req, res, next) => {
    console.log('🌐 Incoming Request:', {
        method: req.method,
        url: req.url,
    });
    next();
});
// Routes
app.use('/api/auth', AuthRoutes_1.default);
app.use('/api/admin', AdminRoutes_1.default);
app.use('/api/admin/projects', ProjectsRoutes_1.default);
app.use('/api/users', UserRoutes_1.default);
app.use('/api/dev', DeveloperRoutes_1.default);
app.use('/api/clients', ClientRoutes_1.default);
app.use('/api/contact', ContactRoutes_1.default);
app.use('/api/services', ServicesRoutes_1.default);
app.use('/api/admin/invite-codes', InviteCode_routes_1.default);
app.use('/api/tasks', TaskRoutes_1.default);
app.use('/api/admin/settings', SystemSettingsRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/reports', ReportRoutes_1.default);
app.use('/api/auth', ForgotPasswordRoutes_1.default);
// Health check
app.get('/api/health', async (req, res) => {
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
        res.json({
            status: 'OK',
            database: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'ERROR',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});
// 404 Handler
app.use(ErrorHandler_1.notFoundHandler);
// Error handling
app.use(ErrorHandler_1.errorHandler);
// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🛑 Shutting down gracefully...');
    await prisma_1.default.$disconnect();
    process.exit(0);
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
// START SERVER
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set ✅' : '⚠️ NOT SET'}`);
});
