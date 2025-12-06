import { Router } from 'express';
import { authenticate } from '../middleware/Auth.middleware';
import { getMyProfile, updateMyProfile, updateMyPassword } from '../controllers/User.controller';

const router = Router();

// Apply protection to all user routes
router.use(authenticate);

// GET /api/users/me - Get the logged-in user's profile
router.get('/me', getMyProfile);

// PATCH /api/users/updateMyProfile - Update the logged-in user's profile details (e.g., name, non-sensitive data)
router.patch('/updateMyProfile', updateMyProfile);
// PATCH /api/users/updateMyPassword - Update the logged-in user's password
router.patch('/updateMyPassword', updateMyPassword);

export default router;