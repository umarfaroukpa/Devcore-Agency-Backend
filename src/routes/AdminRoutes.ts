import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { getUsers, deleteUser, getUserById, updateUser, approveUser, getAdminStats } from '../controllers/Admin.controllers';

const router = Router();

// All routes protected and restricted to 'admin'
router.use(authenticate, restrictTo(['ADMIN']));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/approve', approveUser);
router.delete('/users/:id', deleteUser);

export default router;