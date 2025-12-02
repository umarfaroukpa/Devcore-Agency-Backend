import { Router } from 'express';
import { authenticate, restrictTo } from '../middleware/Auth.middleware';
import { createInviteCode, getAllInviteCodes, deleteInviteCode } from '../controllers/InviteCode.controller';
  

const router = Router();

// Admin only routes
router.post('/', authenticate, restrictTo(['ADMIN']), createInviteCode);
router.get('/', authenticate, restrictTo(['ADMIN']), getAllInviteCodes);
router.delete('/:id', authenticate, restrictTo(['ADMIN']), deleteInviteCode);


export default router;
