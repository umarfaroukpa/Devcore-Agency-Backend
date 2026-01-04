import { Router } from 'express';
import { authenticate } from '../middleware/Auth.middleware';
import { getUsers, getUserById, updateUser, deleteUser, approveUser, rejectUser, getAdminStats, getPendingUsers, getActivityLogs } from '../controllers/Admin.controllers';
import { getAllTasks } from '../controllers/TaskAssignment.controllers';
import reportRouter from './ReportRoutes';
import inviteCodeRouter from './InviteCode.routes';

// Helper middleware
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      success: false, 
      error: 'Super Admin access required' 
    });
  }
  next();
};

const requireAdminOrSuper = (req: any, res: any, next: any) => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  next();
};

const adminRouter = Router();

// All admin routes require authentication
adminRouter.use(authenticate);

// Most admin routes: ADMIN or SUPER_ADMIN
adminRouter.use(requireAdminOrSuper);

// Public admin endpoints
adminRouter.get('/stats', getAdminStats);
adminRouter.get('/tasks', getAllTasks);
adminRouter.get('/users/pending', getPendingUsers);
adminRouter.get('/users', getUsers);
adminRouter.get('/users/:id', getUserById);
adminRouter.patch('/users/:id', updateUser);
adminRouter.patch('/users/:id/approve', approveUser);
adminRouter.patch('/users/:id/reject', rejectUser);

// SUPER_ADMIN only routes
adminRouter.delete('/users/:id', requireSuperAdmin, deleteUser);
adminRouter.get('/activity', requireSuperAdmin, getActivityLogs);

// Nested routers
adminRouter.use('/reports', reportRouter);
adminRouter.use('/invite-codes', inviteCodeRouter);

export default adminRouter;