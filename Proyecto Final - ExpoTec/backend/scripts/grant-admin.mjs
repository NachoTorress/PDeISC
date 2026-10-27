/** Asigna el rol de administrador a una cuenta registrada (`npm run admin:grant -- correo`). */
import { createDatabase, transaction } from '../src/config/database.mjs';
import { credentials } from '../src/validators/auth.mjs';

const email = credentials({ email: process.argv[2], password: 'unused' }).email;
const pool = createDatabase();
try {
  await transaction(pool, async db => {
    await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
    const [users] = await db.execute('SELECT id FROM users WHERE email = ? AND active = TRUE FOR UPDATE', [email]);
    if (!users.length) throw new Error('USER_NOT_FOUND');
    await db.execute("INSERT IGNORE INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [users[0].id]);
  });
  console.log('Permiso de administrador asignado a la cuenta indicada.');
} catch (error) {
  console.error(`No se pudo asignar el permiso (${error.code ?? (error.message === 'USER_NOT_FOUND' ? 'USER_NOT_FOUND' : 'DATABASE_ERROR')}). Registrá primero la cuenta y revisá la conexión.`);
  process.exitCode = 1;
} finally { await pool.end(); }
