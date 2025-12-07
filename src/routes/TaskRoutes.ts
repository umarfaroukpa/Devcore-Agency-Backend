import { Router } from 'express';
import { restrictTo, authenticate, requirePermission } from '../middleware/Auth.middleware';
import { createTask, assignTask, getAvailableDevelopers, getMyTasks, updateTask, getAllTasks,  getTaskById, deleteTask } from '../controllers/TaskAssignment.controllers'; 
  

const taskRoutes = Router();
// All task routes require authentication
taskRoutes.use(authenticate);


taskRoutes.use(requirePermission, restrictTo (['ADMIN', 'SUPER_ADMIN']))

// Get all tasks (admins see all, others see only their tasks)
taskRoutes.get('/', getAllTasks);

// Get single task by ID
taskRoutes.get('/:id', getTaskById);  

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

// Delete task 
 taskRoutes.delete('/:id', deleteTask);


export default taskRoutes;