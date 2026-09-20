/**
 * Express Server for Portfolio REST API.
 * Connected to Neon Serverless Postgres with bcrypt authentication and secure environment variables.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { isPostgres, sqlClient, initDatabase } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database schema and seeds
initDatabase().catch((err) => console.error('Error inicializando DB:', err));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
    }

    let user = null;
    if (isPostgres) {
      const rows = await sqlClient`SELECT * FROM admin_users WHERE username = ${username}`;
      user = rows[0];
    } else {
      user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    return res.json({ success: true, message: 'Autenticación exitosa', token: 'admin-auth-token-valid' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

app.get('/api/skills', async (_req, res) => {
  try {
    if (isPostgres) {
      const categories = await sqlClient`SELECT * FROM skill_categories ORDER BY id ASC`;
      const result = await Promise.all(
        categories.map(async (cat) => {
          const skills = await sqlClient`SELECT * FROM skills WHERE category_id = ${cat.id} ORDER BY id ASC`;
          return { ...cat, skills };
        })
      );
      return res.json(result);
    } else {
      const categories = db.prepare('SELECT * FROM skill_categories ORDER BY id ASC').all();
      const result = categories.map((cat) => {
        const skills = db.prepare('SELECT * FROM skills WHERE category_id = ? ORDER BY id ASC').all(cat.id);
        return { ...cat, skills };
      });
      return res.json(result);
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/skills', async (req, res) => {
  try {
    const { category_id, name, icon } = req.body;
    if (!category_id || !name) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (isPostgres) {
      const rows = await sqlClient`
        INSERT INTO skills (category_id, name, icon) VALUES (${category_id}, ${name}, ${icon || 'code'}) RETURNING *
      `;
      return res.status(201).json(rows[0]);
    } else {
      const stmt = db.prepare('INSERT INTO skills (category_id, name, icon) VALUES (?, ?, ?)');
      const info = stmt.run(category_id, name, icon || 'code');
      const created = db.prepare('SELECT * FROM skills WHERE id = ?').get(info.lastInsertRowid);
      return res.status(201).json(created);
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isPostgres) {
      await sqlClient`DELETE FROM skills WHERE id = ${id}`;
    } else {
      db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    }
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/projects', async (_req, res) => {
  try {
    let projects = [];
    if (isPostgres) {
      projects = await sqlClient`SELECT * FROM projects ORDER BY id DESC`;
    } else {
      projects = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
    }
    const formatted = projects.map((p) => ({
      ...p,
      githubUrl: p.github_url || p.githubUrl,
      tags: p.tags ? p.tags.split(',') : [],
    }));
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, accent, github_url, tags } = req.body;
    if (!title || !description || !accent) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }
    const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || '';

    if (isPostgres) {
      const rows = await sqlClient`
        INSERT INTO projects (title, description, accent, github_url, tags)
        VALUES (${title}, ${description}, ${accent}, ${github_url || null}, ${tagsStr})
        RETURNING *
      `;
      const created = rows[0];
      return res.status(201).json({ ...created, githubUrl: created.github_url, tags: created.tags ? created.tags.split(',') : [] });
    } else {
      const stmt = db.prepare(
        'INSERT INTO projects (title, description, accent, github_url, tags) VALUES (?, ?, ?, ?, ?)'
      );
      const info = stmt.run(title, description, accent, github_url || null, tagsStr);
      const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
      return res.status(201).json({ ...created, githubUrl: created.github_url, tags: created.tags ? created.tags.split(',') : [] });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isPostgres) {
      await sqlClient`DELETE FROM projects WHERE id = ${id}`;
    } else {
      db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    }
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/experiences', async (_req, res) => {
  try {
    let list = [];
    if (isPostgres) {
      list = await sqlClient`SELECT * FROM experiences ORDER BY id ASC`;
    } else {
      list = db.prepare('SELECT * FROM experiences ORDER BY id ASC').all();
    }
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/experiences', async (req, res) => {
  try {
    const { type, title, description, meta } = req.body;
    if (!type || !title || !description) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (isPostgres) {
      const rows = await sqlClient`
        INSERT INTO experiences (type, title, description, meta)
        VALUES (${type}, ${title}, ${description}, ${meta || ''})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    } else {
      const stmt = db.prepare('INSERT INTO experiences (type, title, description, meta) VALUES (?, ?, ?, ?)');
      const info = stmt.run(type, title, description, meta || '');
      const created = db.prepare('SELECT * FROM experiences WHERE id = ?').get(info.lastInsertRowid);
      return res.status(201).json(created);
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isPostgres) {
      await sqlClient`DELETE FROM experiences WHERE id = ${id}`;
    } else {
      db.prepare('DELETE FROM experiences WHERE id = ?').run(id);
    }
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/achievements', async (_req, res) => {
  try {
    let list = [];
    if (isPostgres) {
      list = await sqlClient`SELECT * FROM achievements ORDER BY id ASC`;
    } else {
      list = db.prepare('SELECT * FROM achievements ORDER BY id ASC').all();
    }
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/achievements', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (isPostgres) {
      const rows = await sqlClient`
        INSERT INTO achievements (title, description) VALUES (${title}, ${description}) RETURNING *
      `;
      return res.status(201).json(rows[0]);
    } else {
      const stmt = db.prepare('INSERT INTO achievements (title, description) VALUES (?, ?, ?)');
      const info = stmt.run(title, description);
      const created = db.prepare('SELECT * FROM achievements WHERE id = ?').get(info.lastInsertRowid);
      return res.status(201).json(created);
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/achievements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isPostgres) {
      await sqlClient`DELETE FROM achievements WHERE id = ${id}`;
    } else {
      db.prepare('DELETE FROM achievements WHERE id = ?').run(id);
    }
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/download/log', async (req, res) => {
  try {
    const { fileName } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (isPostgres) {
      await sqlClient`
        INSERT INTO download_logs (file_name, ip_address) VALUES (${fileName || 'CV_Portfolio.pdf'}, ${String(ip)})
      `;
    } else {
      const stmt = db.prepare('INSERT INTO download_logs (file_name, ip_address) VALUES (?, ?)');
      stmt.run(fileName || 'CV_Portfolio.pdf', String(ip));
    }
    return res.json({ success: true, message: 'Descarga registrada correctamente' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`[Backend Portfolio] Servidor ejecutándose en el puerto ${PORT}`);
  });
}

export default app;
