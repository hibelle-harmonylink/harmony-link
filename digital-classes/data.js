// HarmonyLink Digital Classes - shared data
// Single source of truth for the 6 category cards and their programs.
// Add a new program by pushing into a category's `programs` array; add a new
// category by pushing into DIGITAL_CATEGORIES. No HTML needs to change.
window.DIGITAL_CATEGORIES = (function () {

  var DIGITAL_FORM_URL = 'https://docs.google.com/forms/d/1DWtn1FQD86E4EHzABxeoEpHDuVeoFH_Smak4_C1RU7M/viewform';

  var DIGITAL_CATEGORIES = [
    {
      id: 'device',
      title: '기기활용',
      icon: '📱',
      image: '../assets/digital/device-class.png',
      shortDesc: '스마트폰부터 컴퓨터까지, 기초부터 차근차근 익히는 기기 활용 수업',
      accent: '#1155d9',
      programs: [
        {
          id: 'device-basic',
          title: '디지털 기기 활용반',
          tagline: '기초부터 차근차근! 내 기기를 내 손으로!',
          intro: '스마트폰과 컴퓨터, 다양한 기기를 직접 사용해보며 기본 기능부터 실생활 활용까지 배우는 수업입니다.',
          status: 'ready',
          steps: [
            { title: '스마트폰 활용', items: ['아이폰 · 갤럭시 기본 사용법', '화면 및 글자 크기, 소리 등 기본 설정', '사진 촬영 · 정리 · 공유', '앱 설치와 삭제', 'QR코드 사용'] },
            { title: '컴퓨터 활용', items: ['마우스 · 키보드 사용', '한글 · 영문 입력', '파일과 폴더 만들기', '저장 · 이동 · 삭제하기', '인터넷 기본 사용'] },
            { title: '기기 연결과 관리', items: ['Wi-Fi 연결', 'Bluetooth 사용', '스마트폰과 컴퓨터 연결', '사진과 파일 옮기기', '프린터 등 주변기기 사용', '기본적인 기기 관리와 문제 해결'] }
          ],
          audience: ['스마트폰 기능을 제대로 배우고 싶은 분', '컴퓨터 사용이 아직 익숙하지 않은 분', '사진이나 파일을 어디에 저장했는지 자주 찾게 되는 분', '새로운 기기를 사용할 때마다 막막한 분', '디지털 기초부터 차근차근 배우고 싶은 분'],
          note: '내 기기를 직접 사용하면서 배우는 실습 중심 수업입니다. 개인의 사용 수준에 맞춰 천천히 진행합니다.',
          cta: { type: 'form', url: DIGITAL_FORM_URL, label: '수업 문의 및 신청' }
        }
      ]
    },
    {
      id: 'documents',
      title: '문서작성',
      icon: '📝',
      image: '../assets/digital/document-class.png',
      shortDesc: '한글 입력부터 표 만들기, 저장과 공유까지 실습으로 배우는 문서작성',
      accent: '#0c4a9e',
      programs: [
        {
          id: 'document-basic',
          title: '디지털 문서작성반',
          tagline: '필요한 문서, 이제 직접 만들어보세요!',
          intro: '글자 입력부터 문서 정리, 표 만들기, 저장과 공유까지 생활과 업무에 필요한 문서작성 방법을 실습으로 배웁니다.',
          status: 'ready',
          steps: [
            { title: '문서작성 기초', items: ['한글 · 영문 입력', '글자 크기와 글꼴 변경', '문단 정렬과 줄 간격', '복사 · 붙여넣기', '실행 취소와 다시 실행'] },
            { title: '문서 꾸미기', items: ['제목과 본문 정리', '글머리 기호 사용', '표 만들기', '사진과 이미지 넣기', '보기 좋은 문서 구성하기'] },
            { title: '실생활 문서 만들기', items: ['안내문', '신청서', '간단한 편지', '일정표', '교육 및 모임 자료'] },
            { title: '파일 관리', items: ['문서 저장하기', '다른 이름으로 저장하기', 'PDF로 저장하기', '파일 찾기와 수정하기', '인쇄하기'] },
            { title: '문서 공유', items: ['이메일에 파일 첨부하기', '문서 다운로드 · 업로드', '링크로 공유하기', '클라우드에 저장하기'] },
            { title: '다양한 문서도구 활용', items: ['Microsoft Word 기초', 'Google Docs 기초', '상황에 맞는 문서도구 선택', '기존 문서 열어서 수정하기'] }
          ],
          audience: ['컴퓨터로 문서를 직접 작성하고 싶은 분', '문서 작성과 편집이 아직 익숙하지 않은 분', '안내문이나 신청서를 직접 만들고 싶은 분', '파일 저장과 첨부가 어려운 분', '업무나 단체 활동에 필요한 문서작성 능력을 배우고 싶은 분'],
          note: '초보자도 천천히 배울 수 있는 실습 중심 수업입니다. 생활에 필요한 예제로 학습하며, 개인 · 그룹 수업 모두 가능합니다.',
          cta: { type: 'form', url: DIGITAL_FORM_URL, label: '수업 문의 및 신청' }
        }
      ]
    },
    {
      id: 'design',
      title: '디자인',
      icon: '🎨',
      image: '../assets/digital/design-class.png',
      shortDesc: 'Canva로 쉽고 예쁘게! 전단지부터 SNS 이미지까지 직접 만드는 디자인 수업',
      accent: '#7c3aed',
      programs: [
        {
          id: 'design-basic',
          title: '디지털 디자인반',
          tagline: 'Canva로 쉽고 예쁘게! 직접 만들고 바로 활용하는 디자인 수업',
          intro: '전단지, 카드뉴스, 초대장, 포스터, SNS 이미지까지! 디자인 경험이 없어도 Canva를 활용해 멋진 디자인을 직접 만들어보는 실습 중심 수업입니다.',
          status: 'ready',
          steps: [
            { title: 'Canva 기초', items: ['Canva 기본 사용법', '템플릿 검색과 활용', '디자인 화면 살펴보기', '저장과 다운로드 방법'] },
            { title: '디자인 요소 활용', items: ['텍스트 추가와 꾸미기', '사진과 배경 사용', '아이콘과 도형 활용', '색상과 폰트 조합하기'] },
            { title: '다양한 디자인 만들기', items: ['전단지 · 포스터', '초대장 · 카드', '카드뉴스 · 배너', 'SNS 이미지 · 썸네일'] },
            { title: '저장과 공유', items: ['고화질 다운로드', 'PDF 저장하기', '링크 공유하기', '출력하고 활용하기'] }
          ],
          audience: ['디자인을 처음 시작하는 분', '전단지나 홍보물을 직접 만들고 싶은 분', 'SNS에 올릴 이미지를 만들고 싶은 분', '모임, 행사, 교회, 학교 등에서 디자인이 필요한 분', '예쁜 디자인을 쉽고 빠르게 만들고 싶은 분'],
          note: '직접 만들고 바로 사용하면서 배우는 실습 중심 수업입니다. 개인의 수준에 맞춰 차근차근 친절하게 진행합니다.',
          cta: { type: 'form', url: DIGITAL_FORM_URL, label: '수업 문의 및 신청' }
        }
      ]
    },
    {
      id: 'youtube',
      title: '유튜브',
      icon: '▶️',
      image: '../assets/digital/youtube-class.png',
      shortDesc: '기본 활용부터 나만의 콘텐츠 제작까지, 목적에 맞는 유튜브 프로그램',
      accent: '#e02424',
      programs: [
        {
          id: 'youtube-basic',
          title: '유튜브 활용반',
          tagline: '즐기고, 배우고, 나누는 유튜브! 쉽고 재미있게 배우세요!',
          intro: '유튜브를 더 편리하게 보고, 나만의 콘텐츠도 만들어보세요! 유튜브의 다양한 기능을 실습으로 배우는 수업입니다.',
          badge: '기초 교육 과정',
          status: 'ready',
          steps: [
            { title: '유튜브 기본 이해', items: ['유튜브란?', '유튜브 화면 살펴보기', '주요 기능 소개'] },
            { title: '검색과 시청', items: ['원하는 영상 검색하기', '재생, 일시정지, 자막', '화질 설정', '재생목록 만들기'] },
            { title: '구독과 알림 설정', items: ['채널 구독하기', '알림 설정하기', '좋아요와 댓글 남기기'] },
            { title: '공유와 저장', items: ['영상 공유하기', '링크 복사', '나중에 볼 영상 저장'] },
            { title: 'YouTube Shorts', items: ['Shorts란?', '짧은 영상 즐기기', 'Shorts 만들기 이해'] },
            { title: '영상 업로드 기초', items: ['계정 만들기', '영상 업로드 방법', '제목, 설명, 태그 입력', '공개 설정'] }
          ],
          audience: ['유튜브를 더 편리하게 이용하고 싶은 분', '좋아하는 채널을 구독하고 싶은 분', '쉽게 영상을 검색하고 보고 싶은 분', '여행, 요리, 건강 등 다양한 정보를 찾는 분', '자신의 영상이나 콘텐츠를 만들어 보고 싶은 분', '유튜브 기능을 제대로 배우고 싶은 분'],
          note: '직접 유튜브를 사용하면서 배우는 실습 중심 수업입니다. 개인의 사용 수준에 맞춰 천천히 진행합니다.',
          cta: { type: 'form', url: DIGITAL_FORM_URL, label: '수업 문의 및 신청' }
        },
        {
          id: 'youtube-business',
          title: '유튜브 콘텐츠 비즈니스 프로그램',
          tagline: '나의 지식 · 경험 · 정보를 콘텐츠로 만드는 실행 프로그램',
          intro: '유튜브 활용반을 넘어, 자신의 지식과 경험을 실제 채널과 콘텐츠로 연결하고 싶은 분을 위한 프로그램입니다.',
          badge: '콘텐츠 비즈니스 과정',
          status: 'ready',
          steps: [
            { title: '프로그램에서 다루는 내용', items: ['채널 주제 설정', '콘텐츠 아이디어 찾기', '채널 개설 및 기본 세팅', 'AI를 활용한 콘텐츠 기획', 'Canva 활용', '영상 제작 및 편집 기초', 'Shorts 제작', '업로드 루틴', '채널 성장 기초', '콘텐츠를 서비스 · 교육 · 상담 등 자신의 사업과 연결하는 방법'] }
          ],
          audience: ['본인의 지식 · 경험 · 전문성을 콘텐츠로 연결하고 싶은 분', 'AI를 활용해 콘텐츠 제작 시간을 줄이고 싶은 분', '얼굴을 공개하지 않고 채널을 운영하고 싶은 분', '소상공인, 강사, 자영업자 등 콘텐츠로 서비스를 알리고 싶은 분'],
          disclaimer: '"쉽게 돈 벌기", "수익 보장", "월 ○○ 수익" 같은 표현은 사용하지 않습니다. 유튜브 수익은 채널 주제, 콘텐츠 품질, 시청자 반응, 실행 지속성, YouTube 정책 등에 따라 달라집니다.',
          cta: { type: 'external', url: '../youtube-start/index.html', label: '프로그램 알아보기' },
          secondaryCta: { type: 'external', url: '../youtube-start/assessment.html', label: '무료 진단 시작하기' }
        }
      ]
    },
    {
      id: 'apps',
      title: 'SNS·실생활 앱',
      icon: '💬',
      image: '../assets/digital/apps-class.png',
      shortDesc: '카카오톡부터 모바일 뱅킹까지, 생활에 꼭 필요한 앱을 배우는 수업',
      accent: '#0f9d78',
      programs: [
        {
          id: 'apps-basic',
          title: 'SNS · 실생활 앱 활용반',
          tagline: '필요한 앱을 제대로 알고, 편리하게 사용해보세요!',
          intro: 'SNS로 소통하고, 지도 · 교통 · 예약 · 금융 · 쇼핑 등 일상에 꼭 필요한 앱을 쉽게 배워 실생활에 바로 활용하는 수업입니다.',
          status: 'ready',
          steps: [
            { title: 'SNS 활용', items: ['카카오톡 기본 사용법', '사진 · 동영상 보내기', '단체채팅, 파일 공유', '인스타그램 기초', '페이스북 기초'] },
            { title: '지도 · 교통 앱', items: ['Google Maps 사용', '길찾기, 장소검색', '대중교통 정보 확인', '실시간 교통 정보', '택시 · 우버 이용'] },
            { title: '예약 · 주문 앱', items: ['병원 · 식당 예약', '항공권 · 버스 · 기차 예매', '테이크아웃 · 배달 주문', '공연 · 티켓 예매', '예약 확인 및 취소'] },
            { title: '금융 · 결제 앱', items: ['모바일 뱅킹 사용', '계좌 조회 · 이체', '간편결제(Apple Pay 등)', '공과금 납부', '금융 보안과 안전 사용'] },
            { title: '쇼핑 · 할인 앱', items: ['온라인 쇼핑하기', '가격 비교 및 할인 찾기', '쿠폰 · 멤버십 활용', '장보기 앱 활용', '주문 확인 및 배송조회'] },
            { title: '생활 편의 앱', items: ['날씨 · 뉴스 확인', '번역기 앱 사용', 'QR코드 활용', '건강 관리 앱', '다양한 생활 앱 소개'] }
          ],
          audience: ['카카오톡, 인스타그램을 더 잘 사용하고 싶은 분', '지도나 교통앱 사용이 어려운 분', '예약이나 주문을 스마트폰으로 하고 싶은 분', '모바일 뱅킹이나 결제가 익숙하지 않은 분', 'SNS와 다양한 앱을 안전하게 사용하고 싶은 분', '일상생활을 더 편리하게 만들고 싶은 분'],
          note: '직접 스마트폰을 사용하면서 배우는 실습 중심 수업입니다. 개인의 사용 수준에 맞춰 천천히 진행합니다.',
          cta: { type: 'form', url: DIGITAL_FORM_URL, label: '수업 문의 및 신청' }
        }
      ]
    },
    {
      id: 'ai',
      title: 'AI',
      icon: '🤖',
      image: '../assets/digital/ai-class.png',
      shortDesc: 'AI 첫걸음부터 바이브코딩, 홈페이지 제작까지 - 계속 늘어나는 AI 프로그램',
      accent: '#4338ca',
      programs: [
        {
          id: 'ai-start',
          title: 'AI 시작하기 (기초반)',
          tagline: '생활과 업무 속에서 AI를 자신 있게 활용하는 첫걸음',
          intro: 'AI가 낯선 분도 ChatGPT 같은 도구를 직접 사용해보며 기초부터 차근차근 익히는 수업입니다.',
          status: 'ready',
          steps: [
            { title: '기초 과정', items: ['AI란 무엇인지 이해', 'ChatGPT 시작하기', '질문하는 방법', '글쓰기 및 요약', '검색과 정보 정리', '이미지 활용', '생활 속 AI 활용', '업무 속 AI 활용'] }
          ],
          audience: ['AI를 처음 접해보는 분', 'ChatGPT를 생활 속에서 활용하고 싶은 분', '업무에 AI를 적용해보고 싶은 분'],
          cta: { type: 'form', url: DIGITAL_FORM_URL, label: '수업 문의 및 신청' }
        },
        {
          id: 'ai-vibecoding',
          title: '바이브코딩 앱 만들기',
          tagline: '코딩을 잘 몰라도 AI와 함께 만드는 나만의 웹앱',
          intro: '코딩 경험이 없어도 AI의 도움을 받아 간단한 웹앱을 직접 만들어보는 프로그램입니다.',
          status: 'comingSoon',
          steps: [
            { title: '과정 구성 (예정)', items: ['아이디어 정리', '화면 구성', 'AI에게 코드 요청하는 방법', '기능 수정', '테스트', '간단한 배포 이해'] }
          ],
          audience: ['아이디어를 직접 웹앱으로 만들어보고 싶은 분', '코딩은 몰라도 AI로 무언가 만들어보고 싶은 분']
        },
        {
          id: 'ai-homepage',
          title: '홈페이지 만들기',
          tagline: 'AI와 함께 기획부터 제작까지, 나만의 홈페이지 만들기',
          intro: 'AI를 활용해 홈페이지를 기획하고 직접 제작 · 관리하는 방법을 배우는 프로그램입니다.',
          status: 'comingSoon',
          steps: [
            { title: '과정 구성 (예정)', items: ['AI를 활용한 홈페이지 기획', '메뉴와 페이지 구성', '디자인 방향 정하기', '콘텐츠 작성', '홈페이지 제작', '수정 및 관리', '기본 배포 이해'] }
          ],
          audience: ['개인 · 소상공인 홈페이지를 직접 만들어보고 싶은 분', '홈페이지 제작 과정을 이해하고 싶은 분']
        }
      ]
    }
  ];

  function getCategory(id) {
    for (var i = 0; i < DIGITAL_CATEGORIES.length; i++) {
      if (DIGITAL_CATEGORIES[i].id === id) return DIGITAL_CATEGORIES[i];
    }
    return null;
  }

  function getProgram(categoryId, programId) {
    var category = getCategory(categoryId);
    if (!category) return null;
    for (var i = 0; i < category.programs.length; i++) {
      if (category.programs[i].id === programId) return category.programs[i];
    }
    return null;
  }

  return {
    all: DIGITAL_CATEGORIES,
    getCategory: getCategory,
    getProgram: getProgram
  };
})();
