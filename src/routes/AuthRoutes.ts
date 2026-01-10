import { Router } from 'express';
import { signup, login, verifyInviteCode, googleAuth} from '../controllers/Auth.Controller';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/verify-invite', verifyInviteCode);

export default router;