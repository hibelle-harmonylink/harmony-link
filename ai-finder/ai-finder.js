(() => {
  "use strict";

  const CATEGORY_IDS = ["digitalProduct", "knowledge", "social", "video", "marketing", "aiSupport", "localService"];
  const SCORE_QUESTION_WEIGHTS = [1.15, 1.25, 1.2, 0.75, 1, 0.95, 0.7, 0.85, 1];
  const SCORE_SCALE_MAX = SCORE_QUESTION_WEIGHTS.reduce((sum, weight) => sum + (weight * 5), 0);

  const questions = [
    {
      title: "디지털 기기를 어느 정도 사용할 수 있나요?",
      help: "스마트폰이나 컴퓨터를 사용할 때 가장 가까운 답을 선택해 주세요.",
      options: [
        { label: "전화, 문자, 카카오톡 정도만 사용해요", level: 1, scores: { localService: 4 } },
        { label: "검색, 사진, 쇼핑, 은행 앱을 사용할 수 있어요", level: 2, scores: { digitalProduct: 3, social: 3, marketing: 3, localService: 4 } },
        { label: "이메일, 문서 작성, 화상회의도 할 수 있어요", level: 3, scores: { digitalProduct: 5, knowledge: 4, social: 4, marketing: 4, aiSupport: 5, localService: 3 } },
        { label: "Canva, SNS 관리, 영상 편집 같은 도구도 사용해요", level: 4, scores: { digitalProduct: 5, knowledge: 4, social: 5, video: 5, marketing: 5, aiSupport: 4 } },
        { label: "새로운 앱이나 AI 도구도 스스로 익힐 수 있어요", level: 5, scores: { digitalProduct: 5, knowledge: 5, social: 5, video: 5, marketing: 5, aiSupport: 5, localService: 3 } }
      ]
    },
    {
      title: "다른 사람이 돈을 내고 배울 만한 경험이나 기술이 있나요?",
      help: "자격증이 없어도 괜찮습니다. 직장, 사업, 생활, 취미에서 얻은 경험도 포함됩니다.",
      multiple: true,
      maxSelections: 2,
      options: [
        { label: "아직 떠오르는 경험이나 기술이 없어요", level: 1, exclusive: true, scores: { social: 2, marketing: 2, aiSupport: 4 } },
        { label: "주변 사람에게 가끔 알려주는 정도예요", level: 2, scores: { digitalProduct: 3, knowledge: 3, social: 3, localService: 3 } },
        { label: "초보자에게 기본 내용을 설명할 수 있어요", level: 3, scores: { digitalProduct: 4, knowledge: 5, social: 4, video: 3, localService: 4 } },
        { label: "다른 사람을 가르치거나 상담한 경험이 있어요", level: 4, scores: { digitalProduct: 4, knowledge: 5, social: 3, video: 4, localService: 5 } },
        { label: "전문 경력, 자격 또는 검증된 성과가 있어요", level: 5, scores: { digitalProduct: 5, knowledge: 5, social: 4, video: 4, marketing: 3, localService: 5 } }
      ]
    },
    {
      title: "지금까지 가장 많이 쌓은 경험은 무엇인가요?",
      help: "가장 오래 했거나 자신 있게 이야기할 수 있는 분야를 선택해 주세요.",
      multiple: true,
      maxSelections: 2,
      options: [
        { label: "직장·사무·전문 업무", kind: "office", scores: { digitalProduct: 4, knowledge: 3, social: 2, aiSupport: 5, localService: 3 } },
        { label: "사업·판매·고객 관리", kind: "business", scores: { digitalProduct: 2, knowledge: 3, social: 3, marketing: 5, aiSupport: 3, localService: 4 } },
        { label: "교육·육아·돌봄·상담", kind: "education", scores: { digitalProduct: 4, knowledge: 5, social: 3, video: 3, localService: 5 } },
        { label: "요리·공예·미술·음악·운동 등 취미", kind: "hobby", scores: { digitalProduct: 5, knowledge: 4, social: 4, video: 4, marketing: 2, localService: 3 } },
        { label: "지역사회·봉사·행사·모임 운영", kind: "community", scores: { knowledge: 3, social: 4, marketing: 3, aiSupport: 2, localService: 5 } },
        { label: "특별히 오래 한 경험이 떠오르지 않아요", kind: "none", exclusive: true, scores: { social: 2, marketing: 2, aiSupport: 4 } }
      ]
    },
    {
      title: "얼굴이나 목소리를 공개할 수 있나요?",
      help: "공개하지 않아도 가능한 활동이 많으니 편하게 답해 주세요.",
      options: [
        { label: "얼굴과 목소리 모두 공개하고 싶지 않아요", level: 1, scores: { digitalProduct: 5, social: 3, marketing: 3, aiSupport: 5, localService: 2 } },
        { label: "목소리만 공개할 수 있어요", level: 2, scores: { digitalProduct: 4, knowledge: 3, social: 3, video: 4, marketing: 3, aiSupport: 4, localService: 2 } },
        { label: "사진이나 짧은 영상 정도는 괜찮아요", level: 3, scores: { digitalProduct: 3, knowledge: 4, social: 5, video: 4, marketing: 4, localService: 3 } },
        { label: "화상 수업이나 영상 출연도 괜찮아요", level: 4, scores: { knowledge: 5, social: 5, video: 5, marketing: 4, localService: 4 } },
        { label: "사람들 앞에서 적극적으로 활동할 수 있어요", level: 5, scores: { knowledge: 5, social: 5, video: 5, marketing: 5, localService: 5 } }
      ]
    },
    {
      title: "사람을 상대하는 활동은 어느 정도 편한가요?",
      help: "고객, 수강생 또는 지역 주민과 연락하는 상황을 생각해 보세요.",
      options: [
        { label: "가능한 한 혼자 일하고 싶어요", level: 1, scores: { digitalProduct: 5, social: 3, video: 3, aiSupport: 5 } },
        { label: "문자나 이메일로 연락하는 것은 괜찮아요", level: 2, scores: { digitalProduct: 4, social: 4, marketing: 4, aiSupport: 5, localService: 2 } },
        { label: "전화나 화상 대화도 가능해요", level: 3, scores: { knowledge: 5, social: 4, video: 3, marketing: 4, aiSupport: 4, localService: 4 } },
        { label: "직접 만나 설명하거나 판매하는 것도 괜찮아요", level: 4, scores: { knowledge: 5, social: 3, video: 3, marketing: 5, localService: 5 } },
        { label: "새로운 사람을 만나고 관계를 만드는 것을 좋아해요", level: 5, scores: { knowledge: 5, social: 5, video: 4, marketing: 5, localService: 5 } }
      ]
    },
    {
      title: "하루에 현실적으로 얼마나 시간을 쓸 수 있나요?",
      help: "희망 시간이 아니라 매일 또는 정기적으로 확보할 수 있는 시간을 선택해 주세요.",
      options: [
        { label: "30분 이하", minutes: 30, scores: { digitalProduct: 3, social: 3, aiSupport: 4, localService: 2 } },
        { label: "30분~1시간", minutes: 60, scores: { digitalProduct: 5, knowledge: 3, social: 4, video: 2, marketing: 3, aiSupport: 5, localService: 3 } },
        { label: "1~2시간", minutes: 120, scores: { digitalProduct: 5, knowledge: 5, social: 5, video: 4, marketing: 5, aiSupport: 5, localService: 5 } },
        { label: "2~4시간", minutes: 240, scores: { digitalProduct: 4, knowledge: 5, social: 5, video: 5, marketing: 5, aiSupport: 5, localService: 5 } },
        { label: "4시간 이상", minutes: 300, scores: { digitalProduct: 4, knowledge: 5, social: 5, video: 5, marketing: 5, aiSupport: 5, localService: 5 } }
      ]
    },
    {
      title: "시작할 때 사용할 수 있는 예산은 어느 정도인가요?",
      help: "예산이 많다고 더 좋은 결과가 나오지는 않습니다. 부담 없는 범위를 선택해 주세요.",
      options: [
        { label: "비용 없이 시작하고 싶어요", budget: 0, scores: { digitalProduct: 4, knowledge: 3, social: 5, video: 2, marketing: 2, aiSupport: 5, localService: 4 } },
        { label: "50달러 이하", budget: 50, scores: { digitalProduct: 5, knowledge: 4, social: 5, video: 3, marketing: 3, aiSupport: 5, localService: 5 } },
        { label: "50~200달러", budget: 200, scores: { digitalProduct: 5, knowledge: 5, social: 5, video: 5, marketing: 5, aiSupport: 4, localService: 5 } },
        { label: "200~500달러", budget: 500, scores: { digitalProduct: 4, knowledge: 5, social: 4, video: 5, marketing: 5, aiSupport: 4, localService: 5 } },
        { label: "필요성이 분명하면 500달러 이상도 가능해요", budget: 501, scores: { digitalProduct: 4, knowledge: 5, social: 4, video: 5, marketing: 5, aiSupport: 4, localService: 5 } }
      ]
    },
    {
      title: "월 수익 목표는 어느 정도인가요?",
      help: "목표는 추천 방향을 조정하는 기준이며 실제 수익을 보장하지 않습니다.",
      options: [
        { label: "우선 수익보다 경험을 쌓고 싶어요", goal: 0, scores: { digitalProduct: 4, knowledge: 3, social: 5, video: 4, aiSupport: 3, localService: 3 } },
        { label: "월 100달러 정도의 작은 부수입", goal: 100, scores: { digitalProduct: 5, knowledge: 4, social: 3, video: 2, marketing: 4, aiSupport: 5, localService: 5 } },
        { label: "월 300~500달러", goal: 500, scores: { digitalProduct: 4, knowledge: 5, social: 4, video: 3, marketing: 5, aiSupport: 5, localService: 5 } },
        { label: "월 1,000달러 이상", goal: 1000, scores: { digitalProduct: 4, knowledge: 5, social: 4, video: 4, marketing: 5, aiSupport: 4, localService: 5 } },
        { label: "장기적으로 본업이나 사업 수준으로 키우고 싶어요", goal: 2000, scores: { digitalProduct: 5, knowledge: 5, social: 5, video: 5, marketing: 5, aiSupport: 3, localService: 5 } }
      ]
    },
    {
      title: "수익이 바로 생기지 않아도 얼마나 꾸준히 할 수 있나요?",
      help: "콘텐츠와 상품은 결과가 나오기까지 시간이 걸릴 수 있습니다.",
      options: [
        { label: "1~2주 안에 가능성을 확인하고 싶어요", months: 0.5, scores: { marketing: 4, aiSupport: 5, localService: 5 } },
        { label: "한 달 정도 해볼 수 있어요", months: 1, scores: { digitalProduct: 3, knowledge: 3, social: 2, marketing: 5, aiSupport: 5, localService: 5 } },
        { label: "2~3개월 꾸준히 할 수 있어요", months: 3, scores: { digitalProduct: 5, knowledge: 5, social: 4, video: 3, marketing: 5, aiSupport: 4, localService: 4 } },
        { label: "6개월 이상 꾸준히 할 수 있어요", months: 6, scores: { digitalProduct: 5, knowledge: 5, social: 5, video: 5, marketing: 5, aiSupport: 4, localService: 4 } },
        { label: "배우면서 장기적으로 키우고 싶어요", months: 12, scores: { digitalProduct: 5, knowledge: 5, social: 5, video: 5, marketing: 5, aiSupport: 4, localService: 4 } }
      ]
    },
    {
      title: "현재 가장 끌리는 방향은 무엇인가요?",
      help: "관심 있는 방향을 선택하세요. 이 답변은 적합도 점수에 넣지 않고 실제 추천과 비교할 때만 사용합니다.",
      multiple: true,
      maxSelections: 2,
      options: [
        { label: "파일이나 자료를 만들어 판매하기", preference: "digitalProduct", scores: {} },
        { label: "내가 아는 것을 가르치거나 상담하기", preference: "knowledge", scores: {} },
        { label: "글·사진·게시물을 만들어 사람을 모으기", preference: "social", scores: {} },
        { label: "영상이나 음성 콘텐츠 만들기", preference: "video", scores: {} },
        { label: "상품을 판매하거나 업체를 홍보하기", preference: "marketing", scores: {} },
        { label: "다른 사람의 온라인 업무를 대신해 주기", preference: "aiSupport", scores: {} },
        { label: "지역에서 직접 서비스를 제공하기", preference: "localService", scores: {} },
        { label: "아직 잘 모르겠어요", preference: "unknown", exclusive: true, scores: {} }
      ]
    }
  ];

  const categories = {
    digitalProduct: {
      name: "디지털 상품 판매", difficulty: "낮음~보통", speed: "보통", cost: "$0~50", time: "하루 30분~1시간",
      summary: "경험과 정보를 PDF, 체크리스트, 템플릿 같은 파일로 만들어 반복 판매하는 방향입니다.",
      skills: ["정보를 짧고 쉽게 정리하기", "Canva 또는 문서 도구 기초", "파일 저장·공유와 저작권 확인"],
      ideas: ["내 경험을 정리한 초보자용 PDF 가이드", "생활·업무 체크리스트 또는 기록 양식", "Canva로 만든 일정표·안내문 템플릿"],
      plan: ["내가 자주 설명하는 주제 10개 적기", "한 가지 고객과 문제 선택하기", "1쪽짜리 무료 예시 만들기", "지인 2명에게 읽어 달라고 하기", "의견을 반영해 5쪽으로 확장하기", "상품 제목과 설명 작성하기", "무료 테스트 배포 후 다음 버전 정하기"]
    },
    knowledge: {
      name: "온라인 강의·지식 판매", difficulty: "보통", speed: "보통", cost: "$0~100", time: "하루 1~2시간",
      summary: "직업, 사업, 생활 또는 취미 경험을 1:1 수업, 소규모 강의나 상담으로 제공하는 방향입니다.",
      skills: ["초보자 눈높이로 설명하기", "수업 순서와 자료 구성하기", "화상회의와 일정 관리"],
      ideas: ["초보자를 위한 60분 기초 수업", "30분 1:1 점검 또는 상담 서비스", "경험 가이드 PDF와 소규모 수업 묶음"],
      plan: ["가르칠 수 있는 주제 5개 적기", "가장 쉬운 입문 주제 하나 선택하기", "60분 수업 순서 만들기", "간단한 수업 자료 3장 만들기", "지인 1명에게 시험 수업하기", "어려웠던 부분과 질문 기록하기", "수정한 수업 소개문 작성하기"]
    },
    social: {
      name: "SNS·콘텐츠 제작", difficulty: "낮음~보통", speed: "장기적", cost: "$0~50", time: "하루 30분~1시간",
      summary: "글, 사진과 짧은 게시물로 유용한 정보를 전하고 고객이나 구독자를 천천히 모으는 방향입니다.",
      skills: ["한 게시물에 한 가지 정보 전달하기", "사진·글·Canva 기초", "개인정보와 이미지 저작권 확인"],
      ideas: ["내 경험에서 나온 생활 팁 10편", "지역 소식이나 유용한 장소 소개", "소규모 업체용 SNS 게시물 제작 서비스"],
      plan: ["콘텐츠 주제 한 가지 정하기", "도움받을 사람을 한 문장으로 적기", "게시물 제목 10개 만들기", "첫 게시물 초안 작성하기", "사진 또는 카드 이미지 만들기", "첫 게시물을 올리고 반응 기록하기", "다음 주 게시물 3개 예약하기"]
    },
    video: {
      name: "영상·유튜브", difficulty: "보통~높음", speed: "장기적", cost: "$0~200", time: "하루 1~2시간 이상",
      summary: "영상이나 음성으로 경험과 정보를 전달하고 장기적으로 구독자, 강의 또는 서비스로 연결하는 방향입니다.",
      skills: ["짧은 영상 구성과 대본 작성", "스마트폰 촬영·음성 녹음", "기초 편집과 저작권 확인"],
      ideas: ["1분 사용법 또는 생활 팁 영상", "얼굴 없이 화면을 녹화한 설명 영상", "경험담과 실수를 나누는 짧은 이야기 영상"],
      plan: ["영상 주제 한 가지 선택하기", "30초 대본을 세 문장으로 쓰기", "스마트폰으로 시험 촬영하기", "소리와 화면을 확인해 다시 촬영하기", "불필요한 앞뒤 부분 잘라내기", "제목과 설명을 작성해 제한 공개하기", "피드백 후 다음 영상 주제 3개 정하기"]
    },
    marketing: {
      name: "온라인 판매·마케팅", difficulty: "보통", speed: "비교적 빠름", cost: "$0~200", time: "하루 1~2시간",
      summary: "상품을 온라인에서 판매하거나 지역 업체가 고객을 찾도록 상품 등록과 홍보를 지원하는 방향입니다.",
      skills: ["상품 장점과 고객 문제 파악하기", "사진·상품 설명·고객 응대", "가격, 배송과 안전한 결제 확인"],
      ideas: ["집에 있는 중고 물품 3개 판매", "지역 업체 상품 설명과 사진 정리", "소상공인용 게시물 5개 제작 서비스"],
      plan: ["판매할 상품 또는 도울 업체 정하기", "비슷한 상품과 가격 조사하기", "고객이 얻는 장점 3개 적기", "사진 5장과 설명문 만들기", "판매 글 또는 홍보 예시 등록하기", "문의 답변 문구를 미리 준비하기", "조회·문의 결과를 보고 수정하기"]
    },
    aiSupport: {
      name: "AI·온라인 업무보조", difficulty: "낮음~보통", speed: "비교적 빠름", cost: "$0~20", time: "하루 30분~2시간",
      summary: "AI와 문서 도구를 활용해 자료 정리, 문서 초안, 일정과 온라인 반복 업무를 지원하는 방향입니다.",
      skills: ["AI에 명확하게 요청하기", "결과를 검토하고 사실 확인하기", "문서·표·파일을 안전하게 관리하기"],
      ideas: ["긴 회의 메모를 한 페이지로 정리", "소상공인용 홍보 문구 10개 작성", "안내문을 고객이 이해하기 쉬운 문장으로 수정"],
      plan: ["내가 해본 사무 업무 10개 적기", "작게 대신할 업무 하나 선택하기", "무료 AI 도구로 예시 만들기", "사실과 문장을 직접 검토하기", "전후 결과가 보이는 샘플 만들기", "지인이나 업체 한 곳에 테스트 제안하기", "피드백을 반영해 서비스 설명 작성하기"]
    },
    localService: {
      name: "지역 서비스·전문경험 활용", difficulty: "낮음~보통", speed: "빠른 편", cost: "$0~100", time: "하루 1~2시간",
      summary: "기존 경험을 지역 고객에게 직접 제공하고 디지털 도구로 홍보, 예약과 운영을 돕는 방향입니다.",
      skills: ["고객의 필요를 듣고 범위 정하기", "쉬운 설명과 약속 관리", "기본 홍보·예약·안전 수칙"],
      ideas: ["시니어 스마트폰 또는 온라인 예약 도움", "경험 분야의 소규모 방문·그룹 수업", "지역 업체의 문서·홍보·행사 운영 지원"],
      plan: ["도와줄 수 있는 지역 문제 5개 적기", "가장 안전하고 쉬운 서비스 선택하기", "서비스 범위와 하지 않을 일 정하기", "30분 시험 서비스 순서 만들기", "지인 한 명에게 무료 테스트하기", "후기와 개선점을 기록하기", "지역 모임 한 곳에 소개문 공유하기"]
    }
  };

  const answerHasKind = (answer, kind) => answer?.kinds?.includes(kind) || answer?.kind === kind;

  const reasonRules = {
    digitalProduct: [
      [a => a[4]?.level <= 2, "혼자 또는 비대면으로 집중하는 방식과 잘 맞아요."],
      [a => a[3]?.level <= 2, "얼굴이나 목소리를 공개하지 않아도 시작할 수 있어요."],
      [a => a[1]?.level >= 3, "경험과 지식을 재사용 가능한 자료로 바꿀 수 있어요."],
      [a => a[6]?.budget <= 50, "큰 초기비용 없이 문서나 무료 디자인 도구로 시험할 수 있어요."]
    ],
    knowledge: [
      [a => a[1]?.level >= 3, "초보자에게 설명하거나 판매할 수 있는 경험이 있어요."],
      [a => a[4]?.level >= 3, "수강생과 대화하고 질문을 받는 방식에 잘 맞아요."],
      [a => a[3]?.level >= 3, "사진, 화상 또는 영상으로 신뢰를 전달할 수 있어요."],
      [a => ["education", "hobby", "office", "business"].some(kind => answerHasKind(a[2], kind)), "기존 경험을 수업이나 상담 주제로 발전시킬 수 있어요."]
    ],
    social: [
      [a => a[6]?.budget <= 50, "큰 비용 없이 글과 사진부터 시작할 수 있어요."],
      [a => a[8]?.months >= 3, "콘텐츠를 쌓아가는 데 필요한 꾸준함이 있어요."],
      [a => a[3]?.level <= 3, "얼굴 공개 범위에 맞춰 글·사진 중심으로 운영할 수 있어요."],
      [a => a[0]?.level >= 2, "검색과 기본 앱 활용 수준으로 첫 게시물을 만들 수 있어요."]
    ],
    video: [
      [a => a[3]?.level >= 2, "가능한 공개 범위에 맞춰 음성 또는 영상 콘텐츠를 만들 수 있어요."],
      [a => a[5]?.minutes >= 120, "촬영과 편집을 연습할 시간을 확보할 수 있어요."],
      [a => a[8]?.months >= 6, "결과가 천천히 생겨도 채널을 꾸준히 키울 수 있어요."],
      [a => a[0]?.level >= 3, "새로운 촬영·편집 도구를 배울 기초가 있어요."]
    ],
    marketing: [
      [a => answerHasKind(a[2], "business"), "판매·사업·고객 관리 경험을 직접 활용할 수 있어요."],
      [a => a[4]?.level >= 2, "고객 문의와 업체 연락을 처리할 수 있어요."],
      [a => a[8]?.months <= 3, "비교적 빠르게 시장 반응을 확인하려는 목표와 맞아요."],
      [a => a[7]?.goal >= 300, "작은 판매를 반복해 수익 목표를 확장할 수 있어요."]
    ],
    aiSupport: [
      [a => a[0]?.level >= 3, "문서와 온라인 도구를 활용할 기본 역량이 있어요."],
      [a => a[3]?.level <= 2, "얼굴이나 목소리 공개 없이 서비스할 수 있어요."],
      [a => a[4]?.level <= 2, "대면보다 문서와 메시지 중심으로 일할 수 있어요."],
      [a => answerHasKind(a[2], "office"), "직장·사무 경험을 온라인 보조 업무에 활용할 수 있어요."],
      [a => a[8]?.months <= 3, "작은 단건 업무로 비교적 빠르게 가능성을 확인할 수 있어요."]
    ],
    localService: [
      [a => a[4]?.level >= 3, "사람을 직접 돕고 설명하는 활동에 부담이 적어요."],
      [a => a[1]?.level >= 3, "다른 사람에게 제공할 수 있는 경험이나 기술이 있어요."],
      [a => ["education", "community", "business"].some(kind => answerHasKind(a[2], kind)), "교육·지역사회·고객 경험을 서비스로 연결할 수 있어요."],
      [a => a[8]?.months <= 3, "지역에서 작은 테스트 고객을 비교적 빠르게 찾을 수 있어요."]
    ]
  };

  const state = { current: 0, answers: Array(questions.length).fill(null) };
  const elements = {
    start: document.getElementById("startScreen"), quiz: document.getElementById("quizScreen"), result: document.getElementById("resultScreen"),
    title: document.getElementById("questionTitle"), help: document.getElementById("questionHelp"), number: document.getElementById("questionNumber"), mode: document.getElementById("questionMode"),
    options: document.getElementById("optionList"), progressText: document.getElementById("progressText"), progressBar: document.getElementById("progressBar"),
    message: document.getElementById("selectionMessage"), previous: document.getElementById("previousButton"), next: document.getElementById("nextButton")
  };

  function showScreen(target) {
    [elements.start, elements.quiz, elements.result].forEach(screen => screen.classList.toggle("is-active", screen === target));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startQuiz() {
    state.current = 0;
    showScreen(elements.quiz);
    renderQuestion();
  }

  function resetQuiz() {
    state.current = 0;
    state.answers.fill(null);
    showScreen(elements.start);
  }

  function renderQuestion() {
    const question = questions[state.current];
    const selectedIndices = state.answers[state.current]?.selectedIndices || [];
    elements.number.textContent = `질문 ${state.current + 1}`;
    elements.mode.textContent = question.multiple ? `복수 선택 가능 (최대 ${question.maxSelections}개)` : "";
    elements.progressText.textContent = `${state.current + 1} / ${questions.length}`;
    elements.progressBar.style.width = `${((state.current + 1) / questions.length) * 100}%`;
    elements.title.textContent = question.title;
    elements.help.replaceChildren();
    const sentences = question.help.match(/[^.!?]+[.!?]?/g) || [question.help];
    sentences.map(sentence => sentence.trim()).filter(Boolean).forEach(sentence => {
      const line = document.createElement("span");
      line.className = "help-sentence";
      line.textContent = sentence;
      elements.help.appendChild(line);
    });
    elements.options.innerHTML = "";
    elements.options.classList.toggle("is-multiple", Boolean(question.multiple));
    question.options.forEach((option, index) => {
      const selected = selectedIndices.includes(index);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `option-card${selected ? " is-selected" : ""}`;
      button.setAttribute("role", question.multiple ? "checkbox" : "radio");
      button.setAttribute("aria-checked", String(selected));
      button.innerHTML = `<span class="option-marker" aria-hidden="true">${selected ? "✓" : ""}</span><span class="option-label"></span>`;
      button.querySelector(".option-label").textContent = option.label;
      button.addEventListener("click", () => selectOption(index));
      elements.options.appendChild(button);
    });
    elements.previous.disabled = state.current === 0;
    elements.next.textContent = state.current === questions.length - 1 ? "결과 보기 →" : "다음 →";
    elements.message.textContent = "";
    elements.message.className = "selection-message";
    elements.title.focus({ preventScroll: true });
  }

  function buildAnswer(question, selectedIndices) {
    const selectedOptions = selectedIndices.map(index => question.options[index]);
    if (!selectedOptions.length) return null;
    const scores = Object.fromEntries(CATEGORY_IDS.map(id => [
      id,
      selectedOptions.reduce((sum, option) => sum + (option.scores?.[id] || 0), 0) / selectedOptions.length
    ]));
    const answer = { selectedIndices: [...selectedIndices], scores };
    ["level", "minutes", "budget", "goal", "months"].forEach(key => {
      const values = selectedOptions.map(option => option[key]).filter(value => value !== undefined);
      if (values.length) answer[key] = question.multiple && key === "level"
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : Math.max(...values);
    });
    answer.kinds = selectedOptions.map(option => option.kind).filter(Boolean);
    answer.preferences = selectedOptions.map(option => option.preference).filter(Boolean);
    return answer;
  }

  function selectOption(optionIndex) {
    const question = questions[state.current];
    const option = question.options[optionIndex];
    const currentIndices = state.answers[state.current]?.selectedIndices || [];
    let nextIndices;

    if (!question.multiple) {
      nextIndices = [optionIndex];
    } else if (currentIndices.includes(optionIndex)) {
      nextIndices = currentIndices.filter(index => index !== optionIndex);
    } else if (option.exclusive) {
      nextIndices = [optionIndex];
    } else {
      const withoutExclusive = currentIndices.filter(index => !question.options[index].exclusive);
      if (withoutExclusive.length >= question.maxSelections) {
        elements.message.textContent = `최대 ${question.maxSelections}개까지 선택할 수 있어요.`;
        elements.message.className = "selection-message is-limit";
        return;
      }
      nextIndices = [...withoutExclusive, optionIndex];
    }

    state.answers[state.current] = buildAnswer(question, nextIndices);
    [...elements.options.children].forEach((button, index) => {
      const selected = nextIndices.includes(index);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
      button.querySelector(".option-marker").textContent = selected ? "✓" : "";
    });
    elements.message.className = "selection-message";
    elements.message.textContent = nextIndices.length
      ? `✓ 선택 완료${question.multiple ? ` · ${nextIndices.length}개 선택됨` : ""}`
      : "선택할 항목을 확인해 주세요.";
  }

  function calculateResults() {
    const weightedScores = Object.fromEntries(CATEGORY_IDS.map(id => [id, 0]));

    questions.slice(0, 9).forEach((question, questionIndex) => {
      const answer = state.answers[questionIndex];
      CATEGORY_IDS.forEach(id => {
        weightedScores[id] += (answer?.scores?.[id] || 0) * SCORE_QUESTION_WEIGHTS[questionIndex];
      });
    });

    const adjustments = Object.fromEntries(CATEGORY_IDS.map(id => [id, 0]));
    const digital = state.answers[0].level;
    const teachable = state.answers[1].level;
    const visibility = state.answers[3].level;
    const people = state.answers[4].level;
    const time = state.answers[5].minutes;
    const budget = state.answers[6].budget;
    const goal = state.answers[7].goal;
    const consistency = state.answers[8].months;

    if (digital <= 1) { adjustments.aiSupport -= 13; adjustments.video -= 10; adjustments.digitalProduct -= 6; adjustments.localService += 6; }
    if (teachable <= 1) { adjustments.knowledge -= 15; adjustments.digitalProduct -= 5; }
    if (teachable >= 4) { adjustments.knowledge += 8; adjustments.localService += 5; adjustments.digitalProduct += 4; }
    if (visibility <= 1) { adjustments.video -= 9; adjustments.knowledge -= 5; adjustments.aiSupport += 5; adjustments.digitalProduct += 5; }
    if (people <= 1) { adjustments.localService -= 12; adjustments.knowledge -= 9; adjustments.marketing -= 5; adjustments.aiSupport += 5; adjustments.digitalProduct += 5; }
    if (people >= 4) { adjustments.localService += 7; adjustments.knowledge += 5; adjustments.marketing += 5; }
    if (time <= 30) { adjustments.video -= 14; adjustments.marketing -= 6; adjustments.knowledge -= 5; adjustments.aiSupport += 4; }
    if (time >= 120) { adjustments.video += 5; adjustments.knowledge += 3; adjustments.marketing += 3; }
    if (budget === 0) { adjustments.video -= 5; adjustments.marketing -= 4; adjustments.aiSupport += 3; adjustments.social += 3; }
    if (consistency <= 1) { adjustments.video -= 15; adjustments.social -= 10; adjustments.localService += 5; adjustments.aiSupport += 5; }
    if (consistency >= 6) { adjustments.video += 8; adjustments.social += 7; adjustments.digitalProduct += 4; }
    if (goal >= 1000 && consistency <= 1) { adjustments.video -= 5; adjustments.social -= 5; adjustments.localService += 3; adjustments.marketing += 3; }

    const answerScore = (questionIndex, id) => state.answers[questionIndex]?.scores?.[id] || 0;
    const tieBreakValues = id => [
      (answerScore(1, id) * SCORE_QUESTION_WEIGHTS[1]) + (answerScore(2, id) * SCORE_QUESTION_WEIGHTS[2]),
      answerScore(4, id),
      answerScore(0, id),
      answerScore(5, id),
      answerScore(6, id)
    ];

    return CATEGORY_IDS.map(id => {
      const baseScore = 18 + ((weightedScores[id] / SCORE_SCALE_MAX) * 72);
      const exactScore = Math.max(20, Math.min(96, baseScore + (adjustments[id] * 0.35)));
      return {
        id,
        score: Number(exactScore.toFixed(1)),
        exactScore,
        adjustment: adjustments[id],
        tieBreak: tieBreakValues(id),
        ...categories[id]
      };
    }).sort((a, b) => {
      const scoreDifference = b.exactScore - a.exactScore;
      if (Math.abs(scoreDifference) > 0.0001) return scoreDifference;
      for (let index = 0; index < a.tieBreak.length; index += 1) {
        const tieDifference = b.tieBreak[index] - a.tieBreak[index];
        if (tieDifference !== 0) return tieDifference;
      }
      return CATEGORY_IDS.indexOf(a.id) - CATEGORY_IDS.indexOf(b.id);
    });
  }

  function fitLabel(score) {
    if (score >= 85) return "현재 조건과의 적합도 매우 높음";
    if (score >= 70) return "현재 조건과의 적합도 높음";
    if (score >= 55) return "준비하면 가능한 수준";
    return "기초 준비가 필요한 수준";
  }

  function preferenceComparison(first) {
    const preferences = (state.answers[9]?.preferences || []).filter(preference => preference !== "unknown");
    if (!preferences.length || preferences.includes(first.id)) return "";
    const preferenceNames = preferences.map(preference => categories[preference].name).join(" · ");
    return `<p class="preference-note"><strong>관심 방향과 현실적인 시작점이 달라요.</strong> 관심은 ${preferenceNames}에 있지만 현재 조건에서는 ${first.name}가 더 현실적인 시작입니다. 먼저 추천 활동으로 경험과 기반을 만든 뒤 관심 분야로 확장해 보세요.</p>`;
  }

  function reasonsFor(id) {
    const matched = reasonRules[id].filter(([test]) => test(state.answers)).map(([, reason]) => reason);
    const fallbacks = {
      digitalProduct: "작은 자료 하나부터 만들어 시장 반응을 확인할 수 있어요.", knowledge: "경험을 초보자용 수업으로 작게 시험할 수 있어요.",
      social: "글이나 사진 한 편부터 부담 없이 시작할 수 있어요.", video: "공개 가능한 범위에 맞춰 짧은 영상부터 연습할 수 있어요.",
      marketing: "작은 상품이나 업체 한 곳으로 판매 반응을 확인할 수 있어요.", aiSupport: "반복 업무 하나를 정해 예시 결과물을 빠르게 만들 수 있어요.",
      localService: "내가 사는 지역의 실제 문제를 해결하는 작은 서비스부터 시작할 수 있어요."
    };
    if (matched.length < 3) matched.push(fallbacks[id]);
    return [...new Set(matched)].slice(0, 4);
  }

  function realisticSummary(result) {
    const notes = [];
    if (result.adjustment < -5) notes.push("관심은 있지만 현재 시간·기술 조건에 맞춰 작은 형태로 시작하는 것이 안전합니다.");
    if (result.id === "video" && state.answers[3].level <= 1) notes.push("얼굴 대신 화면 녹화, 손 촬영 또는 자막 영상으로 시작할 수 있습니다.");
    if (result.id === "marketing" && state.answers[6].budget === 0) notes.push("재고 구매보다 중고 판매나 업체 홍보 대행으로 먼저 검증하세요.");
    if (result.id === "knowledge" && state.answers[1].level <= 2) notes.push("고가 강의보다 짧은 입문 수업이나 무료 테스트로 경험을 먼저 확인하세요.");
    return notes.join(" ");
  }

  function semanticMarkup(text, lineClass = "semantic-line") {
    const escapeHtml = value => value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
    const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
    return sentences.map(sentence => {
      const safeSentence = escapeHtml(sentence.trim()).replace(/,\s+/g, ",<wbr> ");
      return `<span class="${lineClass}">${safeSentence}</span>`;
    }).join("");
  }

  function recommendationCard(result, rank) {
    const reasons = reasonsFor(result.id);
    const planTime = state.answers[5].minutes <= 60 ? "약 30분" : "약 45~60분";
    return `
      <article class="recommendation-card">
        <header class="recommendation-head">
          <span class="rank-badge">${rank}</span>
          <div><h3>${result.name}</h3><p class="recommendation-summary">${semanticMarkup(result.summary)}</p></div>
          <span class="score-badge">진단점수 ${result.score}/100 · ${fitLabel(result.score)}</span>
        </header>
        <div class="recommendation-body">
          <div class="detail-grid">
            <section class="detail-block"><h4>왜 추천하나요?</h4><ul>${reasons.map(reason => `<li>${reason}</li>`).join("")}</ul></section>
            <section class="detail-block"><h4>필요한 기술</h4><ul>${result.skills.map(skill => `<li>${skill}</li>`).join("")}</ul></section>
          </div>
          <div class="practical-grid">
            <div><span>예상 초기비용</span><strong>${result.cost}</strong></div>
            <div><span>하루 권장시간</span><strong>${result.time}</strong></div>
          </div>
          ${realisticSummary(result) ? `<p class="question-help"><strong>현실성 안내:</strong> ${realisticSummary(result)}</p>` : ""}
          <section class="ideas-block"><h4>첫 상품·서비스 아이디어 3개</h4><ol class="idea-list">${result.ideas.map(idea => `<li>${idea}</li>`).join("")}</ol></section>
          <section class="plan-block"><h4>첫 7일 실행계획</h4><ol class="plan-list">${result.plan.map((item, index) => `<li><strong>${index + 1}일 차</strong><span class="plan-task">${semanticMarkup(item)}</span><small>${planTime}</small></li>`).join("")}</ol></section>
        </div>
      </article>`;
  }

  function renderResults() {
    const top = calculateResults().slice(0, 3);
    const first = top[0];
    document.getElementById("primaryResult").innerHTML = `
      <div class="primary-result-grid">
        <div><span class="result-rank">가장 현실적인 1순위</span><h2>${first.name}</h2><p>${semanticMarkup(`${first.summary} ${reasonsFor(first.id)[0]}`)}</p></div>
        <div class="fit-score"><strong>${first.score}/100</strong><span>진단점수 · ${fitLabel(first.score)}</span></div>
      </div>
      ${preferenceComparison(first)}
      <div class="primary-stats">
        <div><small>시작 난이도</small><strong>${first.difficulty}</strong></div>
        <div><small>수익화 속도</small><strong>${first.speed}</strong></div>
        <div><small>추천 시작 방식</small><strong>작은 테스트부터</strong></div>
      </div>`;
    document.getElementById("recommendationList").innerHTML = top.map((result, index) => recommendationCard(result, index + 1)).join("");
    document.getElementById("comparisonTable").innerHTML = `
      <table><thead><tr><th>비교 항목</th>${top.map(item => `<th>${item.name}</th>`).join("")}</tr></thead>
      <tbody>
        <tr><th>진단점수</th>${top.map(item => `<td>${item.score}/100<br>${fitLabel(item.score)}</td>`).join("")}</tr>
        <tr><th>초기비용</th>${top.map(item => `<td>${item.cost}</td>`).join("")}</tr>
        <tr><th>하루 권장시간</th>${top.map(item => `<td>${item.time}</td>`).join("")}</tr>
        <tr><th>수익화 속도</th>${top.map(item => `<td>${item.speed}</td>`).join("")}</tr>
        <tr><th>시작 난이도</th>${top.map(item => `<td>${item.difficulty}</td>`).join("")}</tr>
      </tbody></table>`;
    document.getElementById("ctaDescription").textContent = `${first.name}에 필요한 기초 기술을 배우거나 관련 강사·서비스를 찾아보세요.`;
    showScreen(elements.result);
    document.getElementById("resultTitle").focus({ preventScroll: true });
  }

  document.getElementById("startButton").addEventListener("click", startQuiz);
  document.getElementById("restartButton").addEventListener("click", resetQuiz);
  document.getElementById("quitButton").addEventListener("click", resetQuiz);
  elements.previous.addEventListener("click", () => { if (state.current > 0) { state.current -= 1; renderQuestion(); } });
  elements.next.addEventListener("click", () => {
    if (!state.answers[state.current]?.selectedIndices?.length) {
      elements.message.textContent = questions[state.current].multiple ? "한 개 이상 선택해 주세요." : "답변을 하나 선택해 주세요.";
      elements.message.className = "selection-message is-required";
      elements.options.querySelector("button")?.focus();
      return;
    }
    if (state.current < questions.length - 1) { state.current += 1; renderQuestion(); } else { renderResults(); }
  });
})();
