import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { createProject, getMyProjects, updateProjectStatus } from '../controllers/Project.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

// Clients can only get their projects
router.get('/my-projects', restrictTo(['client']), getMyProjects);

// Managers/Admins can create and update projects
router.post('/', restrictTo(['admin', 'manager']), createProject);
router.patch('/:id/status', restrictTo(['admin', 'manager']), updateProjectStatus);
export default router;