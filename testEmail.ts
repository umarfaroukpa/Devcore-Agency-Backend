import { Router } from 'express';
import { sendEmail } from './src/utils/emailservices';

export const router = Router();



router.get('/test-email', async (req, res) => {
  try {
    await sendEmail('yasmarfaq51@gmail.com', 'approval', {
      user: { firstName: 'Test', role: 'DEVELOPER' }
    });
    res.json({ success: true, message: 'Email sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});