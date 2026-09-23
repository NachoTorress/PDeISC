import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, '../export_mysql.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Copiar SQL para Aiven</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #0f172a; color: #f8fafc; }
    textarea { width: 100%; height: 400px; background: #1e293b; color: #38bdf8; border: 1px solid #475569; padding: 10px; border-radius: 8px; font-size: 14px; }
    button { background: #38bdf8; color: #0f172a; font-weight: bold; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h2>Script SQL listo para importar en Aiven MySQL (con admin/nacho87)</h2>
  <button onclick="navigator.clipboard.writeText(document.getElementById('sql').value); alert('¡Copiado!');">Copiar todo el SQL</button>
  <textarea id="sql" readonly>${sqlScript.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
</body>
</html>
`;

console.log("=================================================");
console.log("SQL listo con contraseña admin 'nacho87' en:");
console.log(sqlFilePath);
console.log("=================================================");
