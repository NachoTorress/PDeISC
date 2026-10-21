function integer(env, name, fallback, min, max) {
  const value = Number(env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`${name} debe ser un entero entre ${min} y ${max}.`);
  return value;
}

export function readConfig(env = process.env) {
  const production = env.NODE_ENV === 'production' || env.VERCEL === '1';
  const secret = env.JWT_SECRET ?? '';
  if (Buffer.byteLength(secret) < 32)
    throw new Error('Configurá JWT_SECRET con al menos 32 bytes aleatorios.');
  const origins = (env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!origins.length) throw new Error('Configurá CORS_ORIGINS con los orígenes del frontend.');
  for (const origin of origins) {
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol) ||
        (production && url.protocol !== 'https:'))
      throw new Error('CORS_ORIGINS debe contener orígenes exactos; en producción deben usar HTTPS.');
  }
  return {
    secret, origins, production, onVercel: env.VERCEL === '1',
    port: integer(env, 'PORT', 3001, 1, 65535),
    accessSeconds: 15 * 60,
    sessionSeconds: 30 * 24 * 60 * 60,
    issuer: 'expotec-api', audience: 'expotec-client',
    social: readSocialConfig(env, origins, production),
  };
}

export function readSocialConfig(env, origins, production) {
  const providers = {};
  for (const name of ['google', 'discord', 'github']) {
    const prefix = `SOCIAL_${name.toUpperCase()}`;
    const clientId = env[`${prefix}_CLIENT_ID`]?.trim(), clientSecret = env[`${prefix}_CLIENT_SECRET`]?.trim();
    if (Boolean(clientId) !== Boolean(clientSecret)) throw new Error(`Configurá el par ${prefix}_CLIENT_ID y ${prefix}_CLIENT_SECRET.`);
    if (clientId) providers[name] = { clientId, clientSecret };
  }
  if (!Object.keys(providers).length) return { providers };
  const webOrigin = env.SOCIAL_WEB_ORIGIN;
  for (const origin of [webOrigin]) {
    let url;
    try { url = new URL(origin); } catch { throw new Error('Configurá SOCIAL_WEB_ORIGIN con el origen exacto de la web.'); }
    if (url.origin !== origin || url.username || url.password ||
        (url.protocol !== 'https:' && !(url.protocol === 'http:' && !production && ['localhost', '127.0.0.1'].includes(url.hostname))))
      throw new Error('Los orígenes sociales deben usar HTTPS; solo localhost de desarrollo admite HTTP.');
  }
  if (!origins.includes(webOrigin)) throw new Error('SOCIAL_WEB_ORIGIN debe estar incluido en CORS_ORIGINS.');
  return { providers, webOrigin };
}

export function readDatabaseConfig(env = process.env) {
  for (const name of ['DB_HOST', 'DB_USER', 'DB_NAME'])
    if (!env[name]?.trim()) throw new Error(`Configurá ${name} en el backend.`);
  const ssl = env.DB_SSL ?? 'true';
  if (!['true', 'false'].includes(ssl)) throw new Error('DB_SSL debe ser true o false.');
  if (ssl === 'false' && (env.NODE_ENV === 'production' || env.VERCEL === '1'))
    throw new Error('La base debe usar TLS en producción.');
  return {
    host: env.DB_HOST, port: integer(env, 'DB_PORT', 4000, 1, 65535),
    user: env.DB_USER, password: env.DB_PASSWORD ?? '', database: env.DB_NAME,
    ...(ssl === 'true' ? { ssl: {
      rejectUnauthorized: true, minVersion: 'TLSv1.2',
      ...(env.DB_SSL_CA ? { ca: env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}),
    } } : {}),
    connectionLimit: integer(env, 'DB_POOL_LIMIT', 5, 2, 20),
    waitForConnections: true, queueLimit: 20, connectTimeout: 10000,
    idleTimeout: 5000, maxIdle: 2, timezone: 'Z', charset: 'utf8mb4',
    multipleStatements: false,
  };
}
