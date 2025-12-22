import { Router } from 'express';
import { authenticate, restrictTo } from '../middleware/Auth.middleware';
import { submitContactForm,  getContactMessages, replyToContact, getContactMessageById, updateContactMessageStatus, deleteContactMessage} from '../controllers/Contacts.controllers';
  
const contactRouter = Router();

// Public route - anyone can submit
contactRouter.post('/', submitContactForm);

// Protected routes - admin only
contactRouter.use(authenticate, restrictTo(['ADMIN', 'SUPER_ADMIN']));

// Reply Clients From Dashboard
contactRouter.post('/:id/reply', authenticate, restrictTo(['ADMIN', 'SUPER_ADMIN']), replyToContact);

contactRouter.get('/', getContactMessages);
contactRouter.get('/:id', getContactMessageById);
contactRouter.patch('/:id', updateContactMessageStatus);
contactRouter.delete('/:id', deleteContactMessage);

export default contactRouter;