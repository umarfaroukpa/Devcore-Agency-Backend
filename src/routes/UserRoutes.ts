import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getMyProfile, updateMyProfile, updateMyPassword } from '../controllers/user.controller';

const router = Router();

// Apply protection to all user routes
router.use(protect);

// GET /api/v1/users/me - Get the logged-in user's profile
router.get('/me', getMyProfile);

// PATCH /api/v1/users/me - Update the logged-in user's profile details (e.g., name, non-sensitive data)
router.patch('/me', updateMyProfile);

// PATCH /api/v1/users/updatePassword - Update the logged-in user's password
router.patch('/updatePassword', updateMyPassword);

export default router;