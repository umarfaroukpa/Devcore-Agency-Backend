import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getPublicServices, createService, updateService } from '../controllers/Services.controllers';

const router = Router();

// Public route to view all available services
router.get('/', getPublicServices);

// Protected routes for management (Admin/Manager only)
router.post('/', protect, restrictTo(['admin', 'manager']), createService);
router.put('/:id', protect, restrictTo(['admin', 'manager']), updateService);

export default router;