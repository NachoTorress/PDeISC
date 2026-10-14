import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function migrate(pool) {
  await pool.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    checksum CHAR(64) CHARACTER SET ascii NOT NULL,
    applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB`);
  const folder = new URL('../sql/', import.meta.url);
  const files = (await readdir(folder)).filter(name => /^\d+_[a-z_]+\.sql$/.test(name)).sort();
  for (const name of files) {
    const sql = await readFile(new URL(name, folder), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const [applied] = await pool.execute('SELECT checksum FROM schema_migrations WHERE name = ?', [name]);
    if (applied.length) {
      if (applied[0].checksum !== checksum) throw new Error(`La migración aplicada ${name} cambió. Creá otra migración.`);
      continue;
    }
    // Los archivos de esta etapa contienen sentencias simples, sin rutinas ni punto y coma en textos.
    for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await pool.query(statement);
    await pool.execute('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [name, checksum]);
  }
  return files;
}
