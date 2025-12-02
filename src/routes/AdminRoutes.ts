import { Router } from 'express';
import { restrictTo, authenticate, requirePermission, superAdminOnly } from '../middleware/Auth.middleware';
import { getUsers, deleteUser, getUserById, updateUser, approveUser, getAdminStats, getPendingUsers, getActivityLogs } from '../controllers/Admin.controllers';
import { createTask, assignTask,  getAvailableDevelopers, getMyTasks, updateTask } from '../controllers/TaskAssignment.controllers'; 
  

const router = Router();
const taskRoutes = Router();

// All routes protected and restricted to 'admin'
router.use(authenticate, restrictTo(['ADMIN', 'SUPER_ADMIN']));

// Stats
router.get('/stats', getAdminStats);

// Users
router.get('/users/pending', getPendingUsers); 
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/approve', approveUser);
router.delete('/users/:id', superAdminOnly, restrictTo(['SUPER_ADMIN']), requirePermission('canDeleteUsers'), deleteUser);

// Activity logs - SUPER_ADMIN only
router.get('/activity', superAdminOnly, getActivityLogs);


// All task routes require authentication
taskRoutes.use(authenticate);

// Get my tasks (any authenticated user)
taskRoutes.get('/my-tasks', getMyTasks);

// Get available developers for assignment
taskRoutes.get('/available-developers', getAvailableDevelopers);

// Create task (project members and admins)
taskRoutes.post('/', createTask);

// Assign/reassign task (requires permission or admin role)
taskRoutes.patch('/:id/assign', assignTask);

// Update task (creator, assignee, or admin)
taskRoutes.patch('/:id', updateTask);


export default {router, taskRoutes};