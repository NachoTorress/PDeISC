/**
 * Express Server for Portfolio REST API.
 * Uses ES module syntax (import/export), dynamic PORT configuration via environment variables,
 * parameterized queries, bcrypt security, and strict JSON API contracts.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

initDatabase();

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
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

app.get('/api/skills', (_req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM skill_categories ORDER BY id ASC').all();
    const result = categories.map((cat) => {
      const skills = db.prepare('SELECT * FROM skills WHERE category_id = ? ORDER BY id ASC').all(cat.id);
      return { ...cat, skills };
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/skills', (req, res) => {
  try {
    const { category_id, name, icon } = req.body;
    if (!category_id || !name) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }
    const stmt = db.prepare('INSERT INTO skills (category_id, name, icon) VALUES (?, ?, ?)');
    const info = stmt.run(category_id, name, icon || 'code');
    const created = db.prepare('SELECT * FROM skills WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/skills/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/projects', (_req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
    const formatted = projects.map((p) => ({
      ...p,
      tags: p.tags ? p.tags.split(',') : [],
    }));
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { title, description, accent, github_url, tags } = req.body;
    if (!title || !description || !accent) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }
    const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || '';
    const stmt = db.prepare(
      'INSERT INTO projects (title, description, accent, github_url, tags) VALUES (?, ?, ?, ?, ?)'
    );
    const info = stmt.run(title, description, accent, github_url || null, tagsStr);
    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ ...created, tags: created.tags ? created.tags.split(',') : [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/experiences', (_req, res) => {
  try {
    const list = db.prepare('SELECT * FROM experiences ORDER BY id ASC').all();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/experiences', (req, res) => {
  try {
    const { type, title, description, meta } = req.body;
    if (!type || !title || !description) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }
    const stmt = db.prepare('INSERT INTO experiences (type, title, description, meta) VALUES (?, ?, ?, ?)');
    const info = stmt.run(type, title, description, meta || '');
    const created = db.prepare('SELECT * FROM experiences WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/experiences/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM experiences WHERE id = ?').run(id);
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/achievements', (_req, res) => {
  try {
    const list = db.prepare('SELECT * FROM achievements ORDER BY id ASC').all();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/achievements', (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }
    const stmt = db.prepare('INSERT INTO achievements (title, description) VALUES (?, ?)');
    const info = stmt.run(title, description);
    const created = db.prepare('SELECT * FROM achievements WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/achievements/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM achievements WHERE id = ?').run(id);
    return res.json({ success: true, id: Number(id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/download/log', (req, res) => {
  try {
    const { fileName } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const stmt = db.prepare('INSERT INTO download_logs (file_name, ip_address) VALUES (?, ?)');
    stmt.run(fileName || 'CV_Portfolio.pdf', String(ip));
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
