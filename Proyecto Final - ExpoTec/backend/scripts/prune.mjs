import { createDatabase, transaction } from '../src/config/database.mjs';
import { createUploadsRepository } from '../src/repositories/uploads.mjs';
import { blobStorage } from '../src/services/uploads.mjs';

const pool = createDatabase();
try {
  await transaction(pool, async db => {
    await db.execute(`DELETE t FROM refresh_tokens t JOIN sessions s ON s.id = t.session_id
      WHERE s.expires_at < UTC_TIMESTAMP(3)`);
    await db.execute('DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP(3)');
    await db.execute('DELETE FROM auth_rate_limits WHERE expires_at < UTC_TIMESTAMP(3)');
    await db.execute('DELETE FROM social_flows WHERE expires_at < UTC_TIMESTAMP(3)');
    await db.execute('DELETE FROM password_resets WHERE expires_at < UTC_TIMESTAMP(3)');
  });
  if (blobStorage.enabled()) await createUploadsRepository(pool).prune(blobStorage.remove);
  console.log('Se limpiaron sesiones, límites y accesos vencidos, y fotos sin referencias de más de siete días.');
} catch (error) {
  console.error(`No se pudo limpiar (${error.code ?? 'DATABASE_ERROR'}).`);
  process.exitCode = 1;
} finally { await pool.end(); }
