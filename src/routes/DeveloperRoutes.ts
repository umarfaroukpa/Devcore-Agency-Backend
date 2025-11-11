import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { deployTool, viewLogs, getDeveloperTasks } from '../controllers/developer.controller'; 

const router = Router();

// All routes here must be authenticated and restricted to 'developer'
router.use(protect, restrictTo(['developer', 'admin'])); 

// GET /api/v1/dev/tasks - View tasks assigned specifically to developers
router.get('/tasks', getDeveloperTasks); 

// POST /api/v1/dev/deploy - Endpoint for triggering a deployment (high-privilege)
router.post('/deploy', deployTool);

// GET /api/v1/dev/logs - Endpoint to view system logs
router.get('/logs', viewLogs);

export default router;