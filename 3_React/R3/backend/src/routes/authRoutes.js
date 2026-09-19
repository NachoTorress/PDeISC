import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', protect, me);
authRoutes.post('/logout', protect, logout);

