import { Router } from 'express';
import { restrictTo, authenticate, requirePermission, superAdminOnly } from '../middleware/Auth.middleware';
import { getUsers, deleteUser, getUserById, updateUser, approveUser, getAdminStats, getPendingUsers, getActivityLogs } from '../controllers/Admin.controllers';


const adminRouter = Router();

// All routes protected and restricted ADMIN and SUPER_ADMIN
adminRouter.use(authenticate, restrictTo(['ADMIN', 'SUPER_ADMIN']));

// Stats all admins can view
adminRouter.get('/stats', getAdminStats);

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



export default adminRouter;