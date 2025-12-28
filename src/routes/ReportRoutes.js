"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const Reports_cotroller_1 = require("../controllers/Reports.cotroller");
const reportRouter = (0, express_1.Router)();
// All routes protected and restricted to ADMIN and SUPER_ADMIN
reportRouter.use(Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']));
// Report Statistics
reportRouter.get('/stats', Reports_cotroller_1.getReportStats);
// Users Report
reportRouter.get('/users', Reports_cotroller_1.getUsersReport);
// Projects Report
reportRouter.get('/projects', Reports_cotroller_1.getProjectsReport);
// Financial Report
reportRouter.get('/financial', Reports_cotroller_1.getFinancialReport);
// Tasks Report
reportRouter.get('/tasks', Reports_cotroller_1.getTasksReport);
// Activity Report (requires permission)
reportRouter.get('/activity', (0, Auth_middleware_1.requirePermission)('canViewAllProjects'), Reports_cotroller_1.getActivityReport);
// System Health (SUPER_ADMIN only)
reportRouter.get('/health', (0, Auth_middleware_1.restrictTo)(['SUPER_ADMIN']), Reports_cotroller_1.getSystemHealth);
// Export Report
reportRouter.post('/export', Reports_cotroller_1.exportReport);
exports.default = reportRouter;
