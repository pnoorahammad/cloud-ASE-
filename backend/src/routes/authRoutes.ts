import { Router } from 'express';
import { login, callback, logout } from '../controllers/authController';
import { signUp, signIn, updateProfile, changePassword } from '../controllers/localAuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);

router.get('/login', login);
router.get('/callback', callback);
router.get('/logout', logout);

export default router;
