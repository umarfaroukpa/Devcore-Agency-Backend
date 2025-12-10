import { Router } from 'express';
import { forgotPassword, resetPassword, verifyResetToken } from '../controllers/ForgotPassword.controllers';


const authRouter = Router();



// Public routes
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);
authRouter.get('/verify-reset-token/:token', verifyResetToken);

export default authRouter;