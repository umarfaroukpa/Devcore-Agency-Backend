import { Router } from 'express';
import { restrictTo, authenticate, requirePermission } from '../middleware/Auth.middleware';
import { createTask, assignTask,  getAvailableDevelopers, getMyTasks, updateTask } from '../controllers/TaskAssignment.controllers'; 



const taskRoutes = Router();

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

export default taskRoutes;