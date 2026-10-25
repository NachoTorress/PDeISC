"""Export the maintained Markdown manuals to printable PDFs.

Requires Python 3 and reportlab. Run from any directory; output defaults to
output/pdf under ExpoTec. Source files remain the editable documentation.
"""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, LongTable, PageBreak, PageTemplate,
    Paragraph, Preformatted, Spacer, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[2]
DOCUMENTS = [
    ("MANUAL_USUARIO", "Manual de usuario", True),
    ("GUIA_INSTALACION", "Guía de instalación y configuración", False),
    ("GUIA_DEMOSTRACION", "Guía de demostración", False),
]


def register_fonts(font_dir: Path) -> None:
    for name, filename in [
        ("Manual", "arial.ttf"), ("ManualBold", "arialbd.ttf"),
        ("ManualItalic", "ariali.ttf"), ("ManualBoldItalic", "arialbi.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(name, str(font_dir / filename)))
    pdfmetrics.registerFontFamily(
        "Manual", normal="Manual", bold="ManualBold",
        italic="ManualItalic", boldItalic="ManualBoldItalic",
    )


def inline(text: str) -> str:
    text = html.escape(text.strip())
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="#164B70"><u>\1</u></link>', text,
    )
    text = re.sub(r"`([^`]+)`", r'<font name="Courier" size="9">\1</font>', text)
    return re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)


class ManualTemplate(BaseDocTemplate):
    def __init__(self, filename: str, title: str, **kwargs):
        super().__init__(filename, pagesize=A4, **kwargs)
        self.manual_title = title
        self.heading_number = 0
        frame = Frame(
            self.leftMargin, self.bottomMargin, self.width, self.height,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="manual", frames=frame, onPage=self.draw_page))

    def beforeDocument(self):
        self.heading_number = 0
        self.canv.setTitle(f"ExpoTec | {self.manual_title}")
        self.canv.setAuthor("Proyecto ExpoTec")
        self.canv.setSubject("Documentación de ExpoTec 0.4.0")

    def draw_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Manual", 10)
        canvas.setFillColor(colors.black)
        canvas.drawRightString(A4[0] - self.rightMargin, A4[1] - 1.6 * cm, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "MainHeading":
            self.heading_number += 1
            key = f"section-{self.heading_number}"
            label = flowable.getPlainText()
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(label, key, 0, False)
            self.notify("TOCEntry", (0, label, self.page, key))


def make_styles(academic: bool):
    leading = 22 if academic else 16
    body = ParagraphStyle(
        "Body", fontName="Manual", fontSize=11, leading=leading,
        textColor=colors.black, spaceAfter=8, splitLongWords=True,
        allowWidows=0, allowOrphans=0,
    )
    return {
        "body": body,
        "title": ParagraphStyle("Title", parent=body, fontName="ManualBold", fontSize=22,
                                leading=29, alignment=TA_CENTER, spaceAfter=24),
        "meta": ParagraphStyle("Metadata", parent=body, alignment=TA_CENTER, leading=22),
        "h2": ParagraphStyle("MainHeading", parent=body, fontName="ManualBold", fontSize=13,
                             leading=19, spaceBefore=16, spaceAfter=9, keepWithNext=True),
        "h3": ParagraphStyle("Subheading", parent=body, fontName="ManualBold", fontSize=11,
                             leading=17, spaceBefore=10, spaceAfter=5, keepWithNext=True),
        "list": ParagraphStyle("List", parent=body, leftIndent=18, firstLineIndent=0,
                               bulletIndent=0, spaceAfter=5),
        "cell": ParagraphStyle("Cell", parent=body, fontSize=9.5, leading=14, spaceAfter=0),
        "cellhead": ParagraphStyle("CellHeader", parent=body, fontName="ManualBold",
                                   fontSize=9.5, leading=14, spaceAfter=0),
        "code": ParagraphStyle("Code", fontName="Courier", fontSize=8, leading=11,
                               spaceBefore=5, spaceAfter=12),
    }


def make_table(lines: list[str], width: float, styles):
    rows = [line.strip().strip("|").split("|") for line in lines]
    rows = [r for r in rows if not all(re.fullmatch(r"\s*:?-+:?\s*", c) for c in r)]
    cells = [[Paragraph(inline(cell), styles["cellhead"] if i == 0 else styles["cell"])
              for cell in row] for i, row in enumerate(rows)]
    widths = [width * 0.32, width * 0.68] if len(rows[0]) == 2 else None
    table = LongTable(cells, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D9D9")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF2")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return [table, Spacer(1, 10)]


def export(source: Path, target: Path, title: str, academic: bool):
    styles = make_styles(academic)
    document = ManualTemplate(
        str(target), title=title, leftMargin=2.54 * cm, rightMargin=2.54 * cm,
        topMargin=2.54 * cm, bottomMargin=2.54 * cm,
    )
    lines = source.read_text(encoding="utf-8").splitlines()
    first_heading = next(i for i, line in enumerate(lines) if line.startswith("## "))
    story = [Spacer(1, 3.1 * cm), Paragraph(inline(lines[0][2:]), styles["title"])]
    for line in lines[1:first_heading]:
        if line.strip():
            story.append(Paragraph(inline(line), styles["meta"]))
    story.extend([PageBreak(), Paragraph("Contenido", styles["h3"])])
    contents = TableOfContents()
    contents.levelStyles = [ParagraphStyle(
        "ContentsEntry", fontName="Manual", fontSize=10.5, leading=17,
        spaceBefore=4, leftIndent=0, rightIndent=24,
    )]
    story.extend([contents, PageBreak()])
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
            story.append(Preformatted("\n".join(code), styles["code"], maxLineLength=94))
            i += 1
            continue
        if line.startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            story.extend(make_table(table_lines, document.width, styles))
            continue
        if line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), styles["h3"]))
        elif line.startswith("## "):
            story.append(Paragraph(inline(line[3:]), styles["h2"]))
        elif match := re.match(r"^(\d+)\.\s+(.+)$", line):
            story.append(Paragraph(inline(match[2]), styles["list"], bulletText=match[1] + "."))
        elif line.startswith("- "):
            story.append(Paragraph(inline(line[2:]), styles["list"], bulletText="-"))
        else:
            paragraph_lines = [line]
            while i + 1 < len(lines) and lines[i + 1].strip() and not re.match(
                r"^(#|\||```|\d+\.\s|-\s)", lines[i + 1]
            ):
                i += 1
                paragraph_lines.append(lines[i].strip())
            story.append(Paragraph(inline(" ".join(paragraph_lines)), styles["body"]))
        i += 1
    document.multiBuild(story)
    print(target.relative_to(ROOT))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font-dir", type=Path, default=Path("C:/Windows/Fonts"))
    parser.add_argument("--output-dir", type=Path, default=ROOT / "output/pdf")
    args = parser.parse_args()
    register_fonts(args.font_dir)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for stem, title, academic in DOCUMENTS:
        export(ROOT / "docs" / f"{stem}.md", args.output_dir / f"ExpoTec_{stem}.pdf", title, academic)


if __name__ == "__main__":
    main()
