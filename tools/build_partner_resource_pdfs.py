from pathlib import Path

from html.parser import HTMLParser
from docx import Document
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = ROOT / "downloads"
FONT = r"C:\Windows\Fonts\malgun.ttf"
FONT_BOLD = r"C:\Windows\Fonts\malgunbd.ttf"

NAVY = colors.HexColor("#07265D")
BLUE = colors.HexColor("#1768D5")
SKY = colors.HexColor("#EAF5FF")
INK = colors.HexColor("#24344D")
MUTED = colors.HexColor("#667A94")
LINE = colors.HexColor("#D7E4F1")

pdfmetrics.registerFont(TTFont("Harmony", FONT))
pdfmetrics.registerFont(TTFont("HarmonyBold", FONT_BOLD))

BODY = ParagraphStyle("Body", fontName="Harmony", fontSize=8.9, leading=14, textColor=INK, spaceAfter=5)
H1 = ParagraphStyle("H1", fontName="HarmonyBold", fontSize=13.5, leading=19, textColor=NAVY, spaceBefore=10, spaceAfter=5)
H2 = ParagraphStyle("H2", fontName="HarmonyBold", fontSize=11.2, leading=16, textColor=BLUE, spaceBefore=8, spaceAfter=4)
TITLE = ParagraphStyle("Title", fontName="HarmonyBold", fontSize=22, leading=30, textColor=NAVY, spaceAfter=6)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=7.7, leading=12, textColor=MUTED)
TABLE = ParagraphStyle("Table", parent=BODY, fontSize=7.4, leading=10.5)
TABLE_HEAD = ParagraphStyle("TableHead", parent=TABLE, fontName="HarmonyBold", textColor=NAVY, alignment=TA_CENTER)


def header_footer(canvas, doc):
    width, height = letter
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.roundRect(0.65 * inch, height - 0.70 * inch, 0.32 * inch, 0.32 * inch, 6, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("HarmonyBold", 14)
    canvas.drawCentredString(0.81 * inch, height - 0.59 * inch, "H")
    canvas.setFillColor(NAVY)
    canvas.setFont("HarmonyBold", 10.5)
    canvas.drawString(1.08 * inch, height - 0.57 * inch, "HarmonyLink")
    canvas.setFillColor(MUTED)
    canvas.setFont("Harmony", 7.2)
    canvas.drawRightString(width - 0.65 * inch, height - 0.57 * inch, doc.title[:48])
    canvas.setStrokeColor(LINE)
    canvas.line(0.65 * inch, 0.53 * inch, width - 0.65 * inch, 0.53 * inch)
    canvas.drawString(0.65 * inch, 0.33 * inch, "Hibelle Consulting Inc. · Partner Center")
    canvas.drawRightString(width - 0.65 * inch, 0.33 * inch, str(doc.page))
    canvas.restoreState()


def safe(text):
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").strip()


def blocks(document):
    body = document.element.body
    for child in body.iterchildren():
        if child.tag.endswith("}p"):
            yield DocxParagraph(child, document)
        elif child.tag.endswith("}tbl"):
            yield DocxTable(child, document)


def paragraph_flow(item, compact=False):
    text = safe(item.text)
    if not text:
        return Spacer(1, 3)
    name = item.style.name.lower() if item.style else ""
    compact_body = ParagraphStyle("CompactBody", parent=BODY, fontSize=8.2, leading=12.2, spaceAfter=3)
    compact_h1 = ParagraphStyle("CompactH1", parent=H1, fontSize=12.2, leading=16, spaceBefore=7, spaceAfter=3)
    compact_h2 = ParagraphStyle("CompactH2", parent=H2, fontSize=10.5, leading=14, spaceBefore=5, spaceAfter=3)
    body_style, h1_style, h2_style = (compact_body, compact_h1, compact_h2) if compact else (BODY, H1, H2)
    if name == "title":
        return Paragraph(text.replace("\n", "<br/>"), TITLE)
    if "heading 1" in name:
        return Paragraph(text, h1_style)
    if "heading 2" in name or "heading 3" in name:
        return Paragraph(text, h2_style)
    if "list" in name:
        return Paragraph(f"<font color='#1768D5'>●</font>&nbsp;&nbsp;{text}", body_style)
    return Paragraph(text.replace("\n", "<br/>"), body_style)


def table_flow(item):
    rows = []
    for row_index, row in enumerate(item.rows):
        rows.append([Paragraph(safe(cell.text).replace("\n", "<br/>"), TABLE_HEAD if row_index == 0 else TABLE) for cell in row.cells])
    if not rows:
        return Spacer(1, 1)
    count = len(rows[0])
    if count == 4:
        widths = [2.48 * inch, 1.20 * inch, 1.20 * inch, 1.42 * inch]
    elif count == 3:
        widths = [1.45 * inch, 1.10 * inch, 3.75 * inch]
    elif count == 2:
        widths = [1.35 * inch, 4.95 * inch]
    else:
        widths = [6.3 * inch / count] * count
    table = Table(rows, colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SKY),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def build_docx(source_name, output_name, title_text):
    source = DOWNLOADS / source_name
    output = DOWNLOADS / output_name
    document = Document(source)
    doc = BaseDocTemplate(str(output), pagesize=letter, leftMargin=0.72 * inch, rightMargin=0.72 * inch, topMargin=0.86 * inch, bottomMargin=0.68 * inch, title=title_text, author="Hibelle Consulting Inc.")
    doc.addPageTemplates(PageTemplate(id="resource", frames=Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height), onPage=header_footer))
    compact = "Instructor_Activity_Guide" in source_name
    story = [Spacer(1, 0.05 * inch if compact else 0.12 * inch)]
    for item in blocks(document):
        story.append(paragraph_flow(item, compact) if isinstance(item, DocxParagraph) else table_flow(item))
        if isinstance(item, DocxTable):
            story.append(Spacer(1, 8))
    doc.build(story)


