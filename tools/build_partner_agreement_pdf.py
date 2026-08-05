from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph,
    Spacer, Table, TableStyle, PageBreak
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "downloads" / "HarmonyLink_Partner_Agreement_v2.0.pdf"
FONT = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")

NAVY = colors.HexColor("#07265D")
BLUE = colors.HexColor("#1768D5")
SKY = colors.HexColor("#EAF5FF")
INK = colors.HexColor("#24344D")
MUTED = colors.HexColor("#667A94")
GOLD = colors.HexColor("#FFF3D3")
LINE = colors.HexColor("#D9E5F2")

pdfmetrics.registerFont(TTFont("Harmony", str(FONT)))
pdfmetrics.registerFont(TTFont("HarmonyBold", str(FONT_BOLD)))

styles = getSampleStyleSheet()
body = ParagraphStyle("Body", fontName="Harmony", fontSize=9.2, leading=15, textColor=INK, spaceAfter=5)
small = ParagraphStyle("Small", parent=body, fontSize=8, leading=12, textColor=MUTED)
h1 = ParagraphStyle("H1", fontName="HarmonyBold", fontSize=13, leading=18, textColor=NAVY, spaceBefore=10, spaceAfter=5)
title = ParagraphStyle("Title", fontName="HarmonyBold", fontSize=23, leading=31, textColor=NAVY, alignment=TA_LEFT, spaceAfter=5)
subtitle = ParagraphStyle("Subtitle", fontName="Harmony", fontSize=10, leading=15, textColor=MUTED, spaceAfter=15)
center = ParagraphStyle("Center", parent=body, alignment=TA_CENTER)
table_head = ParagraphStyle("TableHead", fontName="HarmonyBold", fontSize=8.2, leading=12, textColor=NAVY, alignment=TA_CENTER)
table_body = ParagraphStyle("TableBody", fontName="Harmony", fontSize=8.1, leading=12, textColor=INK)


def header_footer(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setFillColor(BLUE)
    canvas.roundRect(0.66 * inch, height - 0.72 * inch, 0.34 * inch, 0.34 * inch, 6, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("HarmonyBold", 15)
    canvas.drawCentredString(0.83 * inch, height - 0.61 * inch, "H")
    canvas.setFillColor(NAVY)
    canvas.setFont("HarmonyBold", 11)
    canvas.drawString(1.10 * inch, height - 0.59 * inch, "HarmonyLink")
    canvas.setFillColor(MUTED)
    canvas.setFont("Harmony", 7.5)
    canvas.drawRightString(width - 0.68 * inch, height - 0.59 * inch, "PARTNER AGREEMENT · VERSION 2.0")
    canvas.setStrokeColor(LINE)
    canvas.line(0.68 * inch, 0.54 * inch, width - 0.68 * inch, 0.54 * inch)
    canvas.setFillColor(MUTED)
    canvas.setFont("Harmony", 7.2)
    canvas.drawString(0.68 * inch, 0.34 * inch, "Hibelle Consulting Inc. · HarmonyLink Partner Center")
    canvas.drawRightString(width - 0.68 * inch, 0.34 * inch, f"{doc.page}")
    canvas.restoreState()


def p(text, style=body):
    return Paragraph(text, style)


def bullet(text):
    return Paragraph(f"<font color='#1768D5'>●</font>&nbsp;&nbsp;{text}", body)


def section(number, heading, paragraphs):
    result = [p(f"{number}. {heading}", h1)]
    result.extend(paragraphs)
    return result


def signature_box(title_text, party_name):
    rows = [
        [p(title_text, table_head)],
        [p(f"성명/회사명&nbsp;&nbsp; {party_name}", table_body)],
        [p("대표자&nbsp;&nbsp; __________________________________", table_body)],
        [p("서명&nbsp;&nbsp;&nbsp;&nbsp; __________________________________", table_body)],
        [p("날짜&nbsp;&nbsp;&nbsp;&nbsp; ________년 ____월 ____일", table_body)],
    ]
    table = Table(rows, colWidths=[3.14 * inch], rowHeights=[0.38 * inch, 0.45 * inch, 0.45 * inch, 0.55 * inch, 0.45 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SKY),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
    ]))
    return table


