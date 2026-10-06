import readline from 'node:readline';
import { pool } from '../src/db.js';
import { hashPassword } from '../src/security.js';

const adminEmail = 'nacho@admin.local';

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(prompt);

    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        process.stdin.off('keypress', onKeypress);
        process.stdout.write('\n');
        reject(new Error('Cambio de contraseña cancelado.'));
      } else if (key.name === 'return' || key.name === 'enter') {
        process.stdin.off('keypress', onKeypress);
        process.stdout.write('\n');
        resolve(value);
      } else if (key.name === 'backspace') {
        value = value.slice(0, -1);
      } else if (character && !key.ctrl && !key.meta && !/[\x00-\x1f\x7f]/.test(character)) {
        value += character;
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

async function main() {
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? AND role_id = 1 LIMIT 1', [adminEmail]);
  const admin = rows[0];
  if (!admin) throw new Error(`No existe la cuenta administradora ${adminEmail}.`);
  if (process.argv.includes('--check')) {
    console.log(`Cuenta administradora encontrada: ${adminEmail}.`);
    return;
  }
  if (!process.stdin.isTTY) throw new Error('Ejecutá este comando en una terminal interactiva.');

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let password;
  try {
    while (true) {
      const first = await readHidden('Nueva contraseña (entrada oculta): ');
      if (first.length < 8 || first.length > 128 || !/[A-Za-z]/.test(first) || !/\d/.test(first)) {
        console.log('Usá entre 8 y 128 caracteres, con letras y números.');
        continue;
      }
      const confirmation = await readHidden('Repetí la contraseña (entrada oculta): ');
      if (first !== confirmation) {
        console.log('Las contraseñas no coinciden. Intentá de nuevo.');
        continue;
      }
      password = first;
      break;
    }
  } finally {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  const hash = await hashPassword(password);
  const [result] = await pool.execute('UPDATE users SET password_hash = ?, username = NULL WHERE id = ? AND role_id = 1', [hash, admin.id]);
  if (result.affectedRows !== 1) throw new Error('No se pudo actualizar la cuenta administradora.');
  console.log(`Contraseña actualizada. Ingresá únicamente con ${adminEmail}.`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
