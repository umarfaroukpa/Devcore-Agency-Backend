import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getUsers, deleteUser } from '../controllers/Admin.controllers'; 

const router = Router();

// All routes after this middleware are protected and restricted to 'admin'
router.use(protect, restrictTo(['admin']));

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser); 

export default router;