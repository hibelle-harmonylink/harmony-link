// HarmonyLink 직업(Career) 카테고리 - shared data.
// Single source of truth for career-education partner organizations and their
// programs. The 직업 hub (career.html) and the generic partner/program pages
// (career/partner.html?partner=<id>, career/program.html?partner=<id>&program=<id>)
// all render from this file -- no HTML hardcodes a single partner, so a future
// partner is added by pushing a new entry into CAREER_PARTNERS, not by copying
// pages or branching code on "dms".
window.CAREER_PARTNERS = [
  {
    id: 'dms',
    nameKo: 'DMS Care Training Center',
    nameEn: 'DMS Care Training Center',
    badgeKo: '입점 파트너',
    badgeEn: 'Partner Provider',
    taglineKo: '미국 Healthcare 분야의 실무와 자격시험을 준비하는 직업교육 프로그램',
    taglineEn: 'Career-training programs preparing for U.S. healthcare roles and certification exams',
    // Reuses the exact verified logo/website already on file for DMS Care
    // Training Center in shared/data/businesses.js (Business Spotlight, id
    // "dms-care") -- the same real, already-published asset and URL, not a
    // new or invented one.
    logo: '../assets/images/dms-care-logo.webp',
    websiteUrl: 'https://www.dmscare.org/ko',
    // DMS's own consultation/application form and Korean-language phone
    // line, both confirmed from DMS's own submitted 링크 (1).pdf -- not
    // HarmonyLink's general class-request form.
    inquiryUrl: 'https://forms.gle/5yQ9HL6BkZADfJzL9',
    phone: '469-605-6035',
    programs: [
      {
        id: 'ma',
        nameKo: '메디컬 어시스턴트',
        nameEn: 'Medical Assistant (MA)',
        image: '../assets/career/dms/ma.png',
        icon: '🩺',
        officialUrl: 'https://dmscare.org/ko/pages/medical-assistant',
        duration: '6개월 과정',
        certPrepKo: 'NHA CCMA 자격증 준비',
        format: ['온라인 학습 + Live Zoom', '한국인 간호사의 한국어 설명', '영어 본수업 및 자격시험 준비', '학교 대면 실습 2일', '병원/임상 현장실습 5~10일'],
        shortIntro: '병원과 클리닉에서 환자 진료를 보조하고 기본적인 임상 업무와 의료행정 업무를 수행하는 Medical Assistant를 준비하는 과정입니다.',
        whatYouLearn: ['기초 의학용어 및 해부생리', '혈압·맥박·체온 등 활력징후 측정', '환자 접수 및 병력 확인', '진료실 준비 및 진료 보조', '주사 및 약물 투여 기초', '채혈 및 검체 관리', '심전도 EKG 검사 및 전극 부착', '전자의무기록 EHR 및 의료기록 관리', '예약·보험 및 의료행정 기초'],
        certification: { code: 'NHA CCMA', name: 'Certified Clinical Medical Assistant' },
        audience: ['미국 의료 분야에서 처음 일을 시작하고 싶은 분', '의료 경력이 없는 분', '영어 때문에 의료직 취업을 망설였던 분', '새로운 의료 Career에 도전하고 싶은 분', '직접 실습과 병원 현장 경험을 원하는 분'],
        careerFields: ['개인병원 및 의사 진료실', '내과·가정의학과', '전문 클리닉', 'Urgent Care', '외래진료센터', '기타 의료기관']
      },
      {
        id: 'pct',
        nameKo: '병원 간호조무사',
        nameEn: 'Patient Care Technician (PCT)',
        image: '../assets/career/dms/pct.png',
        icon: '🏥',
        officialUrl: 'https://dmscare.org/ko/pages/patient-care-technician-assistant-pct-pca-program',
        duration: '4개월 과정',
        certPrepKo: 'NHA CPCT/A 자격증 준비',
        format: ['Online Learning + Live Zoom', '한국인 간호사의 한국어 설명', '학교 Hands-on 실습 4일', '병원/임상 현장실습 5일'],
        shortIntro: '병원에서 간호사와 함께 환자의 일상생활과 기본 간호를 돕고 EKG·채혈 등 임상 업무를 수행하는 Patient Care Technician을 준비하는 과정입니다.',
        whatYouLearn: ['환자 위생 및 일상생활 보조', '환자 이동 및 보행 보조', '활력징후 측정 및 환자 관찰', '안전관리 및 감염관리', '심전도 EKG', '채혈', '상처관리 기초', '기본 환자 케어'],
        certification: { code: 'NHA CPCT/A', name: 'Certified Patient Care Technician/Assistant' },
        audience: [],
        careerFields: ['병원', '입원병동', '장기요양시설', '재활병원 및 재활시설', 'Nursing Facility', '기타 Patient Care 의료기관']
      },
      {
        id: 'phlebotomy',
        nameKo: '채혈사',
        nameEn: 'Phlebotomy Technician',
        image: '../assets/career/dms/phlebotomy.png',
        icon: '💉',
        officialUrl: 'https://dmscare.org/ko/pages/phlebotomy-technician-cpt-program',
        duration: '3개월 과정',
        certPrepKo: 'NHA CPT 자격증 준비',
        format: ['Online Learning + Live Zoom', '한국인 간호사의 한국어 설명', '학교 Hands-on 실습 1일', '다양한 채혈용품 실습', '40회 이상 직접 채혈 실습'],
        shortIntro: '',
        whatYouLearn: ['정맥 채혈', '모세혈관 채혈', '채혈 부위와 혈관 선택', '검체 채취 및 처리', '감염관리', '환자 안전', '채혈 바늘과 채혈용품 사용'],
        certification: { code: 'NHA CPT', name: 'Certified Phlebotomy Technician' },
        audience: [],
        careerFields: ['병원', 'Medical Center', '임상검사실', '독립 검사센터', '개인병원 및 클리닉', '채혈센터']
      },
      {
        id: 'ekg',
        nameKo: '심전도 기술자',
        nameEn: 'EKG Technician',
        image: '../assets/career/dms/ekg.png',
        icon: '💓',
        officialUrl: 'https://dmscare.org/ko/pages/ekg-technician-cet-program',
        duration: '2개월 과정',
        certPrepKo: 'NHA CET 자격증 준비',
        format: ['Online Learning', '학교 Hands-on 실습 1일', '실제 EKG 장비 사용', '12-Lead Electrode Placement 실습'],
        shortIntro: '',
        whatYouLearn: ['심장의 구조와 혈액순환', '심장의 전기전도 시스템', 'P Wave', 'QRS Complex', 'T Wave', '심박수', '기본 EKG Rhythm', '12-Lead EKG 검사', '전극 부착 위치', '정상·비정상 심장 리듬 기초', 'Artifact 확인', '환자 준비 및 검사 안전'],
        certification: { code: 'NHA CET', name: 'Certified EKG Technician' },
        audience: [],
        careerFields: ['병원', '심장내과', '개인병원 및 Clinic', 'Outpatient Center', 'Diagnostic Testing Center', '기타 EKG 검사 의료기관']
      },
      {
        id: 'pharmacy',
        nameKo: '약국기술자',
        nameEn: 'Pharmacy Technician',
        image: '../assets/career/dms/pharmacy.png',
        icon: '💊',
        officialUrl: 'https://dmscare.org/ko/pages/pharmacy-technician-cpht-program',
        duration: '3개월 과정',
        certPrepKo: 'NHA ExCPT 자격증 준비',
        format: ['온라인 수업 + 동영상 강의', 'Live Zoom', '한국인 강사의 한국어 설명', '별도의 학교 대면 실습 없음'],
        shortIntro: '',
        whatYouLearn: ['약 이름 및 기본 약리학', '처방전 읽기와 처리', '약 용량 계산', '약품 준비 및 조제 보조', '약국법과 환자 안전', '약품 보관 및 재고관리', '보험 및 처방 관련 기본 업무'],
        certification: { code: 'NHA ExCPT', name: 'Certified Pharmacy Technician (CPhT)' },
        audience: [],
        careerFields: ['Retail Pharmacy', 'Hospital Pharmacy', 'Grocery / Retail Store Pharmacy', 'Specialty Pharmacy', 'Mail-Order Pharmacy', '기타 Pharmacy 관련 의료기관']
      },
      {
        id: 'billing-coding',
        nameKo: '의료보험 청구 & 코딩',
        nameEn: 'Medical Billing & Coding Specialist',
        image: '../assets/career/dms/billing-coding.png',
        icon: '🧾',
        officialUrl: 'https://dmscare.org/ko/pages/medical-billing-amp-coding-specialist-cbcs',
        duration: '2개월 과정',
        certPrepKo: 'NHA CBCS 자격증 준비',
        format: ['100% Online Self-Paced', '학교 출석 및 대면 실습 없음'],
        shortIntro: '환자의 진료기록을 바탕으로 의료서비스를 코드로 분류하고 보험 청구 및 의료비 정산 업무를 배우는 의료행정 과정입니다.',
        whatYouLearn: ['의학용어 및 해부생리 기초', '진료기록 및 의료문서 이해', 'ICD-10-CM 진단코드', 'CPT 및 HCPCS 코드', '의료보험 청구', 'Billing 및 Payment Process', 'Claim 오류 및 Denial 기초', 'HIPAA 및 환자정보 보호'],
        certification: { code: 'NHA CBCS', name: 'Certified Billing & Coding Specialist' },
        audience: [],
        careerFields: ['병원 및 Medical Center', '개인병원 및 Clinic', 'Medical Billing Company', "Physician's Office", 'Healthcare Administrative Office', '보험청구 관련 업무', '일부 Remote 직무'],
        remoteNote: 'Remote 근무 가능 여부는 경력과 고용기관의 채용조건에 따라 달라질 수 있습니다.'
      }
    ]
  }
];

window.getCareerPartner = function (partnerId) {
  return window.CAREER_PARTNERS.find(function (partner) { return partner.id === partnerId; }) || null;
};
window.getCareerProgram = function (partnerId, programId) {
  var partner = window.getCareerPartner(partnerId);
  if (!partner) return null;
  var program = partner.programs.find(function (p) { return p.id === programId; });
  return program ? { partner: partner, program: program } : null;
};
