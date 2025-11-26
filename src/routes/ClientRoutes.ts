import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { getAllClients,  getClientDetails, updateClientRole, getClientProjects, getProjectDetails, createProject, getClientStats } from '../controllers/Client.controllers';
  

const router = Router();

// Client's own routes
router.get('/projects', restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getClientProjects);
router.get('/projects/:id', restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getProjectDetails);
router.post('/projects', restrictTo(['CLIENT', 'DEVELOPER', 'ADMIN']), createProject);
router.get('/stats', restrictTo(['CLIENT']), getClientStats);

// Admin/Manager routes for managing clients
router.get('/', restrictTo(['ADMIN']), getAllClients);
router.get('/:id', restrictTo(['ADMIN']), getClientDetails);
router.patch('/:id/role', restrictTo(['ADMIN']), updateClientRole);

export default router;