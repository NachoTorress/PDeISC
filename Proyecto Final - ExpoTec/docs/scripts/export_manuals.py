"""Exporta los manuales de ExpoTec (Markdown) a PDF imprimibles.

Formato aplicado (pedido para la entrega):
- Hoja A4, márgenes de 2,54 cm, fuente Arial 11, todo en blanco y negro.
- Cuerpo con interlineado 1,5 y texto justificado; la portada va centrada.
- Encabezado en todas las páginas: título del documento a la izquierda y
  número de página a la derecha, sin ningún otro dato.
- Títulos numerados por nivel: ``##`` -> 1, ``###`` -> 1.1, ``####`` -> 1.1.1.
- Índice funcional: cada entrada es un enlace a su sección y el PDF incluye
  marcadores de navegación.
- Tablas al estilo APA: "Tabla N" en negrita, debajo la descripción en
  cursiva y luego la tabla, solo con líneas horizontales.
- Imágenes: "Imagen N" en negrita, debajo la descripción en cursiva y luego
  la imagen, convertida a escala de grises.

Convenciones de los Markdown de origen:
- La primera línea ``# Título`` y las líneas siguientes hasta el primer ``##``
  forman la portada.
- Una línea ``Tabla: descripción`` justo antes de una tabla define su
  descripción.
- ``![descripción](ruta/relativa.png)`` inserta una imagen numerada; la ruta
  se resuelve desde la carpeta ``docs``.

Uso, desde cualquier carpeta (requiere Python 3 y reportlab):
    python docs/scripts/export_manuals.py
    python docs/scripts/export_manuals.py --font-dir C:/Windows/Fonts --output-dir output/pdf

Si no encuentra Arial, usa Liberation Sans, que tiene las mismas métricas.
"""

from __future__ import annotations

import argparse
import html
import io
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, LongTable, PageBreak,
    PageTemplate, Paragraph, Preformatted, Spacer, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

# Carpeta raíz de ExpoTec (este archivo está en docs/scripts).
ROOT = Path(__file__).resolve().parents[2]

# (archivo sin extensión, título del encabezado de página)
DOCUMENTS = [
    ("MANUAL_USUARIO", "Manual de usuario de ExpoTec"),
    ("GUIA_INSTALACION", "Guía de instalación y configuración de ExpoTec"),
    ("GUIA_DEMOSTRACION", "Guía de demostración de ExpoTec"),
]

BLACK = colors.black
FONT_SIZE = 11
# Interlineado 1,5 para Arial 11 (equivale al "1,5 líneas" de un procesador de texto).
BODY_LEADING = 19

# Juegos de archivos aceptados: Arial (Windows) o Liberation Sans (Linux).
FONT_SETS = [
    ("arial.ttf", "arialbd.ttf", "ariali.ttf", "arialbi.ttf"),
    ("LiberationSans-Regular.ttf", "LiberationSans-Bold.ttf",
     "LiberationSans-Italic.ttf", "LiberationSans-BoldItalic.ttf"),
]
FONT_DIRS = [Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/liberation")]


def register_fonts(font_dir: Path | None) -> str:
    """Registra la familia tipográfica "Manual" y devuelve qué fuente se usó."""
    candidates = [font_dir] if font_dir else FONT_DIRS
    for folder in candidates:
        for files in FONT_SETS:
            paths = [folder / name for name in files]
            if all(path.exists() for path in paths):
                for alias, path in zip(
                    ("Manual", "ManualBold", "ManualItalic", "ManualBoldItalic"), paths
                ):
                    pdfmetrics.registerFont(TTFont(alias, str(path)))
                pdfmetrics.registerFontFamily(
                    "Manual", normal="Manual", bold="ManualBold",
                    italic="ManualItalic", boldItalic="ManualBoldItalic",
                )
                return files[0]
    raise SystemExit("No se encontró Arial ni Liberation Sans. Indicá --font-dir.")


def inline(text: str) -> str:
    """Convierte el Markdown en línea (enlaces, código, negrita) a marcado de reportlab.

    Todo queda en negro: los enlaces solo se distinguen por el subrayado.
    """
    text = html.escape(text.strip())
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="black"><u>\1</u></link>', text,
    )
    text = re.sub(r"`([^`]+)`", r'<font name="Courier" size="10">\1</font>', text)
    return re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)


