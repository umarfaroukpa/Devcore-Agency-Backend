import { Router } from 'express';
import { authenticate, restrictTo } from '../middleware/Auth.middleware';
import { createInviteCode, getAllInviteCodes, deleteInviteCode } from '../controllers/InviteCode.controller';
  

const inviteCodeRouter = Router();

// Admin only routes
inviteCodeRouter.post('/', authenticate, restrictTo(['SUPER_ADMIN', 'ADMIN']), createInviteCode);
inviteCodeRouter.get('/', authenticate, restrictTo(['SUPER_ADMIN', 'ADMIN']), getAllInviteCodes);

// SUPER_ADMIN only route
inviteCodeRouter.delete('/:id', authenticate, restrictTo(['SUPER_ADMIN']), deleteInviteCode);


export default inviteCodeRouter;
