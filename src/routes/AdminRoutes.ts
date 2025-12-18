import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requirePermission } from '../middleware/Auth.middleware';
import { getUsers, deleteUser, getUserById, updateUser, approveUser, getAdminStats, getPendingUsers, getActivityLogs, rejectUser } from '../controllers/Admin.controllers';
import { getAllTasks } from '../controllers/TaskAssignment.controllers';
import reportRouter from './ReportRoutes';
import inviteCodeRouter from './InviteCode.routes';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    canApproveUsers: boolean;
    canDeleteUsers: boolean;
    canManageProjects: boolean;
    canAssignTasks: boolean;
    canViewAllProjects: boolean;
    userId: string;
  };
}

const adminRouter = Router();

// All routes require authentication
adminRouter.use(authenticate);

// Logging middleware for debugging
adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  console.log('📍 Admin Route:', req.method, req.path);
  console.log('👤 User Role:', authReq.user?.role);
  console.log('🔍 Query Params:', req.query);
  next();
});

// Apply role restrictions differently for different routes
adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  // Check the path to apply different restrictions
  if (req.path.startsWith('/activity')) {
    console.log('🔒 Checking SUPER_ADMIN access for activity logs...');
    // For activity logs, only SUPER_ADMIN
    if (authReq.user?.role !== 'SUPER_ADMIN') {
      console.log('❌ Access denied - not a SUPER_ADMIN');
      return res.status(403).json({ 
        success: false,
        error: 'Only Super Admins can view activity logs' 
      });
    }
    console.log('✅ SUPER_ADMIN access granted');
  } else {
    // For other routes, allow ADMIN and SUPER_ADMIN
    if (!['ADMIN', 'SUPER_ADMIN'].includes(authReq.user?.role || '')) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Requires ADMIN or SUPER_ADMIN role.' 
      });
    }
  }
  next();
});

// Stats all admins can view
adminRouter.get('/stats', getAdminStats);

// Tasks
adminRouter.get('/tasks', getAllTasks);

// Users management - ADMIN and SUPER_ADMIN
adminRouter.get('/users/pending', getPendingUsers); 
adminRouter.get('/users', getUsers);
adminRouter.get('/users/:id', getUserById);

// Update user - all admins, but with role restrictions in controller
adminRouter.patch('/users/:id', updateUser);

// Approve users - requires permission
adminRouter.patch('/users/:id/approve', approveUser);

// Reject users - requires permission
adminRouter.patch('/users/:id/reject', rejectUser);

// Delete users - SUPER_ADMIN only with permission
adminRouter.delete('/users/:id', 
  (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (authReq.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Only Super Admins can delete users' 
      });
    }
    next();
  },
  requirePermission('canDeleteUsers'), 
  deleteUser
);

// Activity logs - SUPER_ADMIN only
adminRouter.get('/activity', (req: Request, res: Response, next: NextFunction) => {
  console.log('🎯 Activity endpoint hit');
  console.log('Query:', req.query);
  next();
}, getActivityLogs); 

// Reports - ADMIN and SUPER_ADMIN
adminRouter.use('/reports', reportRouter);

// Invite Codes - ADMIN and SUPER_ADMIN
adminRouter.use('/invite-codes', inviteCodeRouter);

export default adminRouter;