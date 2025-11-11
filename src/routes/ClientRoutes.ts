// src/routes/ClientsRoutes.ts
import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getAllClients, getClientDetails, updateClientRole } from '../controllers/Client.controllers';

const router = Router();

// Apply protection and restrict access to admin/manager for ALL client management
router.use(protect, restrictTo(['admin', 'manager']));

// Get a list of all users with the role 'client'
router.get('/', getAllClients);
// Get details for a specific client
router.get('/:id', getClientDetails); 
// Update a client's role (e.g., changing client to manager)
router.patch('/:id/role', updateClientRole); 

export default router;