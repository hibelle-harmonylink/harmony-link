// HarmonyLink YouTube Income Lab (유튜브 수익화 랩) - shared data
// Single source of truth for brand copy, pricing, questions, channel types,
// and the scoring rules used by assessment.html / result.html / index.html.
// Edit PRICING here to change prices everywhere without touching page markup.
window.YTLAB = (function () {

  var BRAND = {
    nameKo: '유튜브 수익화 랩',
    nameEn: 'YouTube Income Lab',
    fullNameKo: 'HarmonyLink 유튜브 수익화 랩',
    fullNameEn: 'HarmonyLink YouTube Income Lab',
    parentKo: 'Harmony Link · 이음문화센터',
    disclaimerShort: '유튜브 수익은 채널 주제, 콘텐츠 품질, 시청자 반응, 실행 지속성, YouTube 정책 등에 따라 달라지며 어떠한 수익도 보장되지 않습니다.',
    contactEmail: 'hibelle@hibelleconsulting.com',
    formsubmitEndpoint: 'https://formsubmit.co/ajax/hibelle@hibelleconsulting.com'
  };

  // ---------------------------------------------------------------------
  // PRICING — edit this block only to change prices site-wide (MVP: 제안 가격)
  // ---------------------------------------------------------------------
  var PRICING = {
    lastUpdated: '2026-08-22',
    currency: 'USD',
    note: '아래 가격은 현재 제안 가격이며 최종 가격은 상담을 통해 확정됩니다.',
    plans: {
      start: {
        id: 'start',
        key: 'START',
        nameKo: '유튜브 시작 기초 프로그램',
        priceMin: 49,
        priceMax: 79,
        priceLabel: '$49 ~ $79',
        priceUnitKo: '/ 프로그램',
        priceNoteKo: '제안 가격 · 상담 후 최종 확정',
        bestForKo: '이제 막 시작하려는 분, 방향부터 잡고 싶은 분',
        includes: [
          '채널 주제 선정',
          '타깃 시청자 설정',
          '채널명 및 소개문 작성',
          '콘텐츠 아이디어 도출',
          'AI를 활용한 대본 작성 기초',
          '썸네일 기본 제작',
          'Shorts 제작 기본',
          '30일 콘텐츠 계획'
        ]
      },
      build: {
        id: 'build',
        key: 'BUILD',
        nameKo: '유튜브 실행 프로그램',
        priceMin: 149,
        priceMax: 249,
        priceLabel: '$149 ~ $249',
        priceUnitKo: '/ 프로그램',
        priceNoteKo: '제안 가격 · 상담 후 최종 확정',
        bestForKo: '실제로 채널을 세팅하고 꾸준히 운영해보고 싶은 분',
        includesNote: 'START 프로그램 전체 포함',
        includes: [
          '채널 세팅',
          '영상 제작 workflow 구축',
          'ChatGPT 활용법',
          'Canva 활용법',
          'CapCut 활용법',
          'Shorts 제작 실습',
          '제목 · 설명 · 키워드 작성법',
          '업로드 루틴 만들기',
          '기초 분석(애널리틱스) 이해',
          '30일 실행 체크리스트'
        ]
      },
      coach: {
        id: 'coach',
        key: 'COACH',
        nameKo: '1:1 또는 소규모 코칭 프로그램',
        priceMin: 399,
        priceMax: null,
        priceLabel: '$399~',
        priceUnitKo: '/ 코칭 프로그램',
        priceNoteKo: '범위와 기간에 따라 상담 후 확정',
        bestForKo: '개인 채널을 직접 진단받고 첫 영상까지 완성하고 싶은 분',
        includesNote: 'BUILD 프로그램 전체 포함',
        includes: [
          '개인 채널 분석',
          '주제 및 포지셔닝 코칭',
          '콘텐츠 전략 수립',
          '실제 첫 영상 제작 지원',
          '피드백 세션',
          '일정 기간 1:1 또는 소규모 코칭'
        ]
      }
    }
  };

  // ---------------------------------------------------------------------
  // QUESTIONS — 10문항, 모바일/시니어 친화적으로 한 화면에 1문항씩 노출
  // type: 'single' | 'multi'
  // ---------------------------------------------------------------------
  var QUESTIONS = [
    {
      id: 'experience',
      type: 'single',
      titleKo: '유튜브 채널을 운영해 본 경험이 있으신가요?',
      options: [
        { value: 'none', labelKo: '전혀 없습니다' },
        { value: 'watched', labelKo: '시청만 하고 운영해본 적은 없습니다' },
        { value: 'tried', labelKo: '시도했지만 중단한 적이 있습니다' },
        { value: 'running', labelKo: '현재 채널을 운영 중입니다' }
      ]
    },
    {
      id: 'digitalAi',
      type: 'single',
      titleKo: '스마트폰·컴퓨터와 AI 도구를 활용하는 수준은 어느 정도인가요?',
      helpKo: 'ChatGPT, Canva 같은 AI·디지털 도구 사용 경험을 기준으로 답해주세요.',
      options: [
        { value: 'basic', labelKo: '기본적인 스마트폰 사용 정도입니다' },
        { value: 'moderate', labelKo: 'ChatGPT 등 AI 도구를 가끔 사용해봤습니다' },
        { value: 'advanced', labelKo: '여러 AI·디지털 도구를 능숙하게 다룹니다' }
      ]
    },
    {
      id: 'faceReveal',
      type: 'single',
      titleKo: '영상에 얼굴을 공개할 수 있으신가요?',
      options: [
        { value: 'yes', labelKo: '얼굴 공개가 가능합니다' },
        { value: 'partial', labelKo: '손·실루엣 등 부분 공개만 가능합니다' },
        { value: 'no', labelKo: '얼굴 공개를 원하지 않습니다' }
      ]
    },
    {
      id: 'voiceReveal',
      type: 'single',
      titleKo: '영상에 본인 목소리를 사용할 수 있으신가요?',
      options: [
        { value: 'yes', labelKo: '제 목소리로 직접 설명할 수 있습니다' },
        { value: 'ai', labelKo: 'AI 음성이나 더빙을 활용하고 싶습니다' },
        { value: 'captions', labelKo: '음성 없이 자막 위주로 만들고 싶습니다' }
      ]
    },
    {
      id: 'expertiseAreas',
      type: 'multi',
      titleKo: '보유하신 경험이나 전문 분야를 모두 선택해주세요',
      helpKo: '여러 개를 선택할 수 있습니다.',
      options: [
        { value: 'parenting', labelKo: '육아 · 자녀교육' },
        { value: 'cooking', labelKo: '요리 · 살림' },
        { value: 'finance', labelKo: '재테크 · 금융' },
        { value: 'it_ai', labelKo: 'IT · AI · 디지털' },
        { value: 'language', labelKo: '외국어 · 통번역' },
        { value: 'fitness_health', labelKo: '운동 · 건강' },
        { value: 'art_craft', labelKo: '미술 · 공예 · 음악' },
        { value: 'real_estate', labelKo: '부동산 · 세무' },
        { value: 'senior_care', labelKo: '시니어 케어 · 상담' },
        { value: 'business', labelKo: '사업 · 자영업 · 창업' },
        { value: 'other', labelKo: '기타 / 아직 없음' }
      ]
    },
    {
      id: 'interests',
      type: 'multi',
      titleKo: '평소 관심 있는 콘텐츠 주제를 모두 선택해주세요',
      helpKo: '여러 개를 선택할 수 있습니다.',
      options: [
        { value: 'info_tips', labelKo: '정보 · 꿀팁' },
        { value: 'vlog', labelKo: '브이로그 · 일상' },
        { value: 'education', labelKo: '교육 · 강의' },
        { value: 'review', labelKo: '제품 · 서비스 리뷰' },
        { value: 'healing', labelKo: '힐링 · 명상 · 음악' },
        { value: 'entertainment', labelKo: '코미디 · 엔터테인먼트' },
        { value: 'news', labelKo: '뉴스 · 시사' },
        { value: 'local', labelKo: '지역 정보 · 지역 비즈니스' }
      ]
    },
    {
      id: 'timeWeekly',
      type: 'single',
      titleKo: '유튜브 제작에 주당 투입할 수 있는 시간은 어느 정도인가요?',
      options: [
        { value: 'lt2', labelKo: '주 2시간 미만' },
        { value: '2to5', labelKo: '주 2~5시간' },
        { value: '5to10', labelKo: '주 5~10시간' },
        { value: 'gt10', labelKo: '주 10시간 이상' }
      ]
    },
    {
      id: 'videoSkill',
      type: 'single',
      titleKo: '영상 촬영·편집 경험은 어느 정도인가요?',
      options: [
        { value: 'none', labelKo: '전혀 없습니다' },
        { value: 'phone', labelKo: '스마트폰으로 간단히 찍고 편집할 수 있습니다' },
        { value: 'tool', labelKo: 'CapCut 등 편집 툴을 사용할 수 있습니다' },
        { value: 'pro', labelKo: '전문적인 촬영·편집이 가능합니다' }
      ]
    },
    {
      id: 'budget',
      type: 'single',
      titleKo: '채널 시작에 사용할 수 있는 초기 예산은 어느 정도인가요?',
      options: [
        { value: 'zero', labelKo: '무료 도구만 사용하고 싶습니다' },
        { value: 'lt50', labelKo: '$50 미만' },
        { value: '50to200', labelKo: '$50 ~ $200' },
        { value: 'gt200', labelKo: '$200 이상' }
      ]
    },
    {
      id: 'goal',
      type: 'single',
      titleKo: '유튜브 채널 운영의 가장 큰 목표는 무엇인가요?',
      options: [
        { value: 'hobby', labelKo: '취미로 즐겁게 해보고 싶습니다' },
        { value: 'promotion', labelKo: '내 사업 · 활동을 홍보하고 싶습니다' },
        { value: 'income', labelKo: '부수입을 만들어보고 싶습니다' },
        { value: 'business', labelKo: '본격적으로 사업화하고 싶습니다' }
      ]
    }
  ];

  // ---------------------------------------------------------------------
  // CHANNEL TYPES — 결과 화면에 노출되는 채널 유형 상세 정보
  // ---------------------------------------------------------------------
  var CHANNEL_TYPES = {
    faceless: {
      id: 'faceless',
      nameKo: '얼굴 없는 정보형 채널',
      emoji: '🎙️',
      summaryKo: '얼굴을 공개하지 않고 정보·꿀팁 중심 콘텐츠로 운영하는 채널입니다.',
      difficultyKo: '중',
      equipment: ['스마트폰 또는 PC', '무료 화면 녹화 · 편집 도구', '이미지 · 영상 소스(무료 스톡)'],
      aiTools: ['ChatGPT (대본 작성)', 'Canva (썸네일)', 'CapCut (편집)', 'AI 음성 합성(TTS, 선택)'],
      skills: ['정보 리서치', '기본 영상 편집', '제목 · 키워드 작성'],
      contentIdeas: [
        '내 분야에서 사람들이 가장 많이 검색하는 질문 Top 5 정리',
        '초보자가 흔히 하는 실수 5가지와 해결법',
        '이번 주 알아두면 유용한 정보 3가지',
        '실제 경험을 바탕으로 한 비교/추천 콘텐츠',
        '자주 받는 질문(FAQ) 답변 시리즈'
      ]
    },
    expertise: {
      id: 'expertise',
      nameKo: '경험 · 전문지식 교육 채널',
      emoji: '🎓',
      summaryKo: '본인의 경험과 전문 지식을 바탕으로 시청자를 가르치고 돕는 채널입니다.',
      difficultyKo: '중',
      equipment: ['스마트폰 또는 웹캠', '마이크(선택)', '조명(선택)'],
      aiTools: ['ChatGPT (강의안 구성)', 'Canva (슬라이드 · 썸네일)', 'CapCut (편집)'],
      skills: ['설명하는 능력', '커리큘럼 구성', '기본 촬영'],
      contentIdeas: [
        '내 전문 분야를 처음 접하는 사람을 위한 입문 강의',
        '가장 많이 받는 질문 Top 5 답변',
        '경험에서 나온 실전 노하우 공유',
        '단계별 미니 강좌 시리즈 1편',
        '흔한 오해와 진실 바로잡기'
      ]
    },
    local_biz: {
      id: 'local_biz',
      nameKo: '지역 비즈니스 · 전문가 채널',
      emoji: '🏘️',
      summaryKo: '내 사업이나 전문 서비스를 지역 고객에게 알리는 채널입니다.',
      difficultyKo: '하',
      equipment: ['스마트폰', '매장 · 현장 촬영 공간'],
      aiTools: ['ChatGPT (홍보 문구)', 'Canva (홍보 이미지)', 'CapCut (짧은 홍보 영상)'],
      skills: ['간단한 촬영', '고객 관점 설명', '지역 정보 정리'],
      contentIdeas: [
        '우리 매장 · 서비스 소개 영상',
        '고객이 자주 묻는 질문 답변',
        '지역 정보와 연계한 콘텐츠',
        '실제 이용 후기 · 비포애프터',
        '이벤트 · 프로모션 안내 영상'
      ]
    },
    ai_creator: {
      id: 'ai_creator',
      nameKo: 'AI 활용 정보형 채널',
      emoji: '🤖',
      summaryKo: 'AI 도구를 적극 활용해 적은 시간으로 정보 콘텐츠를 제작하는 채널입니다.',
      difficultyKo: '중',
      equipment: ['스마트폰 또는 PC'],
      aiTools: ['ChatGPT (대본 · 리서치)', 'AI 이미지 생성 도구', 'AI 음성 합성(TTS)', 'CapCut (자동 자막 · 편집)'],
      skills: ['AI 프롬프트 작성', '정보 검증', '기본 편집'],
      contentIdeas: [
        'AI로 정리한 이번 주 이슈 요약',
        'AI 도구로 만든 정보 카드뉴스형 영상',
        '실생활에 바로 쓰는 AI 활용 팁',
        'AI로 리서치한 비교 콘텐츠',
        '자주 묻는 질문을 AI와 함께 정리한 답변 영상'
      ]
    },
    interview: {
      id: 'interview',
      nameKo: '인터뷰 · 스토리 채널',
      emoji: '🎤',
      summaryKo: '본인 또는 다른 사람의 이야기를 인터뷰·스토리 형식으로 전달하는 채널입니다.',
      difficultyKo: '중상',
      equipment: ['카메라 또는 스마트폰', '마이크', '조명'],
      aiTools: ['ChatGPT (질문지 구성)', 'CapCut (인터뷰 편집)', 'Canva (썸네일)'],
      skills: ['인터뷰 진행', '스토리 구성', '편집'],
      contentIdeas: [
        '나의 이야기를 담은 자기소개 영상',
        '주변 사람 인터뷰 시리즈 1편',
        '한 가지 주제에 대한 다양한 사람들의 생각',
        '어려움을 극복한 경험 스토리',
        '시청자 사연을 소개하는 코너'
      ]
    },
    shorts: {
      id: 'shorts',
      nameKo: 'Shorts 중심 채널',
      emoji: '⚡',
      summaryKo: '짧고 빠른 Shorts 형식으로 가볍게 시작하는 채널입니다.',
      difficultyKo: '하',
      equipment: ['스마트폰'],
      aiTools: ['CapCut (Shorts 자동 편집 · 자막)', 'ChatGPT (짧은 대본)', 'Canva (썸네일)'],
      skills: ['짧은 기획', '스마트폰 촬영', '트렌드 파악'],
      contentIdeas: [
        '15~30초 안에 전달하는 꿀팁 하나',
        '트렌드 챌린지에 내 콘텐츠 접목하기',
        '한 줄 질문에 한 줄 답변 시리즈',
        'Before & After 짧은 영상',
        '일상 속 작은 정보 공유'
      ]
    },
    lecture: {
      id: 'lecture',
      nameKo: '강의 · 교육형 채널',
      emoji: '📚',
      summaryKo: '체계적인 커리큘럼을 갖춘 강의 형식으로 깊이 있게 가르치는 채널입니다.',
      difficultyKo: '상',
      equipment: ['카메라 또는 웹캠', '마이크', '슬라이드/화면 녹화 도구'],
      aiTools: ['ChatGPT (커리큘럼 설계)', 'Canva (강의 슬라이드)', 'CapCut (편집)'],
      skills: ['커리큘럼 설계', '강의 진행', '체계적인 편집'],
      contentIdeas: [
        '전체 커리큘럼 소개 오리엔테이션 영상',
        '1강: 기초 개념 정리',
        '실습 위주의 따라하기 강의',
        '수강생이 자주 묻는 질문 모음',
        '한 주제를 심화하는 다음 단계 강의'
      ]
    }
  };

  // 채널 유형 판별 규칙: base + 조건별 가중치, 최종 0~100 사이로 clamp
  var CHANNEL_RULES = {
    faceless: { base: 30, rules: [
      { points: 25, reasonKo: '얼굴 공개를 원하지 않는다고 답변해 주셨습니다.', check: function (a) { return a.faceReveal === 'no'; } },
      { points: 10, reasonKo: '목소리 공개도 부담스러워하셔서 자막 · AI 음성 형식이 잘 맞습니다.', check: function (a) { return a.voiceReveal !== 'yes'; } },
      { points: 15, reasonKo: '정보 · 꿀팁 콘텐츠에 관심이 있다고 답변해 주셨습니다.', check: function (a) { return a.interests.indexOf('info_tips') !== -1; } },
      { points: 10, reasonKo: '투입 가능한 시간이 많지 않아도 시작할 수 있는 형식입니다.', check: function (a) { return a.timeWeekly === 'lt2' || a.timeWeekly === '2to5'; } },
      { points: 10, reasonKo: '초기 예산이 크지 않아도 시작할 수 있습니다.', check: function (a) { return a.budget === 'zero' || a.budget === 'lt50'; } }
    ]},
    expertise: { base: 25, rules: [
      { points: 25, reasonKo: '보유하신 전문 분야가 있다고 답변해 주셨습니다.', check: function (a) { return a.expertiseAreas.length > 0 && a.expertiseAreas.indexOf('other') === -1; } },
      { points: 15, reasonKo: '교육 · 강의 형식의 콘텐츠에 관심이 있다고 답변해 주셨습니다.', check: function (a) { return a.interests.indexOf('education') !== -1; } },
      { points: 15, reasonKo: '얼굴 또는 목소리 공개가 가능하다고 답변해 주셨습니다.', check: function (a) { return a.faceReveal !== 'no' || a.voiceReveal === 'yes'; } },
      { points: 10, reasonKo: '부수입 또는 사업화를 목표로 하고 계십니다.', check: function (a) { return a.goal === 'income' || a.goal === 'business'; } },
      { points: 10, reasonKo: '주당 투입 가능한 시간이 비교적 여유로우십니다.', check: function (a) { return a.timeWeekly === '5to10' || a.timeWeekly === 'gt10'; } }
    ]},
    local_biz: { base: 20, rules: [
      { points: 25, reasonKo: '사업 · 자영업 또는 부동산 관련 경험이 있다고 답변해 주셨습니다.', check: function (a) { return a.expertiseAreas.indexOf('business') !== -1 || a.expertiseAreas.indexOf('real_estate') !== -1; } },
      { points: 20, reasonKo: '지역 정보 · 지역 비즈니스 콘텐츠에 관심이 있다고 답변해 주셨습니다.', check: function (a) { return a.interests.indexOf('local') !== -1; } },
      { points: 20, reasonKo: '채널 운영 목표가 홍보라고 답변해 주셨습니다.', check: function (a) { return a.goal === 'promotion'; } },
      { points: 10, reasonKo: '주당 투입 가능한 시간이 많지 않아도 운영할 수 있는 형식입니다.', check: function (a) { return a.timeWeekly === 'lt2' || a.timeWeekly === '2to5'; } },
      { points: 5, reasonKo: '얼굴 공개가 가능하다고 답변해 주셨습니다.', check: function (a) { return a.faceReveal === 'yes'; } }
    ]},
    ai_creator: { base: 25, rules: [
      { points: 25, reasonKo: 'AI · 디지털 도구를 능숙하게 다룬다고 답변해 주셨습니다.', check: function (a) { return a.digitalAi === 'advanced'; } },
      { points: 15, reasonKo: '얼굴 공개를 원하지 않는다고 답변해 주셨습니다.', check: function (a) { return a.faceReveal === 'no'; } },
      { points: 15, reasonKo: '주당 투입 가능한 시간이 많지 않다고 답변해 주셨습니다.', check: function (a) { return a.timeWeekly === 'lt2' || a.timeWeekly === '2to5'; } },
      { points: 10, reasonKo: '초기 예산을 크게 들이지 않기를 원하십니다.', check: function (a) { return a.budget === 'zero' || a.budget === 'lt50'; } },
      { points: 10, reasonKo: 'IT · AI 분야에 관심 또는 경험이 있다고 답변해 주셨습니다.', check: function (a) { return a.expertiseAreas.indexOf('it_ai') !== -1; } }
    ]},
    interview: { base: 20, rules: [
      { points: 25, reasonKo: '얼굴과 목소리 공개가 모두 가능하다고 답변해 주셨습니다.', check: function (a) { return a.faceReveal === 'yes' && a.voiceReveal === 'yes'; } },
      { points: 20, reasonKo: '브이로그 · 스토리 · 엔터테인먼트 콘텐츠에 관심이 있다고 답변해 주셨습니다.', check: function (a) { return a.interests.indexOf('vlog') !== -1 || a.interests.indexOf('entertainment') !== -1; } },
      { points: 15, reasonKo: '주당 투입 가능한 시간이 비교적 여유로우십니다.', check: function (a) { return a.timeWeekly === '5to10' || a.timeWeekly === 'gt10'; } },
      { points: 10, reasonKo: '영상 촬영 · 편집 경험이 있다고 답변해 주셨습니다.', check: function (a) { return a.videoSkill === 'tool' || a.videoSkill === 'pro'; } }
    ]},
    shorts: { base: 30, rules: [
      { points: 25, reasonKo: '주당 투입 가능한 시간이 2시간 미만이라고 답변해 주셨습니다.', check: function (a) { return a.timeWeekly === 'lt2'; } },
      { points: 15, reasonKo: '영상 제작 경험이 아직 없거나 스마트폰 정도라고 답변해 주셨습니다.', check: function (a) { return a.videoSkill === 'none' || a.videoSkill === 'phone'; } },
      { points: 15, reasonKo: '유튜브 운영 경험이 아직 없거나 시도만 해보셨습니다.', check: function (a) { return a.experience === 'none' || a.experience === 'tried'; } },
      { points: 10, reasonKo: '홍보 또는 부수입을 목표로 가볍게 시작하고 싶어 하십니다.', check: function (a) { return a.goal === 'promotion' || a.goal === 'income'; } },
      { points: 5, reasonKo: '초기 예산을 크게 들이지 않기를 원하십니다.', check: function (a) { return a.budget === 'zero' || a.budget === 'lt50'; } }
    ]},
    lecture: { base: 15, rules: [
      { points: 25, reasonKo: '두 가지 이상의 전문 분야 경험이 있다고 답변해 주셨습니다.', check: function (a) { return a.expertiseAreas.filter(function(v){return v!=='other';}).length >= 2; } },
      { points: 20, reasonKo: '얼굴 공개가 가능하다고 답변해 주셨습니다.', check: function (a) { return a.faceReveal === 'yes'; } },
      { points: 20, reasonKo: '사업화를 목표로 하고 계십니다.', check: function (a) { return a.goal === 'business'; } },
      { points: 15, reasonKo: '주당 투입 가능한 시간이 10시간 이상이라고 답변해 주셨습니다.', check: function (a) { return a.timeWeekly === 'gt10'; } },
      { points: 5, reasonKo: '교육 · 강의 콘텐츠에 관심이 있다고 답변해 주셨습니다.', check: function (a) { return a.interests.indexOf('education') !== -1; } }
    ]}
  };

  // 프로그램(START/BUILD/COACH) 추천 규칙
  var PLAN_RULES = {
    start: [
      { points: 35, reasonKo: '채널 운영 목표를 "취미"로 답변해 주셨습니다.', check: function (a) { return a.goal === 'hobby'; } },
      { points: 20, reasonKo: '유튜브 운영 경험이 아직 없다고 답변해 주셨습니다.', check: function (a) { return a.experience === 'none'; } },
      { points: 15, reasonKo: '초기 예산을 무료 도구 위주로 사용하고 싶다고 답변해 주셨습니다.', check: function (a) { return a.budget === 'zero'; } },
      { points: 15, reasonKo: '주당 투입 가능한 시간이 2시간 미만이라고 답변해 주셨습니다.', check: function (a) { return a.timeWeekly === 'lt2'; } },
      { points: 15, reasonKo: '영상 제작 경험이 아직 없다고 답변해 주셨습니다.', check: function (a) { return a.videoSkill === 'none'; } }
    ],
    build: [
      { points: 30, reasonKo: '부수입 만들기 또는 홍보를 목표로 하고 계십니다.', check: function (a) { return a.goal === 'income' || a.goal === 'promotion'; } },
      { points: 20, reasonKo: '주당 2~10시간 정도를 투입할 수 있다고 답변해 주셨습니다.', check: function (a) { return a.timeWeekly === '2to5' || a.timeWeekly === '5to10'; } },
      { points: 20, reasonKo: '초기 예산으로 $50~$200 정도를 고려하고 계십니다.', check: function (a) { return a.budget === '50to200' || a.budget === 'lt50'; } },
      { points: 15, reasonKo: '유튜브를 시도해본 경험이 있어 다음 단계로 나아갈 준비가 되어 있습니다.', check: function (a) { return a.experience === 'tried' || a.experience === 'watched'; } },
      { points: 15, reasonKo: '스마트폰 촬영 또는 편집 툴 사용 경험이 있다고 답변해 주셨습니다.', check: function (a) { return a.videoSkill === 'phone' || a.videoSkill === 'tool'; } }
    ],
    coach: [
      { points: 35, reasonKo: '유튜브를 본격적으로 사업화하고 싶다고 답변해 주셨습니다.', check: function (a) { return a.goal === 'business'; } },
      { points: 20, reasonKo: '이미 채널을 운영 중이며 다음 단계를 원하고 계십니다.', check: function (a) { return a.experience === 'running'; } },
      { points: 20, reasonKo: '초기 예산으로 $200 이상을 고려하고 계십니다.', check: function (a) { return a.budget === 'gt200'; } },
      { points: 15, reasonKo: '주당 10시간 이상을 투입할 수 있다고 답변해 주셨습니다.', check: function (a) { return a.timeWeekly === 'gt10'; } },
      { points: 10, reasonKo: '전문 분야 경험이 풍부해 1:1 코칭에서 큰 도움을 받을 수 있습니다.', check: function (a) { return a.expertiseAreas.filter(function(v){return v!=='other';}).length >= 2; } }
    ]
  };

  function scoreWithRules(ruleset, base, answers) {
    var score = base;
    var reasons = [];
    ruleset.forEach(function (rule) {
      if (rule.check(answers)) {
        score += rule.points;
        reasons.push(rule.reasonKo);
      }
    });
    score = Math.max(0, Math.min(100, score));
    return { score: score, reasons: reasons };
  }

  function normalizeAnswers(raw) {
    var a = {};
    QUESTIONS.forEach(function (q) {
      if (q.type === 'multi') {
        a[q.id] = Array.isArray(raw[q.id]) ? raw[q.id] : [];
      } else {
        a[q.id] = raw[q.id] || '';
      }
    });
    return a;
  }

  function evaluate(rawAnswers) {
    var answers = normalizeAnswers(rawAnswers);

    var channelResults = Object.keys(CHANNEL_TYPES).map(function (id) {
      var rules = CHANNEL_RULES[id];
      var result = scoreWithRules(rules.rules, rules.base, answers);
      return {
        id: id,
        type: CHANNEL_TYPES[id],
        score: result.score,
        reasons: result.reasons.slice(0, 5)
      };
    }).sort(function (x, y) { return y.score - x.score; });

    var planResults = Object.keys(PLAN_RULES).map(function (id) {
      var result = scoreWithRules(PLAN_RULES[id], 0, answers);
      return {
        id: id,
        plan: PRICING.plans[id],
        score: result.score,
        reasons: result.reasons.slice(0, 5)
      };
    }).sort(function (x, y) { return y.score - x.score; });

    return {
      answers: answers,
      channelTop3: channelResults.slice(0, 3),
      planTop: planResults[0],
      planSecond: planResults[1],
      budgetRangeKo: budgetRangeCopy(answers),
      cautionsKo: cautionsCopy(answers)
    };
  }

  function budgetRangeCopy(answers) {
    var top = null;
    if (answers.budget === 'zero') return '$0 (무료 도구만 사용)';
    if (answers.budget === 'lt50') return '약 $0 ~ $50 (무료 도구 + 간단한 유료 도구)';
    if (answers.budget === '50to200') return '약 $50 ~ $200 (편집 툴, 소품, 마이크 등)';
    return '약 $200 이상 (장비, 편집 툴, 외주 등 확장 가능)';
  }

  function cautionsCopy(answers) {
    var list = [
      'YouTube 수익은 채널 주제, 콘텐츠 품질, 시청자 반응, 실행 지속성, YouTube 정책 등 여러 요인에 따라 달라지며 특정 금액이나 기간을 보장하지 않습니다.',
      '수익화 조건(구독자 · 시청시간 등)은 YouTube 정책에 따라 계속 바뀔 수 있으니 최신 정책을 함께 확인해야 합니다.',
      '초반에는 조회수나 반응이 적을 수 있으며, 꾸준한 업로드와 개선이 결과보다 우선되어야 합니다.'
    ];
    if (answers.faceReveal !== 'yes') {
      list.push('얼굴을 공개하지 않는 채널은 시청자와의 신뢰 형성에 시간이 더 걸릴 수 있습니다.');
    }
    if (answers.timeWeekly === 'lt2') {
      list.push('주당 투입 시간이 적을수록 업로드 주기가 길어질 수 있어, 콘텐츠 형식을 최대한 간단하게 유지하는 것이 좋습니다.');
    }
    return list;
  }

  var DAY7_PLAN = [
    { label: 'Day 1', textKo: '채널 주제와 타깃 시청자 정하기' },
    { label: 'Day 2', textKo: '채널명 · 채널 소개 문구 작성하기' },
    { label: 'Day 3', textKo: '참고할 채널 3곳을 분석하고 벤치마킹 포인트 정리하기' },
    { label: 'Day 4', textKo: '첫 콘텐츠 주제를 정하고 AI로 대본 초안 작성하기' },
    { label: 'Day 5', textKo: '촬영하거나 필요한 자료 · 이미지 준비하기' },
    { label: 'Day 6', textKo: '편집하고 썸네일 제작하기' },
    { label: 'Day 7', textKo: '첫 영상 업로드하고 채널 세팅 최종 점검하기' }
  ];

  var ROADMAP_30DAY = [
    { label: '1주차', textKo: '채널 기획 및 세팅 — 주제, 타깃, 채널명, 소개문 확정, 관련 채널 리서치' },
    { label: '2주차', textKo: '첫 콘텐츠 2~3개 제작 및 업로드 — 대본, 촬영, 편집, 썸네일' },
    { label: '3주차', textKo: '업로드 루틴 정착 — 댓글 응답, 초기 반응 확인, 콘텐츠 개선' },
    { label: '4주차', textKo: '콘텐츠 다양화 및 다음 30일 계획 수립 — 성과 리뷰, 필요 시 다음 단계 프로그램 검토' }
  ];

  return {
    BRAND: BRAND,
    PRICING: PRICING,
    QUESTIONS: QUESTIONS,
    CHANNEL_TYPES: CHANNEL_TYPES,
    DAY7_PLAN: DAY7_PLAN,
    ROADMAP_30DAY: ROADMAP_30DAY,
    evaluate: evaluate
  };
})();
