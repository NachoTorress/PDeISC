import { Router } from 'express';
import passport from 'passport';
import { env } from '../config/env.js';
import { handleOAuthCallback, login, logout, me, register } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', protect, me);
authRoutes.post('/logout', protect, logout);

// GitHub OAuth
authRoutes.get('/github', passport.authenticate('github', { session: false }));
authRoutes.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${env.frontendUrl}/login?error=github_failed` }),
  handleOAuthCallback,
);

// Google OAuth
authRoutes.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
authRoutes.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.frontendUrl}/login?error=google_failed` }),
  handleOAuthCallback,
);

// Discord OAuth
authRoutes.get('/discord', passport.authenticate('discord', { session: false }));
authRoutes.get(
  '/discord/callback',
  passport.authenticate('discord', { session: false, failureRedirect: `${env.frontendUrl}/login?error=discord_failed` }),
  handleOAuthCallback,
);
