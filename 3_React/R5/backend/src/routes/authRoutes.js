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

// Twitter / X OAuth
authRoutes.get('/twitter', passport.authenticate('twitter', { session: false }));
authRoutes.get('/x', passport.authenticate('twitter', { session: false }));
authRoutes.get(
  '/twitter/callback',
  passport.authenticate('twitter', { session: false, failureRedirect: `${env.frontendUrl}/login?error=twitter_failed` }),
  handleOAuthCallback,
);
authRoutes.get(
  '/x/callback',
  passport.authenticate('twitter', { session: false, failureRedirect: `${env.frontendUrl}/login?error=x_failed` }),
  handleOAuthCallback,
);

// Twitch OAuth
authRoutes.get('/twitch', passport.authenticate('twitch', { session: false }));
authRoutes.get(
  '/twitch/callback',
  passport.authenticate('twitch', { session: false, failureRedirect: `${env.frontendUrl}/login?error=twitch_failed` }),
  handleOAuthCallback,
);

// Facebook OAuth
authRoutes.get('/facebook', passport.authenticate('facebook', { session: false, scope: ['email'] }));
authRoutes.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: `${env.frontendUrl}/login?error=facebook_failed` }),
  handleOAuthCallback,
);

// Meta OAuth
authRoutes.get('/meta', passport.authenticate('meta', { session: false, scope: ['email'] }));
authRoutes.get(
  '/meta/callback',
  passport.authenticate('meta', { session: false, failureRedirect: `${env.frontendUrl}/login?error=meta_failed` }),
  handleOAuthCallback,
);
