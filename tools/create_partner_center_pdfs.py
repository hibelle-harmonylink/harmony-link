from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
DOWNLOADS = ROOT / "downloads"
OUT.mkdir(parents=True, exist_ok=True)
DOWNLOADS.mkdir(parents=True, exist_ok=True)

font_regular = Path("C:/Windows/Fonts/malgun.ttf")
font_bold = Path("C:/Windows/Fonts/malgunbd.ttf")
pdfmetrics.registerFont(TTFont("Malgun", str(font_regular)))
pdfmetrics.registerFont(TTFont("MalgunBold", str(font_bold)))

NAVY = colors.HexColor("#082B62")
BLUE = colors.HexColor("#1768D5")
SKY = colors.HexColor("#EAF5FF")
GOLD = colors.HexColor("#E4B64D")
TEXT = colors.HexColor("#243B57")
MUTED = colors.HexColor("#66788E")
LINE = colors.HexColor("#D8E5F3")

styles = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="MalgunBold", fontSize=8, textColor=BLUE, tracking=1.5, spaceAfter=8),
    "title": ParagraphStyle("title", fontName="MalgunBold", fontSize=23, leading=31, textColor=NAVY, spaceAfter=8),
    "intro": ParagraphStyle("intro", fontName="Malgun", fontSize=10, leading=17, textColor=MUTED, spaceAfter=18),
    "head": ParagraphStyle("head", fontName="MalgunBold", fontSize=13, leading=19, textColor=NAVY, spaceAfter=7),
    "body": ParagraphStyle("body", fontName="Malgun", fontSize=9.2, leading=16, textColor=TEXT),
    "small": ParagraphStyle("small", fontName="Malgun", fontSize=7.5, leading=12, textColor=MUTED),
    "center": ParagraphStyle("center", fontName="MalgunBold", fontSize=9, leading=14, alignment=TA_CENTER, textColor=NAVY),
}


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, letter[1] - 0.22 * inch, letter[0], 0.22 * inch, stroke=0, fill=1)
    canvas.setFont("Malgun", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.7 * inch, 0.38 * inch, "Harmony Link | Partner Resource Center")
    canvas.drawRightString(letter[0] - 0.7 * inch, 0.38 * inch, str(doc.page))
    canvas.restoreState()


def card(title, body, label="안내"):
    return Table(
        [[Paragraph(label, styles["center"]), Paragraph(f"<b>{title}</b><br/>{body}", styles["body"])]],
        colWidths=[0.9 * inch, 5.75 * inch],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), SKY),
            ("BOX", (0, 0), (-1, -1), 0.7, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 11),
            ("RIGHTPADDING", (0, 0), (-1, -1), 11),
            ("TOPPADDING", (0, 0), (-1, -1), 11),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ]),
    )


