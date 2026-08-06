/**
 * modules/pdfService.js
 * -------------------------------------------------------
 * De donde viene: lo llama modules/routes/pdfRoutes.js con
 *                  los datos del puntaje actual del jugador
 *                  (nombre, tiempo, puntos, fecha).
 * A donde va:     el PDF generado se escribe directamente
 *                  en la respuesta HTTP (res) para que el
 *                  navegador lo descargue.
 * Que hace:       arma un documento PDF prolijo con PDFKit
 *                  mostrando el resultado de la partida.
 * -------------------------------------------------------
 */

import PDFDocument from 'pdfkit';
import { formatearFecha } from './dateUtils.js';

/**
 * Genera un PDF con el resumen del puntaje y lo envia por la respuesta HTTP.
 * @param {import('express').Response} res
 * @param {{nombre: string, tiempo: number, puntos: number, fecha: Date|string}} datos
 */
export function generarPdfScore(res, { nombre, tiempo, puntos, fecha }) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="score-${nombre}.pdf"`);

    doc.pipe(res);

    // Encabezado
    doc
        .fillColor('#2d1b4e')
        .fontSize(26)
        .text('🎮 El Ahorcado', { align: 'center' })
        .moveDown(0.3);

    doc
        .fillColor('#6b21a8')
        .fontSize(16)
        .text('Comprobante de puntaje', { align: 'center' })
        .moveDown(2);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#c084fc').stroke();
    doc.moveDown(1.5);

    const minutos = Math.floor(tiempo / 60);
    const segundos = tiempo % 60;
    const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    const filas = [
        ['Nombre', nombre],
        ['Puntos obtenidos', String(puntos)],
        ['Tiempo empleado', `${tiempoFormateado} (mm:ss)`],
        ['Fecha', formatearFecha(fecha)],
    ];

    filas.forEach(([etiqueta, valor]) => {
        doc
            .fillColor('#374151')
            .fontSize(13)
            .font('Helvetica-Bold')
            .text(`${etiqueta}: `, { continued: true })
            .font('Helvetica')
            .fillColor('#111827')
            .text(valor);
        doc.moveDown(0.6);
    });

    doc.moveDown(2);
    doc
        .fillColor('#9ca3af')
        .fontSize(10)
        .text('Generado automaticamente por el juego El Ahorcado.', { align: 'center' });

    doc.end();
}

/**
 * Genera un PDF con la tabla de posiciones historica completa (todos los
 * puntajes guardados) y lo envia por la respuesta HTTP.
 * @param {import('express').Response} res
 * @param {Array<{nombre: string, tiempo: number, puntos: number, fecha: Date|string}>} scores
 */
export function generarPdfTablaPosiciones(res, scores) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="tabla-posiciones-${new Date().toISOString().slice(0, 10)}.pdf"`
    );

    doc.pipe(res);

    // Encabezado
    doc
        .fillColor('#2d1b4e')
        .fontSize(24)
        .text('🪢 El Ahorcado', { align: 'center' })
        .moveDown(0.3);

    doc
        .fillColor('#6b21a8')
        .fontSize(15)
        .text('Tabla de posiciones historica', { align: 'center' })
        .moveDown(1.2);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#c084fc').stroke();
    doc.moveDown(1);

    if (scores.length === 0) {
        doc
            .fillColor('#374151')
            .fontSize(13)
            .text('Todavia no hay puntajes guardados.', { align: 'center' });
        doc.end();
        return;
    }

    // ---- Definicion de columnas de la tabla ----
    const columnas = [
        { titulo: '#', ancho: 35 },
        { titulo: 'Nombre', ancho: 175 },
        { titulo: 'Puntos', ancho: 70 },
        { titulo: 'Tiempo', ancho: 80 },
        { titulo: 'Fecha', ancho: 85 },
    ];
    const xInicio = 50;
    const altoFila = 24;

    /** Dibuja la fila de encabezado de la tabla en la posicion Y actual. */
    function dibujarEncabezadoTabla() {
        let x = xInicio;
        doc.rect(xInicio, doc.y, 445, altoFila).fill('#6b21a8');
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
        const y = doc.y + 7;
        columnas.forEach((columna) => {
            doc.text(columna.titulo, x + 6, y, { width: columna.ancho - 6 });
            x += columna.ancho;
        });
        doc.y += altoFila;
    }

    dibujarEncabezadoTabla();

    doc.font('Helvetica').fontSize(10);

    scores.forEach((score, indice) => {
        // Salto de pagina si no entra otra fila, repitiendo el encabezado.
        if (doc.y + altoFila > 780) {
            doc.addPage();
            doc.y = 50;
            dibujarEncabezadoTabla();
            doc.font('Helvetica').fontSize(10);
        }

        const minutos = Math.floor(score.tiempo / 60);
        const segundos = score.tiempo % 60;
        const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

        const filaY = doc.y;
        if (indice % 2 === 0) {
            doc.rect(xInicio, filaY, 445, altoFila).fill('#f3e8ff');
        }

        doc.fillColor('#111827');
        let x = xInicio;
        const valores = [
            String(indice + 1),
            score.nombre,
            String(score.puntos),
            `${tiempoFormateado} min`,
            formatearFecha(score.fecha),
        ];
        valores.forEach((valor, i) => {
            doc.text(valor, x + 6, filaY + 7, { width: columnas[i].ancho - 6 });
            x += columnas[i].ancho;
        });

        doc.y = filaY + altoFila;
    });

    doc.moveDown(2);
    doc
        .fillColor('#9ca3af')
        .fontSize(10)
        .text('Generado automaticamente por el juego El Ahorcado.', { align: 'center' });

    doc.end();
}
