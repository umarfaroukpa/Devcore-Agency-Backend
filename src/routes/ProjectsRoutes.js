"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Project_controller_1 = require("../controllers/Project.controller");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const projectRouter = (0, express_1.Router)();
// All routes require authentication
projectRouter.use(Auth_middleware_1.authenticate);
// Client can access their own projects
projectRouter.get('/my-projects', (0, Auth_middleware_1.restrictTo)(['CLIENT']), Project_controller_1.getMyProjects);
// Project statistics for admin dashboard
projectRouter.get('/stats', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']), Project_controller_1.getProjectStats);
// Get all projects (accessible to ADMIN and SUPER_ADMIN)
projectRouter.get('/', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']), Project_controller_1.getAllProjects);
// Create new project (admin/developer only)
projectRouter.post('/', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN', 'DEVELOPER']), Project_controller_1.createProject);
// Get specific project details (MUST come after /my-projects and /stats)
projectRouter.get('/:id', Project_controller_1.getProjectById);
// Update project (admin/developer only, clients can update their own projects)
projectRouter.patch('/:id', Project_controller_1.updateProject);
// Update project status (admin/developer only, clients can update their own projects)
projectRouter.patch('/:id/status', Project_controller_1.updateProjectStatus);
// Delete project (SUPER_ADMIN only)
projectRouter.delete('/:id', (0, Auth_middleware_1.restrictTo)(['SUPER_ADMIN']), Project_controller_1.deleteProject);
// Project member management
projectRouter.get('/:id/members', Project_controller_1.getProjectMembers);
projectRouter.post('/:id/members', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN', 'DEVELOPER']), Project_controller_1.addProjectMember);
projectRouter.delete('/:id/members/:memberId', (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN', 'DEVELOPER']), Project_controller_1.removeProjectMember);
exports.default = projectRouter;