def build_notice(path):
    doc = SimpleDocTemplate(str(path), pagesize=letter, rightMargin=0.7*inch, leftMargin=0.7*inch,
                            topMargin=0.62*inch, bottomMargin=0.62*inch)
    story = [
        Paragraph("PARTNER NOTICE", styles["eyebrow"]),
        Paragraph("Harmony Link 파트너 공지사항 안내", styles["title"]),
        Paragraph("승인된 파트너가 꼭 확인해야 할 운영 소식과 자료실 이용 원칙을 한곳에 정리했습니다.", styles["intro"]),
        card("파트너 센터 이용 안내", "로그인 후 본인 등급에 맞는 자료만 열립니다. 자료는 외부 공유 없이 파트너 활동에만 사용해 주세요.", "필수"),
        Spacer(1, 10),
        card("등급별 자료 이용", "$0 무료 파트너는 시작 자료·공지·커뮤니티를, $20 BASIC은 운영·수업·홍보 자료를, $50 PREMIUM은 전체 자료와 우선 신청 혜택을 이용합니다.", "등급"),
        Spacer(1, 10),
        card("프로그램 및 출강 소식", "기관 수업, 강사 모집, 세미나와 행사 일정은 공지사항에 순차적으로 등록됩니다. 새 공지는 최근 등록 순서로 확인해 주세요.", "소식"),
        Spacer(1, 10),
        card("자료 업데이트 요청", "오래된 링크, 수정이 필요한 내용, 새 자료 제안은 홈페이지 문의하기를 통해 보내 주세요.", "문의"),
        Spacer(1, 18),
        Paragraph("공지 확인 체크리스트", styles["head"]),
        Table([
            ["01", "새 공지와 일정 확인"], ["02", "내 파트너 등급과 이용 범위 확인"],
            ["03", "필요한 문서 다운로드"], ["04", "문의 또는 업데이트 요청 제출"],
        ], colWidths=[0.55*inch, 6.1*inch], style=TableStyle([
            ("FONTNAME", (0,0), (-1,-1), "Malgun"), ("FONTSIZE", (0,0), (-1,-1), 9),
            ("TEXTCOLOR", (0,0), (0,-1), BLUE), ("TEXTCOLOR", (1,0), (1,-1), TEXT),
            ("LINEBELOW", (0,0), (-1,-1), 0.5, LINE), ("TOPPADDING", (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ])),
        Spacer(1, 16),
        Paragraph("문의: hibelle@hibelleconsulting.com | 미국 929-603-0052", styles["small"]),
    ]
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_community(path):
    doc = SimpleDocTemplate(str(path), pagesize=letter, rightMargin=0.7*inch, leftMargin=0.7*inch,
                            topMargin=0.62*inch, bottomMargin=0.62*inch)
    story = [
        Paragraph("PARTNER COMMUNITY", styles["eyebrow"]),
        Paragraph("Harmony Link 파트너 커뮤니티 이용 가이드", styles["title"]),
        Paragraph("강사와 교육업체가 서로의 경험을 안전하게 나누고 함께 성장하기 위한 기본 가이드입니다.", styles["intro"]),
        card("첫 인사와 활동 소개", "이름, 활동 지역, 교육 분야, 함께하고 싶은 기관·수업을 간단히 소개해 주세요. 개인 연락처 공개는 선택입니다.", "소개"),
        Spacer(1, 10),
        card("질문과 답변", "수업 준비, 기관 소통, 장비, 교안 등 구체적인 상황을 적어 주세요. 다른 파트너의 경험과 자료를 존중해 주세요.", "질문"),
        Spacer(1, 10),
        card("후기와 성공 사례", "수강자 개인정보와 기관 내부정보를 제외하고, 목표·진행 방법·결과·배운 점 순서로 공유하면 다른 파트너에게 도움이 됩니다.", "사례"),
        Spacer(1, 10),
        card("자료 공유 원칙", "직접 만든 자료이거나 공유 권한이 있는 자료만 등록합니다. 출처와 사용 범위를 명확히 표시하고 무단 재배포는 하지 않습니다.", "자료"),
        Spacer(1, 18),
        Paragraph("커뮤니티 기본 약속", styles["head"]),
        Table([
            ["존중", "비난보다 해결 방법과 경험을 중심으로 이야기합니다."],
            ["보호", "수강자·기관·파트너의 개인정보를 공개하지 않습니다."],
            ["출처", "사진, 문서, 교안은 저작권과 출처를 확인합니다."],
            ["협력", "홍보·출강·공동수업 제안은 조건을 분명하게 안내합니다."],
        ], colWidths=[0.9*inch, 5.75*inch], style=TableStyle([
            ("FONTNAME", (0,0), (0,-1), "MalgunBold"), ("FONTNAME", (1,0), (1,-1), "Malgun"),
            ("FONTSIZE", (0,0), (-1,-1), 9), ("TEXTCOLOR", (0,0), (0,-1), BLUE),
            ("TEXTCOLOR", (1,0), (1,-1), TEXT), ("BACKGROUND", (0,0), (0,-1), SKY),
            ("BOX", (0,0), (-1,-1), 0.6, LINE), ("INNERGRID", (0,0), (-1,-1), 0.5, LINE),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("TOPPADDING", (0,0), (-1,-1), 9),
            ("BOTTOMPADDING", (0,0), (-1,-1), 9), ("LEFTPADDING", (0,0), (-1,-1), 10),
        ])),
        Spacer(1, 16),
        Paragraph("커뮤니티 문의 및 신고: hibelle@hibelleconsulting.com", styles["small"]),
    ]
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


files = [
    ("HarmonyLink_Partner_Notice_Guide_v1.0.pdf", build_notice),
    ("HarmonyLink_Partner_Community_Guide_v1.0.pdf", build_community),
]
for filename, builder in files:
    output_path = OUT / filename
    builder(output_path)
    (DOWNLOADS / filename).write_bytes(output_path.read_bytes())
    print(output_path)
