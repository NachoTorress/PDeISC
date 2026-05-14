/**
 * server.js
 * Servidor Express para el filtro de números.
 * Gestiona subida de archivos, procesamiento y descarga de resultados.
 */

import express      from 'express';
import multer       from 'multer';
import path         from 'path';
import fs           from 'fs';
import { fileURLToPath } from 'url';
import { processFileContent } from './modules/fileProcessor.js';

// ─── Paths ────────────────────────────────────────────────────────────────────
const __filename    = fileURLToPath(import.meta.url);
const __dirname     = path.dirname(__filename);

// ─── Constantes ───────────────────────────────────────────────────────────────
const PORT              = 3001;
const MAX_FILE_SIZE_MB  = 5;
const MAX_FILE_SIZE_B   = MAX_FILE_SIZE_MB * 1024 * 1024;
const DOWNLOAD_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutos

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── Directorios estáticos ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'pages')));
app.use('/styles',    express.static(path.join(__dirname, 'styles')));
app.use('/scripts',   express.static(path.join(__dirname, 'scripts')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// ─── Directorio de descargas ──────────────────────────────────────────────────
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// ─── Limpieza periódica de archivos viejos (cada 10 min) ─────────────────────
/**
 * Elimina archivos en /downloads con más de DOWNLOAD_MAX_AGE_MS de antigüedad.
 */
function cleanOldDownloads() {
    try {
        const files = fs.readdirSync(downloadsDir);
        const now   = Date.now();

        for (const file of files) {
            const filePath = path.join(downloadsDir, file);
            const stat     = fs.statSync(filePath);
            const age      = now - stat.mtimeMs;

            if (age > DOWNLOAD_MAX_AGE_MS) {
                fs.unlinkSync(filePath);
                console.log(`[cleanup] Eliminado: ${file}`);
            }
        }
    } catch (err) {
        console.error('[cleanup] Error al limpiar downloads:', err.message);
    }
}

setInterval(cleanOldDownloads, DOWNLOAD_MAX_AGE_MS);

// ─── Multer ───────────────────────────────────────────────────────────────────

/** Almacenamiento temporal en disco */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, downloadsDir),
    filename:    (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext    = path.extname(file.originalname);
        cb(null, `upload_${unique}${ext}`);
    }
});

/** Filtro: sólo .txt */
const fileFilter = (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (ext === '.txt' || mime === 'text/plain') {
        cb(null, true);
    } else {
        cb(new Error('INVALID_TYPE'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_B }
});

// ─── Rutas ────────────────────────────────────────────────────────────────────

/**
 * POST /upload
 * Recibe un archivo .txt, lo procesa y devuelve los resultados en JSON.
 */
app.post('/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {

        // Error de multer (tipo o tamaño)
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error:   `El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB.`
                });
            }
            if (err.message === 'INVALID_TYPE') {
                return res.status(400).json({
                    success: false,
                    error:   'Solo se permiten archivos .txt.'
                });
            }
            return res.status(500).json({ success: false, error: 'Error al subir el archivo.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se proporcionó ningún archivo.' });
        }

        const uploadedPath = req.file.path;

        try {
            const content = fs.readFileSync(uploadedPath, 'utf-8');

            // Limpiar el archivo temporal subido
            fs.unlinkSync(uploadedPath);

            if (!content.trim()) {
                return res.status(400).json({ success: false, error: 'El archivo está vacío.' });
            }

            const result = processFileContent(content);

            // Si no hay ningún número en el archivo
            if (result.total === 0) {
                return res.status(400).json({
                    success: false,
                    error:   'El archivo no contiene números válidos.'
                });
            }

            // Generar archivo de resultado
            const outputContent  = result.usefulNumbers.join('\n');
            const outputFilename = `resultado_${Date.now()}.txt`;
            const outputPath     = path.join(downloadsDir, outputFilename);
            fs.writeFileSync(outputPath, outputContent, 'utf-8');

            return res.json({
                success:          true,
                usefulNumbers:    result.usefulNumbers,
                factorialNumbers: result.factorialNumbers,
                total:            result.total,
                useful:           result.useful,
                nonUseful:        result.nonUseful,
                percentage:       result.percentage,
                downloadUrl:      `/downloads/${outputFilename}`
            });

        } catch (processErr) {
            // Si el archivo aún existe, limpiarlo
            if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);

            console.error('[/upload] Error al procesar:', processErr);
            return res.status(500).json({ success: false, error: 'Error interno al procesar el archivo.' });
        }
    });
});

// ─── Listar resultados generados ──────────────────────────────────────────────

/**
 * GET /listar-resultados
 * Devuelve los archivos resultado_*.txt en /downloads (excluye uploads temporales).
 * Ordenados por fecha de modificación descendente.
 */
app.get('/listar-resultados', (req, res) => {
    try {
        const files = fs.readdirSync(downloadsDir);
        const now   = Date.now();

        const archivos = files
            .filter(f => f.startsWith('resultado_') && f.endsWith('.txt'))
            .map(nombre => {
                const ruta  = path.join(downloadsDir, nombre);
                const stats = fs.statSync(ruta);
                const age   = now - stats.mtimeMs;
                return {
                    nombre,
                    fecha:    stats.mtime.toISOString(),
                    tamaño:   stats.size,
                    expirado: age > DOWNLOAD_MAX_AGE_MS
                };
            })
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        res.json({ archivos });
    } catch (err) {
        console.error('[/listar-resultados] Error:', err.message);
        res.status(500).json({ error: 'Error al leer los resultados.' });
    }
});

// ─── Re-descargar un resultado ────────────────────────────────────────────────

/**
 * GET /redescargar/:nombre
 * Envía un archivo resultado al cliente para su descarga.
 * Solo permite archivos resultado_*.txt para evitar path traversal.
 */
app.get('/redescargar/:nombre', (req, res) => {
    const nombre = path.basename(req.params.nombre);

    // Solo archivos de resultado válidos
    if (!nombre.startsWith('resultado_') || !nombre.endsWith('.txt')) {
        return res.status(403).json({ error: 'Archivo no permitido.' });
    }

    const rutaArchivo = path.join(downloadsDir, nombre);

    if (!fs.existsSync(rutaArchivo)) {
        return res.status(404).json({ error: 'El archivo ya no está disponible (puede haber expirado).' });
    }

    res.download(rutaArchivo);
});

/** GET / → sirve index.html */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// ─── Inicio ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    cleanOldDownloads(); // Limpieza al arrancar
});