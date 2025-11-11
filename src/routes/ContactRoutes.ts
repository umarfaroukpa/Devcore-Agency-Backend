import { Router } from 'express';
import { submitContactForm, getSubmissions } from '../controllers/Contacts.controllers';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Public route for form submission
router.post('/', submitContactForm);

// Protected route for admins/managers to view submissions
router.get('/submissions', protect, restrictTo(['admin', 'manager']), getSubmissions);

export default router;