def build():
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=letter, leftMargin=0.72 * inch, rightMargin=0.72 * inch,
        topMargin=0.88 * inch, bottomMargin=0.70 * inch, title="HarmonyLink 입점 파트너 계약서",
        author="Hibelle Consulting Inc."
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates(PageTemplate(id="agreement", frames=frame, onPage=header_footer))

    story = [Spacer(1, 0.15 * inch), p("PARTNER AGREEMENT", ParagraphStyle("Kicker", parent=small, textColor=BLUE, fontName="HarmonyBold", letterSpacing=1.4)), p("HarmonyLink 입점 파트너 계약서", title), p("파트너와 HarmonyLink가 함께 신뢰받는 교육 서비스를 운영하기 위한 기본 약정", subtitle)]

    notice = Table([[p("계약 전 확인", table_head), p("본 계약서는 기본 운영 약정입니다. 서명 전 당사자 정보, 서비스 범위, 비용 및 관할법을 확인하고 필요한 경우 전문가의 검토를 받으세요.", table_body)]], colWidths=[1.12 * inch, 5.15 * inch])
    notice.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD), ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#E7C97A")), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11), ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9)]))
    story += [notice, Spacer(1, 8)]

    story += section("1", "계약 당사자", [p("본 계약은 Hibelle Consulting Inc.(이하 ‘회사’)와 아래 서명한 교육업체 또는 개인 강사(이하 ‘파트너’) 사이의 HarmonyLink 플랫폼 입점 및 프로그램 운영에 관한 기본 사항을 정합니다.")])
    story += section("2", "계약 목적과 운영 범위", [
        bullet("회사는 파트너의 승인된 프로필과 프로그램을 HarmonyLink에 게시하고 문의 및 매칭을 지원합니다."),
        bullet("파트너는 사실에 맞는 정보와 적법하게 사용할 수 있는 이미지 및 교육자료를 제공합니다."),
        bullet("수업 일정, 장소, 비용, 준비사항은 개별 수업 또는 기관과의 별도 협의로 확정합니다."),
    ])
    story += [p("3. 멤버십 선택", h1)]
    membership = [
        [p("구분", table_head), p("월 등록비", table_head), p("기본 제공 범위", table_head)],
        [p("무료 파트너", table_body), p("$0", center), p("기본 프로필 등록, 파트너 시작 자료, 프로그램 제안 기회", table_body)],
        [p("BASIC 파트너", table_body), p("$20", center), p("무료 혜택 + 프로그램 등록, 기본 자료실, 문의 연결", table_body)],
        [p("PREMIUM 파트너", table_body), p("$50", center), p("BASIC 혜택 + PREMIUM 자료, 우선 홍보 및 추가 홍보 신청", table_body)],
    ]
    mt = Table(membership, colWidths=[1.45 * inch, 0.95 * inch, 3.9 * inch], repeatRows=1)
    mt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), SKY), ("GRID", (0, 0), (-1, -1), 0.55, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    story += [mt, p("선택 멤버십:  □ $0 무료 파트너　 □ $20 BASIC　 □ $50 PREMIUM", ParagraphStyle("Choice", parent=body, fontName="HarmonyBold", textColor=NAVY, spaceBefore=8, spaceAfter=8)), p("멤버십의 적용일, 결제 방식, 변경 또는 해지 시점은 별도 안내 또는 기록이 남는 방식의 합의에 따릅니다.", small)]

    story += [PageBreak()]
    story += section("4", "수수료와 정산", [
        bullet("플랫폼을 통해 성사된 유료 수업에는 해당 시점의 운영정책에 따른 플랫폼 이용수수료가 적용될 수 있습니다."),
        bullet("수수료율, 결제 주체, 환불 및 정산일은 수업 확정 전에 서면 또는 전자메시지로 확인합니다."),
    ])
    story += section("5", "파트너의 의무", [
        bullet("자격, 경력, 가격과 프로그램 내용을 사실대로 제공합니다."),
        bullet("고객 개인정보는 수업 진행 목적에만 사용하고 외부에 공유하지 않습니다."),
        bullet("안전수칙, 기관 규정, 저작권 및 관련 법규를 준수합니다."),
        bullet("일정 변경, 사고, 민원 또는 운영 문제가 발생하면 회사에 신속히 알립니다."),
    ])
    story += section("6", "취소·변경·환불", [p("수업별 취소, 변경 및 환불 조건은 예약 확정 전에 고객, 파트너와 회사가 확인한 조건을 우선 적용합니다. 별도 합의가 없으면 회사의 최신 운영정책을 따릅니다.")])
    story += section("7", "지식재산권과 홍보자료", [p("각 당사자가 기존에 보유한 상표, 로고, 교안과 콘텐츠의 권리는 원 소유자에게 있습니다. 파트너는 입점 기간 동안 회사가 승인된 프로필과 홍보자료를 HarmonyLink 홍보 목적으로 게시할 수 있도록 허용합니다.")])
    story += section("8", "개인정보와 비밀유지", [p("당사자는 서비스 제공 과정에서 알게 된 고객 및 상대방의 개인정보와 비공개 정보를 목적 범위 안에서만 사용하고 안전하게 관리합니다. 법령 또는 정당한 요청이 없는 한 제3자에게 제공하지 않습니다.")])
    story += section("9", "계약기간과 종료", [p("계약은 양쪽 당사자가 서명한 날부터 시작합니다. 어느 당사자든 기록이 남는 서면 또는 이메일로 종료를 요청할 수 있습니다. 미정산 금액, 개인정보 보호, 저작권과 비밀유지 의무는 종료 후에도 필요한 범위에서 유지됩니다.")])
    story += section("10", "책임과 분쟁 해결", [p("당사자는 문제가 발생하면 우선 성실히 협의합니다. 고의 또는 중대한 과실, 허위 정보, 권리 침해 등 각 당사자의 귀책 사유로 발생한 손해는 해당 당사자가 책임집니다. 관할 및 준거법은 최종 서명 전에 당사자가 별도로 확인합니다.")])

    story += [PageBreak(), Spacer(1, 0.12 * inch), p("서명 및 최종 확인", title), p("양쪽 당사자는 계약 내용을 읽고 이해했으며, 아래 서명으로 계약 조건에 동의합니다.", subtitle)]
    summary = Table([
        [p("선택 멤버십", table_head), p("□ $0 무료　　□ $20 BASIC　　□ $50 PREMIUM", table_body)],
        [p("계약 시작일", table_head), p("________년 ____월 ____일", table_body)],
        [p("추가 합의", table_head), p("________________________________________________________________", table_body)],
    ], colWidths=[1.35 * inch, 4.95 * inch], rowHeights=[0.45 * inch, 0.45 * inch, 0.7 * inch])
    summary.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), SKY), ("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 10)]))
    story += [summary, Spacer(1, 18), Table([[signature_box("회사 / HIBELLE", "Hibelle Consulting Inc."), signature_box("입점 파트너", "________________________")]], colWidths=[3.17 * inch, 3.17 * inch], hAlign="CENTER", style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3)])), Spacer(1, 18), p("서명된 계약서는 양쪽 당사자가 각각 보관합니다. 계약 내용이나 멤버십 변경은 이메일 등 기록이 남는 방식으로 확인해 주세요.", small)]
    doc.build(story)


if __name__ == "__main__":
    build()
