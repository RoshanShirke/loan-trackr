import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, updateProfile } from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