def build_getting_started():
    source = DOWNLOADS / "HarmonyLink_Partner_Getting_Started.html"
    output = DOWNLOADS / "HarmonyLink_Partner_Getting_Started.pdf"
    class MainTextParser(HTMLParser):
        def __init__(self):
            super().__init__(); self.in_main = False; self.current = None; self.buffer = []; self.items = []
        def handle_starttag(self, tag, attrs):
            if tag == "main": self.in_main = True
            if self.in_main and tag in ("h1", "h2", "h3", "p", "li"):
                self.current = tag; self.buffer = []
        def handle_data(self, data):
            if self.in_main and self.current: self.buffer.append(data)
        def handle_endtag(self, tag):
            if self.in_main and tag == self.current:
                text = " ".join("".join(self.buffer).split())
                if text: self.items.append((tag, text))
                self.current = None; self.buffer = []
            if tag == "main": self.in_main = False
    parser = MainTextParser(); parser.feed(source.read_text(encoding="utf-8"))
    doc = BaseDocTemplate(str(output), pagesize=letter, leftMargin=0.72 * inch, rightMargin=0.72 * inch, topMargin=0.86 * inch, bottomMargin=0.68 * inch, title="입점 파트너 시작 안내서", author="Hibelle Consulting Inc.")
    doc.addPageTemplates(PageTemplate(id="start", frames=Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height), onPage=header_footer))
    story = [Paragraph("입점 파트너 시작 안내서", TITLE), Paragraph("승인 후 가장 먼저 확인하는 HarmonyLink 파트너 운영 안내", ParagraphStyle("Sub", parent=BODY, textColor=MUTED, spaceAfter=9))]
    seen = set()
    for tag_name, text in parser.items:
        if not text or text in seen:
            continue
        seen.add(text)
        if tag_name == "h1":
            style = H1
        elif tag_name in ("h2", "h3"):
            style = H2
        elif tag_name == "li":
            story.append(Paragraph(f"<font color='#1768D5'>●</font>&nbsp;&nbsp;{safe(text)}", BODY))
            continue
        else:
            style = BODY
        story.append(Paragraph(safe(text), style))
    doc.build(story)


if __name__ == "__main__":
    build_getting_started()
    build_docx("HarmonyLink_Partner_Policy_v1.0.docx", "HarmonyLink_Partner_Policy_v1.0.pdf", "입점 파트너 플랫폼 이용 및 운영 정책")
    build_docx("HarmonyLink_Instructor_Activity_Guide_v1.0.docx", "HarmonyLink_Instructor_Activity_Guide_v1.0.pdf", "HarmonyLink 강사 활동 가이드")
    build_docx("HarmonyLink_Partner_FAQ_v1.0.docx", "HarmonyLink_Partner_FAQ_v1.0.pdf", "HarmonyLink 입점 파트너 FAQ")
