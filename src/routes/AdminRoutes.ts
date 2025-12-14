import { Router } from 'express';
import { restrictTo, authenticate, requirePermission, superAdminOnly } from '../middleware/Auth.middleware';
import { getUsers, deleteUser, getUserById, updateUser, approveUser, getAdminStats, getPendingUsers, getActivityLogs } from '../controllers/Admin.controllers';
import { getAllTasks } from '../controllers/TaskAssignment.controllers';
import reportRouter from './ReportRoutes';
import inviteCodeRouter from './InviteCode.routes';


const adminRouter = Router();

// All routes protected and restricted ADMIN and SUPER_ADMIN
adminRouter.use(authenticate, restrictTo(['ADMIN', 'SUPER_ADMIN']));

// Stats all admins can view
adminRouter.get('/stats', getAdminStats);

// This allows admins to access tasks via /api/admin/tasks
adminRouter.get('/tasks', getAllTasks);


// Users management - ADMIN and SUPER_ADMIN
adminRouter.get('/users/pending', getPendingUsers); 
adminRouter.get('/users', getUsers);
adminRouter.get('/users/:id', getUserById);

// Update user - all admins, but with role restrictions in controller
adminRouter.patch('/users/:id', updateUser);

// Approve users - requires permission
adminRouter.patch('/users/:id/approve', approveUser);

// Delete users - requires permission
adminRouter.delete('/users/:id', superAdminOnly, restrictTo(['SUPER_ADMIN']), requirePermission('canDeleteUsers'), deleteUser);

// Activity logs - SUPER_ADMIN only
adminRouter.get('/activity', superAdminOnly, getActivityLogs); 

// Reports - ADMIN and SUPER_ADMIN
adminRouter.use('/reports', reportRouter);

// Invite Codes - ADMIN and SUPER_ADMIN
adminRouter.use('/invite-codes', inviteCodeRouter)

// Tasks - ADMIN and SUPER_ADMIN
adminRouter.get('/tasks', async (req, res, next) => {
  try {
    // Forward the request to the task controller
    req.url = '/api/tasks';
    next('route'); // Pass to next route handler
  } catch (error) {
    next(error);
  }
});




export default adminRouter;