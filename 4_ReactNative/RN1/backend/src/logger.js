import { randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const minimum = levels[process.env.LOG_LEVEL?.toLowerCase()] ?? levels.info;
const backendRoot = fileURLToPath(new URL('../', import.meta.url));
const directory = path.resolve(backendRoot, process.env.LOG_DIR || 'logs');
const fieldsAllowed = new Set([
  'requestId', 'method', 'path', 'status', 'durationMs', 'aborted',
  'provider', 'target', 'reason', 'errorName', 'errorMessage',
  'errorCode', 'causeCode', 'providerStatus', 'port', 'signal'
]);

let fileStream;
let fileDate;
let fileDisabled = false;

try {
  mkdirSync(directory, { recursive: true });
} catch (error) {
  fileDisabled = true;
  process.stderr.write(`No se pudo crear el directorio de logs: ${error.code || 'error'}\n`);
}

function cleanText(value) {
  return String(value)
    .replace(/(https?:\/\/[^\s?]+)\?[^\s]*/gi, '$1?[oculto]')
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/-]+/gi, '$1[oculto]')
    .replace(/\b(password|client_secret|access_token|refresh_token|id_token|code|state|ticket|pollToken)=([^&\s]+)/gi, '$1=[oculto]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[correo oculto]')
    .slice(0, 500);
}

function safeFields(fields) {
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!fieldsAllowed.has(key) || value === undefined || value === null) continue;
    if (typeof value === 'number' || typeof value === 'boolean') result[key] = value;
    else result[key] = cleanText(value);
  }
  return result;
}

function currentFile(date) {
  if (fileDisabled) return null;
  const day = date.slice(0, 10);
  if (fileStream && fileDate === day) return fileStream;
  const previous = fileStream;
  fileDate = day;
  fileStream = createWriteStream(path.join(directory, `${day}.jsonl`), { flags: 'a' });
  fileStream.on('error', (error) => {
    fileDisabled = true;
    process.stderr.write(`No se pudo escribir el archivo de logs: ${error.code || 'error'}\n`);
  });
  previous?.end();
  return fileStream;
}

function write(level, event, fields = {}) {
  if (levels[level] < minimum) return;
  const time = new Date().toISOString();
  const line = JSON.stringify({ time, level, event: cleanText(event), ...safeFields(fields) }) + '\n';
  (levels[level] >= levels.warn ? process.stderr : process.stdout).write(line);
  try {
    currentFile(time)?.write(line);
  } catch (error) {
    fileDisabled = true;
    process.stderr.write(`No se pudo escribir el archivo de logs: ${error.code || 'error'}\n`);
  }
}

export const logger = Object.fromEntries(Object.keys(levels).map((level) => [
  level, (event, fields) => write(level, event, fields)
]));

export function errorFields(error) {
  const cause = error?.cause;
  return {
    errorName: error?.name || 'Error',
    errorMessage: error?.message || 'Error sin detalle',
    errorCode: error?.code,
    causeCode: cause?.code || cause?.name,
    providerStatus: error?.providerStatus
  };
}

export function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const started = process.hrtime.bigint();
  const method = req.method;
  const requestPath = req.path;
  let recorded = false;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  function record() {
    if (recorded) return;
    recorded = true;
    logger[requestPath === '/auth/oauth/device-poll' && res.statusCode === 200 ? 'debug' : 'info']('http.request', {
      requestId, method, path: requestPath, status: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1_000_000),
      aborted: !res.writableEnded
    });
  }
  res.once('finish', record);
  res.once('close', record);
  next();
}

export function closeLogs() {
  return new Promise((resolve) => {
    if (!fileStream) return resolve();
    fileStream.end(resolve);
    fileStream = null;
  });
}
