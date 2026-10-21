import { createHash } from 'node:crypto';
import { HttpError } from '../lib/errors.mjs';
import { credentials } from '../validators/auth.mjs';

export const providerNames = { google: 'Google', discord: 'Discord', github: 'GitHub' };
const definitions = {
  google: { authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', scope: 'openid email profile', pkce: true },
  discord: { authorize: 'https://discord.com/oauth2/authorize', token: 'https://discord.com/api/oauth2/token', scope: 'identify email', pkce: false },
  github: { authorize: 'https://github.com/login/oauth/authorize', token: 'https://github.com/login/oauth/access_token', scope: 'user:email', pkce: true },
};
export const socialFailure = () => new HttpError(400, 'SOCIAL_FAILED', 'No pudimos verificar el acceso. Volvé a iniciarlo desde Mi cuenta.');
export function socialCallback(config, provider) {
  return `${config.social.webOrigin}/api/auth/social/${provider}/callback`;
}
export function authorizationUrl(config, provider, state, verifier) {
  const definition = definitions[provider], app = config.social.providers[provider];
  const url = new URL(definition.authorize);
  url.search = new URLSearchParams({ client_id: app.clientId, redirect_uri: socialCallback(config, provider), response_type: 'code', scope: definition.scope, state,
    ...(definition.pkce ? { code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' } : {}) }).toString();
  return url.href;
}

export function createProviderExchange(config, request = fetch) {
  async function json(url, options = {}) {
    const result = await request(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!result.ok) throw socialFailure();
    return result.json();
  }
  return async (provider, code, verifier) => {
    try {
      const definition = definitions[provider], app = config.social.providers[provider];
      const token = await json(definition.token, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: app.clientId, client_secret: app.clientSecret, code, grant_type: 'authorization_code', redirect_uri: socialCallback(config, provider),
          ...(definition.pkce ? { code_verifier: verifier } : {}) }),
      });
      if (typeof token.access_token !== 'string' || !token.access_token || token.access_token.length > 4096 || token.token_type?.toLowerCase() !== 'bearer') throw socialFailure();
      const headers = { Accept: 'application/json', Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'ExpoTec', ...(provider === 'github' ? { 'X-GitHub-Api-Version': '2022-11-28' } : {}) };
      let subject, email;
      if (provider === 'google') {
        const profile = await json('https://openidconnect.googleapis.com/v1/userinfo', { headers });
        if (profile.email_verified !== true) throw socialFailure();
        subject = profile.sub; email = profile.email;
      } else if (provider === 'discord') {
        const profile = await json('https://discord.com/api/v10/users/@me', { headers });
        if (profile.verified !== true) throw socialFailure();
        subject = profile.id; email = profile.email;
      } else {
        const profile = await json('https://api.github.com/user', { headers });
        if (!Number.isSafeInteger(profile.id) || profile.id <= 0) throw socialFailure();
        const emails = await json('https://api.github.com/user/emails', { headers });
        email = Array.isArray(emails) ? emails.find(entry => entry.primary === true && entry.verified === true)?.email : undefined;
        subject = String(profile.id);
      }
      if (typeof subject !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(subject)) throw socialFailure();
      email = credentials({ email, password: 'validation' }).email;
      return { subject, email };
    } catch { throw socialFailure(); }
  };
}
