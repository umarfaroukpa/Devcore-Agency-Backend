import { Router } from 'express';
import { authenticate, restrictTo } from '../middleware/Auth.middleware';
import { createInviteCode, getAllInviteCodes, deleteInviteCode } from '../controllers/InviteCode.controller';
  

const router = Router();

// Admin only routes
router.post('/', authenticate, restrictTo(['SUPER_ADMIN', 'ADMIN']), createInviteCode);
router.get('/', authenticate, restrictTo(['SUPER_ADMIN', 'ADMIN']), getAllInviteCodes);
router.delete('/:id', authenticate, restrictTo(['SUPER_ADMIN']), deleteInviteCode);


export default router;
