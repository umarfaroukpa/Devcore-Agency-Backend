import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { getPublicServices, createService, updateService } from '../controllers/Services.controllers';

const router = Router();

// Public route to view all available services
router.get('/', getPublicServices);

// Protected routes for management (Admin/Manager only)
router.post('/', authenticate, restrictTo(['admin', 'manager']), createService);
router.put('/:id', authenticate, restrictTo(['admin', 'manager']), updateService);

export default router;