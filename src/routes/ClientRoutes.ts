import { Router } from 'express';
import { getAllClients, getClientDetails, updateClientRole,  getClientProjects, getProjectDetails, createProject, getClientStats, getProjectComments, addProjectComment, getProjectTimeLogs, addProjectTimeLog} from '../controllers/Client.controllers';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';

const router = Router();

// Client's own routes
router.get('/projects', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getClientProjects);
router.get('/projects/:id', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getProjectDetails);
router.post('/projects', authenticate, restrictTo(['CLIENT', 'DEVELOPER', 'ADMIN']), createProject);
router.get('/stats', authenticate, restrictTo(['CLIENT']), getClientStats);

// New comment and time-log routes
router.get('/projects/:id/comments', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getProjectComments);
router.post('/projects/:id/comments', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), addProjectComment);
router.get('/projects/:id/time-logs', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), getProjectTimeLogs);
router.post('/projects/:id/time-logs', authenticate, restrictTo(['CLIENT', 'ADMIN', 'DEVELOPER']), addProjectTimeLog);

// Admin routes for managing clients
router.get('/', authenticate, restrictTo(['ADMIN']), getAllClients);
router.get('/:id', authenticate, restrictTo(['ADMIN']), getClientDetails);
router.patch('/:id/role', authenticate, restrictTo(['ADMIN']), updateClientRole);

export default router;