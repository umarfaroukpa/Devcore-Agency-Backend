import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { createProject, getMyProjects, updateProjectStatus } from '../controllers/project.controller';

const router = Router();

// Protect all routes
router.use(protect);

// Clients can only get their projects
router.get('/my-projects', restrictTo(['client']), getMyProjects);

// Managers/Admins can create and update projects
router.post('/', restrictTo(['admin', 'manager']), createProject);
router.patch('/:id/status', restrictTo(['admin', 'manager']), updateProjectStatus);

export default router;