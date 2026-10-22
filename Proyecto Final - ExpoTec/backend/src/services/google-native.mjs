import { createRemoteJWKSet, jwtVerify } from 'jose';
import { credentials } from '../validators/auth.mjs';
import { socialFailure } from './social-providers.mjs';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), { timeoutDuration: 10000 });

export function createNativeGoogleVerifier(config, keys = googleKeys) {
  return async (idToken, nonce) => {
    try {
      const audience = config.social?.providers.google?.clientId;
      if (!audience || typeof idToken !== 'string' || idToken.length > 8192 || !idToken) throw socialFailure();
      const { payload } = await jwtVerify(idToken, keys, {
        algorithms: ['RS256'],
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience,
        requiredClaims: ['exp', 'iat', 'sub', 'email', 'email_verified', 'nonce'],
        maxTokenAge: '10m',
        clockTolerance: 5,
      });
      if (payload.nonce !== nonce || payload.email_verified !== true ||
          typeof payload.sub !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub)) throw socialFailure();
      return { subject: payload.sub, email: credentials({ email: payload.email, password: 'validation' }).email };
    } catch { throw socialFailure(); }
  };
}
