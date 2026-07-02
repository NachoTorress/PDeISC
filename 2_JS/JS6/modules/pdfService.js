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
