import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { getUsers, deleteUser, getUserById, updateUser, approveUser, getAdminStats, getPendingUsers } from '../controllers/Admin.controllers';

const router = Router();

// All routes protected and restricted to 'admin'
router.use(authenticate, restrictTo(['ADMIN']));

// Stats
router.get('/stats', getAdminStats);

// Users
router.get('/users/pending', getPendingUsers); 
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/approve', approveUser);
router.delete('/users/:id', deleteUser);

export default router;