class ManualTemplate(BaseDocTemplate):
    """Plantilla de página con encabezado (título + número) e índice enlazado."""

    def __init__(self, filename: str, header: str, **kwargs):
        super().__init__(filename, pagesize=A4, **kwargs)
        self.header = header
        frame = Frame(
            self.leftMargin, self.bottomMargin, self.width, self.height,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="manual", frames=frame, onPage=self.draw_header))

    def beforeDocument(self):
        # multiBuild recorre el documento varias veces: el contador se reinicia en cada pasada.
        self.section_count = 0
        self.canv.setTitle(self.header)
        self.canv.setAuthor("Proyecto ExpoTec - E.E.S.T. N° 5 Amancio Williams")
        self.canv.setSubject("Documentación de ExpoTec 0.4.0")

    def draw_header(self, canvas, doc):
        """Dibuja el título del documento a la izquierda y el número de página a la derecha."""
        canvas.saveState()
        canvas.setFont("Manual", 10)
        canvas.setFillColor(BLACK)
        y = A4[1] - 1.5 * cm
        canvas.drawString(self.leftMargin, y, self.header)
        canvas.drawRightString(A4[0] - self.rightMargin, y, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        """Registra cada título numerado en el índice y en los marcadores del PDF."""
        if not isinstance(flowable, Paragraph):
            return
        level = {"Heading1": 0, "Heading2": 1, "Heading3": 2}.get(flowable.style.name)
        if level is None:
            return
        self.section_count += 1
        key = f"section-{self.section_count}"
        label = flowable.getPlainText()
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(label, key, level, closed=False)
        self.notify("TOCEntry", (level, label, self.page, key))


def make_styles():
    """Estilos del documento: cuerpo justificado a 1,5 y títulos en negrita."""
    body = ParagraphStyle(
        "Body", fontName="Manual", fontSize=FONT_SIZE, leading=BODY_LEADING,
        textColor=BLACK, alignment=TA_JUSTIFY, spaceAfter=6,
        splitLongWords=True, allowWidows=0, allowOrphans=0,
    )
    heading = dict(parent=body, fontName="ManualBold", alignment=TA_LEFT, keepWithNext=True)
    centered = dict(parent=body, alignment=TA_CENTER)
    return {
        "body": body,
        "cover_title": ParagraphStyle("CoverTitle", fontName="ManualBold", fontSize=16,
                                      leading=24, alignment=TA_CENTER, spaceAfter=24),
        "cover": ParagraphStyle("Cover", **centered),
        "toc_title": ParagraphStyle("TocTitle", fontName="ManualBold", fontSize=13,
                                    leading=BODY_LEADING, alignment=TA_CENTER, spaceAfter=12),
        "h1": ParagraphStyle("Heading1", fontSize=13, spaceBefore=14, spaceAfter=6, **heading),
        "h2": ParagraphStyle("Heading2", fontSize=12, spaceBefore=10, spaceAfter=4, **heading),
        "h3": ParagraphStyle("Heading3", fontSize=11, spaceBefore=8, spaceAfter=4, **heading),
        "list": ParagraphStyle("List", parent=body, leftIndent=18, bulletIndent=2, spaceAfter=3,
                               bulletFontName="Manual"),
        "caption_number": ParagraphStyle("CaptionNumber", fontName="ManualBold", fontSize=FONT_SIZE,
                                         leading=BODY_LEADING, alignment=TA_LEFT, keepWithNext=True),
        "caption_title": ParagraphStyle("CaptionTitle", fontName="ManualItalic", fontSize=FONT_SIZE,
                                        leading=BODY_LEADING, alignment=TA_LEFT, spaceAfter=4,
                                        keepWithNext=True),
        # Las tablas usan interlineado simple, permitido por APA para mejorar la lectura.
        "cell": ParagraphStyle("Cell", fontName="Manual", fontSize=10, leading=13, alignment=TA_LEFT),
        "cellhead": ParagraphStyle("CellHead", fontName="ManualBold", fontSize=10, leading=13,
                                   alignment=TA_LEFT),
        "code": ParagraphStyle("Code", fontName="Courier", fontSize=9, leading=12,
                               leftIndent=14, spaceBefore=4, spaceAfter=10),
    }


class JustifiedParagraph(Paragraph):
    """Párrafo justificado que se alinea a la izquierda si el justificado deja huecos.

    Las rutas y nombres de variables largos no se pueden cortar; cuando caen al
    final de una línea, justificar separaría demasiado las palabras. En ese caso
    (y solo en ese) el párrafo se reacomoda alineado a la izquierda.
    """

    MAX_GAP = 7  # puntos extra permitidos entre palabras de una línea justificada

    def wrap(self, availWidth, availHeight):
        result = super().wrap(availWidth, availHeight)
        lines = getattr(self.blPara, "lines", [])
        for line in lines[:-1]:
            words = getattr(line, "words", None) or (line[1] if isinstance(line, tuple) else [])
            gaps = max(1, len(words) - 1)
            extra = getattr(line, "extraSpace", line[0] if isinstance(line, tuple) else 0)
            if extra / gaps > self.MAX_GAP:
                self.style = ParagraphStyle("BodyLeft", parent=self.style, alignment=TA_LEFT)
                return super().wrap(availWidth, availHeight)
        return result


def make_toc():
    """Índice de tres niveles con puntos guía; cada entrada es un enlace a la sección."""
    toc = TableOfContents(dotsMinLevel=0)
    indents = [0, 16, 32]
    toc.levelStyles = [
        ParagraphStyle(f"Toc{level}", fontName="ManualBold" if level == 0 else "Manual",
                       fontSize=FONT_SIZE, leading=15, leftIndent=indents[level],
                       firstLineIndent=0, rightIndent=24, spaceBefore=0, textColor=BLACK)
        for level in range(3)
    ]
    return toc


def caption(kind: str, number: int, description: str, styles) -> list:
    """Rótulo APA: número en negrita y descripción en cursiva, ambos arriba del elemento."""
    return [
        Paragraph(f"{kind} {number}", styles["caption_number"]),
        Paragraph(inline(description), styles["caption_title"]),
    ]


def make_table(lines: list[str], width: float, styles) -> LongTable:
    """Arma una tabla APA: sin líneas verticales, con regla superior, bajo el encabezado e inferior."""
    rows = [line.strip().strip("|").split("|") for line in lines]
    rows = [r for r in rows if not all(re.fullmatch(r"\s*:?-+:?\s*", c) for c in r)]
    cells = [[Paragraph(inline(cell), styles["cellhead"] if i == 0 else styles["cell"])
              for cell in row] for i, row in enumerate(rows)]
    widths = [width * 0.32, width * 0.68] if len(rows[0]) == 2 else None
    table = LongTable(cells, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 1, BLACK),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, BLACK),
        ("LINEBELOW", (0, -1), (-1, -1), 1, BLACK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def make_image(path: Path, width: float) -> Image:
    """Inserta una captura en escala de grises (el documento es solo blanco y negro).

    La imagen se escala al ancho disponible y a 12 cm de alto como máximo,
    conservando su proporción. El archivo original en color no se modifica.
    """
    from PIL import Image as PILImage  # Pillow se instala junto con reportlab.

    gray = PILImage.open(path).convert("L")
    buffer = io.BytesIO()
    gray.save(buffer, format="PNG")
    buffer.seek(0)
    image = Image(buffer)
    scale = min(1.0, width / image.imageWidth, (12 * cm) / image.imageHeight)
    image.drawWidth, image.drawHeight = image.imageWidth * scale, image.imageHeight * scale
    image.hAlign = "CENTER"
    return image


def export(source: Path, target: Path, header: str) -> None:
    """Convierte un Markdown en PDF con portada, índice y contenido numerado."""
    styles = make_styles()
    document = ManualTemplate(
        str(target), header=header, leftMargin=2.54 * cm, rightMargin=2.54 * cm,
        topMargin=2.54 * cm, bottomMargin=2.54 * cm,
    )
    lines = source.read_text(encoding="utf-8").splitlines()
    first_heading = next(i for i, line in enumerate(lines) if line.startswith("## "))

    # Portada centrada: título y las líneas de identificación del Markdown.
    story = [Spacer(1, 6 * cm), Paragraph(inline(lines[0][2:]), styles["cover_title"])]
    story += [Paragraph(inline(line), styles["cover"])
              for line in lines[1:first_heading] if line.strip()]
    story += [PageBreak(), Paragraph("Índice", styles["toc_title"]), make_toc(), PageBreak()]

    numbers = [0, 0, 0]          # contadores de los niveles 1, 1.1 y 1.1.1
    counters = {"Tabla": 0, "Imagen": 0}
    pending_table_title = None   # descripción leída de la línea "Tabla: ..."

    def heading(level: int, text: str):
        numbers[level] += 1
        for deeper in range(level + 1, 3):
            numbers[deeper] = 0
        label = ".".join(str(n) for n in numbers[: level + 1]) + ("." if level == 0 else "")
        story.append(Paragraph(f"{label} {inline(text)}", styles[f"h{level + 1}"]))

    def take_heading() -> list:
        """Si el último elemento es un título, lo retira para que viaje junto a la tabla o imagen."""
        last = story[-1] if story else None
        if isinstance(last, Paragraph) and last.style.name.startswith("Heading"):
            return [story.pop()]
        return []

    i = first_heading
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith("```"):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            story.append(Preformatted("\n".join(code), styles["code"], maxLineLength=90))
            i += 1
            continue
        if line.startswith("Tabla:"):
            pending_table_title = line[len("Tabla:"):].strip()
            i += 1
            continue
        if line.startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            counters["Tabla"] += 1
            title = pending_table_title or "Tabla sin descripción"
            pending_table_title = None
            table = make_table(table_lines, document.width, styles)
            block = caption("Tabla", counters["Tabla"], title, styles) + [table]
            story += take_heading() + block + [Spacer(1, 10)]
            continue
        if match := re.match(r"^!\[([^\]]+)\]\(([^)]+)\)$", line):
            counters["Imagen"] += 1
            image = make_image(source.parent / match[2], document.width)
            block = caption("Imagen", counters["Imagen"], match[1], styles) + [image]
            story += take_heading() + block + [Spacer(1, 10)]
            i += 1
            continue
        if line.startswith("#### "):
            heading(2, line[5:])
        elif line.startswith("### "):
            heading(1, line[4:])
        elif line.startswith("## "):
            heading(0, line[3:])
        elif match := re.match(r"^(\d+)\.\s+(.+)$", line):
            story.append(Paragraph(inline(match[2]), styles["list"], bulletText=match[1] + "."))
        elif line.startswith("- "):
            story.append(Paragraph(inline(line[2:]), styles["list"], bulletText="•"))
        else:
            # Une las líneas consecutivas de un mismo párrafo.
            paragraph = [line]
            while i + 1 < len(lines) and lines[i + 1].strip() and not re.match(
                r"^(#|\||```|\d+\.\s|-\s|!\[|Tabla:)", lines[i + 1]
            ):
                i += 1
                paragraph.append(lines[i].strip())
            text = " ".join(paragraph)
            story.append(JustifiedParagraph(inline(text), styles["body"]))
        i += 1
    document.multiBuild(story)
    print(target)


def main():
    parser = argparse.ArgumentParser(description="Exporta los manuales de ExpoTec a PDF.")
    parser.add_argument("--font-dir", type=Path, default=None,
                        help="Carpeta con Arial o Liberation Sans (por defecto se busca sola).")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "output/pdf")
    args = parser.parse_args()
    print("Fuente:", register_fonts(args.font_dir))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for stem, header in DOCUMENTS:
        export(ROOT / "docs" / f"{stem}.md", args.output_dir / f"ExpoTec_{stem}.pdf", header)


if __name__ == "__main__":
    main()
