import { Router } from 'express';
import { pool, transaction } from './db.js';
import { config } from './config.js';
import { digest, pkceChallenge, randomToken } from './security.js';
import { findByEmail, session } from './users.js';
import { errorFields, logger } from './logger.js';

export const oauth = Router();
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const providers = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile'
  },
  discord: {
    authorize: 'https://discord.com/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    scope: 'identify email'
  },
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email'
  }
};

const appLink = (params, target = 'native') => target === 'web'
  ? `${config.webBaseUrl}/?${new URLSearchParams(params)}`
  : `${config.scheme}://auth?${new URLSearchParams(params)}`;
const callbackUrl = (provider) => `${config.baseUrl}/auth/oauth/${provider}/callback`;
const client = (provider) => ({
  id: process.env[`${provider.toUpperCase()}_CLIENT_ID`],
  secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]
});

function authorizationUrl(provider, clientId, state, verifier) {
  const url = new URL(providers[provider].authorize);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl(provider));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', providers[provider].scope);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', pkceChallenge(verifier));
  url.searchParams.set('code_challenge_method', 'S256');
  if (provider === 'google') url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok || value.error) {
    throw Object.assign(new Error('El proveedor no pudo completar el acceso'), { providerStatus: response.status });
  }
  return value;
}

async function identity(provider, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': 'acceso-expo' };
  if (provider === 'google') {
    const data = await fetchJson('https://openidconnect.googleapis.com/v1/userinfo', { headers });
    return { id: data.sub, email: data.email, verified: data.email_verified === true, name: data.name };
  }
  if (provider === 'discord') {
    const data = await fetchJson('https://discord.com/api/users/@me', { headers });
    return { id: data.id, email: data.email, verified: data.verified === true, name: data.global_name || data.username };
  }
  const [data, emails] = await Promise.all([
    fetchJson('https://api.github.com/user', { headers }),
    fetchJson('https://api.github.com/user/emails', { headers })
  ]);
  const selected = emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified);
  return { id: String(data.id), email: selected?.email, verified: Boolean(selected), name: data.name || data.login };
}

async function linkIdentity(provider, profile) {
  if (!profile.verified || !profile.email) throw new Error('El proveedor debe entregar un correo verificado');
  const email = profile.email.trim().toLowerCase();
  return transaction(async (db) => {
    const [existing] = await db.execute('SELECT user_id FROM oauth_identities WHERE provider = ? AND provider_user_id = ? FOR UPDATE', [provider, profile.id]);
    if (existing[0]) {
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [existing[0].user_id]);
      return rows[0];
    }
    let user = await findByEmail(db, email, true);
    if (!user) {
      const [result] = await db.execute('INSERT INTO users (email, display_name, email_verified_at) VALUES (?, ?, NOW())', [email, profile.name || email.split('@')[0]]);
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = rows[0];
    } else if (!user.email_verified_at) {
      // Una cuenta local sin verificar no debe conservar contraseña tras la prueba OAuth.
      await db.execute('UPDATE users SET password_hash = NULL, email_verified_at = NOW() WHERE id = ?', [user.id]);
      await db.execute('DELETE FROM user_security_answers WHERE user_id = ?', [user.id]);
      user.password_hash = null;
    }
    await db.execute('INSERT INTO oauth_identities (user_id, provider, provider_user_id) VALUES (?, ?, ?)', [user.id, provider, profile.id]);
    return user;
  });
}

// OAuth exige redirecciones GET en el navegador; la API de la app usa POST.
oauth.get('/:provider/start', route(async (req, res) => {
  const provider = req.params.provider;
  if (!Object.hasOwn(providers, provider)) return res.status(404).end();
  const target = req.query.target === 'web' ? 'web' : 'native';
  if (target === 'web' && !config.webBaseUrl) return res.status(503).send('Configurá WEB_BASE_URL para usar OAuth desde la web.');
  const credentials = client(provider);
  if (!credentials.id || !credentials.secret) return res.status(503).send('Proveedor sin configurar');
  const state = randomToken();
  const verifier = randomToken();
  await pool.execute('INSERT INTO oauth_states (state_hash, provider, return_target, code_verifier, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))', [digest(state), provider, target, verifier]);
  logger.info('oauth.started', { requestId: req.requestId, provider, target });
  res.redirect(authorizationUrl(provider, credentials.id, state, verifier));
}));

// Expo Go no registra el esquema de esta app. El navegador vuelve a la API y
// la app consulta el resultado con un secreto que nunca se incluye en la URL OAuth.
oauth.post('/:provider/device-start', route(async (req, res) => {
  const provider = req.params.provider;
  if (!Object.hasOwn(providers, provider)) return res.status(404).end();
  const credentials = client(provider);
  if (!credentials.id || !credentials.secret) return res.status(503).json({ error: 'Proveedor sin configurar' });
  const state = randomToken();
  const verifier = randomToken();
  const pollToken = randomToken();
  const stateHash = digest(state);
  await transaction(async (db) => {
    await db.execute('DELETE FROM oauth_device_flows WHERE expires_at <= NOW()');
    await db.execute('DELETE FROM oauth_states WHERE expires_at <= NOW()');
    await db.execute('INSERT INTO oauth_states (state_hash, provider, return_target, code_verifier, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))', [stateHash, provider, 'native', verifier]);
    await db.execute('INSERT INTO oauth_device_flows (state_hash, poll_token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))', [stateHash, digest(pollToken)]);
  });
  logger.info('oauth.started', { requestId: req.requestId, provider, target: 'expo-go' });
  res.set('Cache-Control', 'no-store').json({ url: authorizationUrl(provider, credentials.id, state, verifier), pollToken });
}));

