import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { env } from './env.js';
import { findOrCreateOAuthUser } from '../services/userService.js';

export function setupPassport() {
  // GitHub Strategy
  if (env.oauth.github.clientId && env.oauth.github.clientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: env.oauth.github.clientId,
          clientSecret: env.oauth.github.clientSecret,
          callbackURL: env.oauth.github.callbackUrl,
          scope: ['user:email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value ?? null;
            const names = (profile.displayName || profile.username || 'GitHub User').split(' ');
            const firstName = names[0] || 'GitHub';
            const lastName = names.slice(1).join(' ') || 'User';
            const avatarUrl = profile.photos?.[0]?.value ?? null;

            const user = await findOrCreateOAuthUser({
              provider: 'github',
              providerId: profile.id,
              email,
              firstName,
              lastName,
              avatarUrl,
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        },
      ),
    );
  }

  // Google Strategy
  if (env.oauth.google.clientId && env.oauth.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.oauth.google.clientId,
          clientSecret: env.oauth.google.clientSecret,
          callbackURL: env.oauth.google.callbackUrl,
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value ?? null;
            const firstName = profile.name?.givenName || 'Google';
            const lastName = profile.name?.familyName || 'User';
            const avatarUrl = profile.photos?.[0]?.value ?? null;

            const user = await findOrCreateOAuthUser({
              provider: 'google',
              providerId: profile.id,
              email,
              firstName,
              lastName,
              avatarUrl,
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        },
      ),
    );
  }

  // Discord Strategy
  if (env.oauth.discord.clientId && env.oauth.discord.clientSecret) {
    passport.use(
      new DiscordStrategy(
        {
          clientID: env.oauth.discord.clientId,
          clientSecret: env.oauth.discord.clientSecret,
          callbackURL: env.oauth.discord.callbackUrl,
          scope: ['identify', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.email ?? null;
            const firstName = profile.username || 'Discord';
            const lastName = 'User';
            const avatarUrl = profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null;

            const user = await findOrCreateOAuthUser({
              provider: 'discord',
              providerId: profile.id,
              email,
              firstName,
              lastName,
              avatarUrl,
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        },
      ),
    );
  }
}
