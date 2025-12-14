import { Router } from 'express';
import { restrictTo, authenticate, requirePermission } from '../middleware/Auth.middleware';
import { createTask, assignTask, getAvailableDevelopers, getMyTasks, updateTask, getAllTasks, getTaskById, deleteTask } from '../controllers/TaskAssignment.controllers'; 

const taskRoutes = Router();

// All task routes require authentication
taskRoutes.use(authenticate);

// Get my tasks (any authenticated user) - /:id
taskRoutes.get('/my-tasks', getMyTasks);

// Get available developers for assignment - MUST be before /:id
taskRoutes.get('/available-developers', getAvailableDevelopers);

// Create task - requires ADMIN or SUPER_ADMIN
taskRoutes.post('/', restrictTo(['ADMIN', 'SUPER_ADMIN']), createTask);

// Get all tasks (admins see all, others see only their tasks)
taskRoutes.get('/', getAllTasks);

// Assign/reassign task - requires ADMIN or SUPER_ADMIN
taskRoutes.patch('/:id/assign', restrictTo(['ADMIN', 'SUPER_ADMIN']), assignTask);

// Get single task by ID
taskRoutes.get('/:id', getTaskById);

// Update task (creator, assignee, or admin)
taskRoutes.patch('/:id', updateTask);

// Delete task - requires ADMIN or SUPER_ADMIN
taskRoutes.delete('/:id', restrictTo(['ADMIN', 'SUPER_ADMIN']), deleteTask);

export default taskRoutes;