oauth.post('/device-poll', route(async (req, res) => {
  const pollToken = req.body?.pollToken;
  if (typeof pollToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(pollToken)) {
    return res.status(422).json({ error: 'Solicitud inválida' });
  }
  const result = await transaction(async (db) => {
    const [flows] = await db.execute('SELECT state_hash, user_id, error_message FROM oauth_device_flows WHERE poll_token_hash = ? AND expires_at > NOW() FOR UPDATE', [digest(pollToken)]);
    const flow = flows[0];
    if (!flow) return { status: 'expired' };
    if (!flow.user_id && !flow.error_message) return { status: 'pending' };
    await db.execute('DELETE FROM oauth_device_flows WHERE state_hash = ?', [flow.state_hash]);
    if (flow.error_message) return { status: 'error', error: flow.error_message };
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [flow.user_id]);
    return users[0] ? { status: 'complete', user: users[0] } : { status: 'expired' };
  });
  res.set('Cache-Control', 'no-store');
  if (result.status === 'expired') return res.status(410).json({ error: 'El acceso venció. Volvé a intentarlo.' });
  if (result.status === 'error') return res.status(400).json({ error: result.error });
  if (result.status === 'pending') return res.json({ status: 'pending' });
  logger.info('oauth.session_issued', { requestId: req.requestId, target: 'expo-go' });
  res.json({ status: 'complete', session: await session(result.user) });
}));

oauth.get('/:provider/callback', async (req, res) => {
  const provider = req.params.provider;
  if (!Object.hasOwn(providers, provider)) return res.status(404).end();
  let target = 'native';
  let deviceFlow = false;
  try {
    if (!req.query.state) throw new Error('Acceso cancelado o inválido');
    const stateHash = digest(String(req.query.state));
    const [states] = await pool.execute('SELECT * FROM oauth_states WHERE state_hash = ? AND provider = ? AND expires_at > NOW()', [stateHash, provider]);
    if (!states[0]) throw new Error('La autorización venció. Intentá de nuevo.');
    target = states[0].return_target;
    if (target === 'web' && !config.webBaseUrl) return res.status(503).send('Configurá WEB_BASE_URL para usar OAuth desde la web.');
    const [flows] = await pool.execute('SELECT state_hash FROM oauth_device_flows WHERE state_hash = ? AND expires_at > NOW()', [stateHash]);
    deviceFlow = Boolean(flows[0]);
    const [deleted] = await pool.execute('DELETE FROM oauth_states WHERE state_hash = ?', [stateHash]);
    if (deleted.affectedRows !== 1) throw new Error('La autorización ya fue utilizada.');
    if (req.query.error || !req.query.code) throw new Error('Acceso cancelado o inválido');
    const credentials = client(provider);
    const body = new URLSearchParams({
      client_id: credentials.id, client_secret: credentials.secret,
      code: String(req.query.code), redirect_uri: callbackUrl(provider),
      grant_type: 'authorization_code', code_verifier: states[0].code_verifier
    });
    const tokens = await fetchJson(providers[provider].token, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body
    });
    if (!tokens.access_token) throw new Error('No se recibió acceso del proveedor');
    const user = await linkIdentity(provider, await identity(provider, tokens.access_token));
    if (deviceFlow) {
      await pool.execute('UPDATE oauth_device_flows SET user_id = ? WHERE state_hash = ? AND expires_at > NOW()', [user.id, stateHash]);
      logger.info('oauth.callback.succeeded', { requestId: req.requestId, provider, target: 'expo-go' });
      return res.set('Cache-Control', 'no-store').type('text/plain').send('Acceso completado. Volvé a Expo Go para continuar.');
    }
    const ticket = randomToken();
    await pool.execute('INSERT INTO login_tickets (ticket_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE))', [digest(ticket), user.id]);
    logger.info('oauth.callback.succeeded', { requestId: req.requestId, provider, target });
    res.redirect(appLink({ ticket }, target));
  } catch (error) {
    logger.warn('oauth.callback.failed', { requestId: req.requestId, provider, target: deviceFlow ? 'expo-go' : target, ...errorFields(error) });
    if (deviceFlow) {
      const message = String(error.message || 'No se pudo iniciar sesión').slice(0, 255);
      try {
        await pool.execute('UPDATE oauth_device_flows SET error_message = ? WHERE state_hash = ?', [message, digest(String(req.query.state))]);
      } catch (failure) {
        logger.error('oauth.flow_update_failed', { requestId: req.requestId, provider, ...errorFields(failure) });
      }
      return res.set('Cache-Control', 'no-store').type('text/plain').send('No se pudo completar el acceso. Volvé a Expo Go e intentá de nuevo.');
    }
    res.redirect(appLink({ error: error.message || 'No se pudo iniciar sesión' }, target));
  }
});

oauth.post('/redeem', async (req, res, next) => {
  try {
    if (typeof req.body.ticket !== 'string' || req.body.ticket.length > 100) throw Object.assign(new Error('Ticket inválido'), { status: 422 });
    const user = await transaction(async (db) => {
      const ticketHash = digest(req.body.ticket);
      const [tickets] = await db.execute('SELECT * FROM login_tickets WHERE ticket_hash = ? AND expires_at > NOW() FOR UPDATE', [ticketHash]);
      if (!tickets[0]) throw Object.assign(new Error('El enlace venció. Volvé a ingresar.'), { status: 401 });
      await db.execute('DELETE FROM login_tickets WHERE ticket_hash = ?', [ticketHash]);
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [tickets[0].user_id]);
      return rows[0];
    });
    res.json(await session(user));
  } catch (error) { next(error); }
});
