import { Router } from 'express';
import { authenticate, restrictTo, requirePermission } from '../middleware/Auth.middleware';
import { getReportStats, getUsersReport,  getProjectsReport, getFinancialReport, getTasksReport, getActivityReport, getSystemHealth, exportReport } from '../controllers/Reports.cotroller';
  


const reportRouter = Router();

// All routes protected and restricted to ADMIN and SUPER_ADMIN
reportRouter.use(authenticate, restrictTo(['ADMIN', 'SUPER_ADMIN']));

// Report Statistics
reportRouter.get('/stats', getReportStats);

// Users Report
reportRouter.get('/users', getUsersReport);

// Projects Report
reportRouter.get('/projects', getProjectsReport);

// Financial Report
reportRouter.get('/financial', getFinancialReport);

// Tasks Report
reportRouter.get('/tasks', getTasksReport);

// Activity Report (requires permission)
reportRouter.get('/activity', requirePermission('canViewAllProjects'), getActivityReport);

// System Health (SUPER_ADMIN only)
reportRouter.get('/health', restrictTo(['SUPER_ADMIN']), getSystemHealth);

// Export Report
reportRouter.post('/export', exportReport);

export default reportRouter;