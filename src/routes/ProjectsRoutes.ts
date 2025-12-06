import { Router } from 'express';
import { getMyProjects, getAllProjects, createProject, updateProjectStatus, getProjectById, deleteProject, getProjectStats, updateProject, addProjectMember, removeProjectMember, getProjectMembers } from '../controllers/Project.controller';
import { authenticate, restrictTo } from '../middleware/Auth.middleware';

const projectRouter = Router();

// All routes require authentication
projectRouter.use(authenticate);


// Client can access their own projects
projectRouter.get('/my-projects', restrictTo(['CLIENT']), getMyProjects);

// Project statistics for admin dashboard
projectRouter.get('/stats', restrictTo(['ADMIN', 'SUPER_ADMIN']), getProjectStats);

// Get all projects (accessible to ADMIN and SUPER_ADMIN)
projectRouter.get('/', restrictTo(['ADMIN', 'SUPER_ADMIN']), getAllProjects);

// Create new project (admin/developer only)
projectRouter.post('/', restrictTo(['ADMIN', 'SUPER_ADMIN', 'DEVELOPER']), createProject);

// Get specific project details (MUST come after /my-projects and /stats)
projectRouter.get('/:id', getProjectById);

// Update project (admin/developer only, clients can update their own projects)
projectRouter.patch('/:id', updateProject);

// Update project status (admin/developer only, clients can update their own projects)
projectRouter.patch('/:id/status', updateProjectStatus);

// Delete project (SUPER_ADMIN only)
projectRouter.delete('/:id', restrictTo(['SUPER_ADMIN']), deleteProject);

// Project member management
projectRouter.get('/:id/members', getProjectMembers);
projectRouter.post('/:id/members', restrictTo(['ADMIN', 'SUPER_ADMIN', 'DEVELOPER']), addProjectMember);
projectRouter.delete('/:id/members/:memberId', restrictTo(['ADMIN', 'SUPER_ADMIN', 'DEVELOPER']), removeProjectMember);

export default projectRouter;