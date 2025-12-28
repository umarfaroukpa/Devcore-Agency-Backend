"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const TaskAssignment_controllers_1 = require("../controllers/TaskAssignment.controllers");
const taskRoutes = (0, express_1.Router)();
// All task routes require authentication
taskRoutes.use(Auth_middleware_1.authenticate);
// Get my tasks (any authenticated user) - /:id
taskRoutes.get('/my-tasks', TaskAssignment_controllers_1.getMyTasks);
// Get available developers for assignment - MUST be before /:id
taskRoutes.get('/available-developers', TaskAssignment_controllers_1.getAvailableDevelopers);
// Create task - requires ADMIN or SUPER_ADMIN
taskRoutes.post('/', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']), TaskAssignment_controllers_1.createTask);
// Get all tasks (admins see all, others see only their tasks)
taskRoutes.get('/', TaskAssignment_controllers_1.getAllTasks);
// Assign/reassign task - requires ADMIN or SUPER_ADMIN
taskRoutes.patch('/:id/assign', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']), TaskAssignment_controllers_1.assignTask);
// Get single task by ID
taskRoutes.get('/:id', TaskAssignment_controllers_1.getTaskById);
// Update task (creator, assignee, or admin)
taskRoutes.patch('/:id', TaskAssignment_controllers_1.updateTask);
// Delete task - requires ADMIN or SUPER_ADMIN
taskRoutes.delete('/:id', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']), TaskAssignment_controllers_1.deleteTask);
exports.default = taskRoutes;
