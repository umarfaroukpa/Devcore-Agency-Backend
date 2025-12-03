import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { createProject, getMyProjects, updateProjectStatus, getAllProjects } from '../controllers/Project.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

// GET /api/projects - Get all projects (Admin/Dev/Super Admin)
router.get('/', restrictTo(['ADMIN', 'SUPER_ADMIN', 'DEVELOPER']), getAllProjects);

// Clients can only get their projects
router.get('/my-projects', restrictTo(['CLIENT']), getMyProjects);

// Admin/Super/Dev can create and update projects
router.post('/', restrictTo(['ADMIN', 'DEVELOPER', 'SUPER_ADMIN']), createProject);
router.patch('/:id/status', restrictTo(['ADMIN', 'DEVELOPER', 'SUPER_ADMIN']), updateProjectStatus);

export default router;