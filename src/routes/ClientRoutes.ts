import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { getAllClients,  getClientDetails, updateClientRole, getClientProjects, getProjectDetails, createProject, getClientStats } from '../controllers/Client.controllers';
  
const router = Router();

// Client's own routes - Place these FIRST
router.get('/projects', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getClientProjects);
router.get('/projects/:id', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getProjectDetails);
router.post('/projects', authenticate, restrictTo(['CLIENT', 'DEVELOPER', 'ADMIN']), createProject);
router.get('/stats', authenticate, restrictTo(['CLIENT']), getClientStats);

// Admin/Manager routes for managing clients - Place these AFTER specific routes
router.get('/', authenticate, restrictTo(['ADMIN']), getAllClients);
router.get('/:id', authenticate, restrictTo(['ADMIN']), getClientDetails);
router.patch('/:id/role', authenticate, restrictTo(['ADMIN']), updateClientRole);

export default router;