import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter-oauth2';
import { Strategy as TwitchStrategy } from 'passport-twitch-new';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
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

  // Twitter / X Strategy (OAuth 2.0 API v2)
  if (env.oauth.twitter.clientId && env.oauth.twitter.clientSecret) {
    passport.use(
      'twitter',
      new OAuth2Strategy(
        {
          authorizationURL: 'https://twitter.com/i/oauth2/authorize',
          tokenURL: 'https://api.twitter.com/2/oauth2/token',
          clientID: env.oauth.twitter.clientId,
          clientSecret: env.oauth.twitter.clientSecret,
          callbackURL: env.oauth.twitter.callbackUrl,
          scope: ['users.read', 'tweet.read'],
          scopeSeparator: ' ',
          pkce: true,
          state: true,
        },
        async (accessToken, _refreshToken, _params, done) => {
          try {
            const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            const result = await response.json();
            const twitterUser = result.data;
            if (!twitterUser) {
              return done(new Error('No se pudo obtener el perfil de Twitter/X'), null);
            }

            const names = (twitterUser.name || twitterUser.username || 'X User').split(' ');
            const firstName = names[0] || 'X';
            const lastName = names.slice(1).join(' ') || 'User';
            const avatarUrl = twitterUser.profile_image_url ?? null;

            const user = await findOrCreateOAuthUser({
              provider: 'twitter',
              providerId: twitterUser.id,
              email: null,
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

  // Twitch Strategy
  if (env.oauth.twitch.clientId && env.oauth.twitch.clientSecret) {
    passport.use(
      new TwitchStrategy(
        {
          clientID: env.oauth.twitch.clientId,
          clientSecret: env.oauth.twitch.clientSecret,
          callbackURL: env.oauth.twitch.callbackUrl,
          scope: 'user:read:email',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.email ?? profile.emails?.[0]?.value ?? null;
            const firstName = profile.display_name || profile.username || 'Twitch';
            const lastName = 'User';
            const avatarUrl = profile.profile_image_url ?? profile.photos?.[0]?.value ?? null;

            const user = await findOrCreateOAuthUser({
              provider: 'twitch',
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

  // Facebook Strategy
  if (env.oauth.facebook.clientId && env.oauth.facebook.clientSecret) {
    passport.use(
      'facebook',
      new FacebookStrategy(
        {
          clientID: env.oauth.facebook.clientId,
          clientSecret: env.oauth.facebook.clientSecret,
          callbackURL: env.oauth.facebook.callbackUrl,
          profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value ?? null;
            const firstName = profile.name?.givenName || profile.displayName || 'Facebook';
            const lastName = profile.name?.familyName || 'User';
            const avatarUrl = profile.photos?.[0]?.value ?? null;

            const user = await findOrCreateOAuthUser({
              provider: 'facebook',
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

  // Meta Strategy (using Facebook Strategy protocol)
  if (env.oauth.meta.clientId && env.oauth.meta.clientSecret) {
    passport.use(
      'meta',
      new FacebookStrategy(
        {
          clientID: env.oauth.meta.clientId,
          clientSecret: env.oauth.meta.clientSecret,
          callbackURL: env.oauth.meta.callbackUrl,
          profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value ?? null;
            const firstName = profile.name?.givenName || profile.displayName || 'Meta';
            const lastName = profile.name?.familyName || 'User';
            const avatarUrl = profile.photos?.[0]?.value ?? null;

            const user = await findOrCreateOAuthUser({
              provider: 'meta',
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
