import { Router } from 'express';
import { signup, login, verifyOTP, resendOTP, checkUserId } from '../controllers/authController.js';
import { validate, signupSchema, loginSchema } from '../middleware/validation.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/check-userid/:id', checkUserId);

export default router;
