import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { deployTool, viewLogs, getDeveloperTasks } from '../controllers/Developer.controller'; 

const router = Router();

// All routes here must be authenticated and restricted to 'developer'
router.use(authenticate, restrictTo(['developer'])); 

// GET /api/v1/dev/tasks - View tasks assigned specifically to developers
router.get('/tasks', getDeveloperTasks); 

// POST /api/v1/dev/deploy - Endpoint for triggering a deployment (high-privilege)
router.post('/deploy', deployTool);

// GET /api/v1/dev/logs - Endpoint to view system logs
router.get('/logs', viewLogs);

export default router;