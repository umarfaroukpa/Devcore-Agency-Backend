import { Router } from 'express';
import { signup, login, verifyInviteCode } from '../controllers/Auth.Controller';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-invite', verifyInviteCode);

export default router;