import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import { getUsers, deleteUser } from '../controllers/Admin.controllers';

const router = Router();

// All routes after this middleware are protected and restricted to 'admin'
router.use(authenticate, restrictTo(['admin']));

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser); 

export default router;