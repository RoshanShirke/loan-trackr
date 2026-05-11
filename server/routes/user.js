import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, updateProfile, getAllUsers } from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/all', getAllUsers);

export default router;
