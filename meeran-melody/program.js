(() => {
  const programs = {
    'comfort-concert': {
      titleKo:'멜로디 한 조각 – 작은 위로 콘서트', titleEn:'A Piece of Melody – A Small Comfort Concert',
      introKo:'세대를 아우르는 노래로 위로와 행복을 전하는 찾아가는 힐링 음악회입니다.', introEn:'A traveling healing concert sharing comfort and joy through songs across generations.',
      flyer:'assets/specialty/melody-piece-20260718.png',
      sections:[
        ['대상','Who It Is For','문화공연을 접하기 어려운 분, 외로움과 우울감을 덜고 싶은 분, 특별 행사를 준비하는 기관과 지역 커뮤니티','People with limited access to cultural performances, those seeking comfort, and organizations planning special community events.'],
        ['진행 내용','Program','연주자의 라이브 공연과 추억의 명곡·동요·가요·계절 노래로 구성합니다.','Live performances featuring memorable classics, children’s songs, popular music, and seasonal songs.'],
        ['특징','Features','대상과 기관에 맞춘 맞춤형 프로그램으로 소규모부터 중규모 행사까지 운영할 수 있습니다.','Tailored to each audience and organization, from small gatherings to mid-sized events.'],
        ['추천 장소','Recommended Venues','병원, 데이케어센터, 복지관, 실버타운, 지역 문화센터, 교회 및 지역 커뮤니티','Hospitals, daycare centers, welfare centers, senior communities, cultural centers, churches, and local communities.']
      ]
    },
    'culture-walk': {
      titleKo:'멜로디 문화 산책', titleEn:'Melody Cultural Walk',
      introKo:'공연 추천부터 예매, 동행, 관람과 귀가까지 함께하는 시니어 문화 가이드 서비스입니다.', introEn:'A senior cultural guide service supporting performance selection, booking, accompaniment, attendance, and the trip home.',
      flyer:'assets/specialty/melody-culture-walk-20260718.png',
      sections:[
        ['대상','Who It Is For','공연 예매가 어렵거나 혼자 외출이 부담스러운 분, 영어 사용과 동행이 걱정되는 분','People who find booking or solo outings difficult, need language support, or would like a trusted companion.'],
        ['진행 내용','Service Flow','공연 추천, 티켓 예매 대행, 일정 안내, 문화 동행, 공연 관람, 귀가 지원 순서로 함께합니다.','Includes recommendations, ticket booking, schedule guidance, cultural accompaniment, attendance, and return-trip support.'],
        ['특징','Features','티켓 예매부터 공연 관람까지 원스톱으로 지원하며 뉴욕의 다양한 공연을 편안하게 경험하도록 돕습니다.','One-stop assistance from ticket booking through attendance for a comfortable New York cultural experience.']
      ]
    },
    'healing-melody': {
      titleKo:'힐링 멜로디', titleEn:'Healing Melody',
      introKo:'웃고 이야기하며 음악으로 서로를 위로하는 편안한 힐링 음악 모임입니다.', introEn:'A welcoming music gathering where people laugh, talk, sing, and support one another.',
      flyer:'assets/specialty/healing-melody-20260718.png',
      sections:[
        ['대상','Who It Is For','노래와 교류를 좋아하거나 음악으로 스트레스를 풀고 싶은 분, 일상에 작은 행복과 쉼이 필요한 초보자 누구나','Anyone who enjoys singing and connection, wants musical stress relief, or needs a little joy and rest—beginners welcome.'],
        ['진행 내용','Program','추억의 노래, 가곡·동요·가요·팝, 계절 노래, 신청곡, 음악 이야기와 작은 위로 콘서트를 함께합니다.','Includes favorite songs, art songs, children’s songs, pop, seasonal music, requests, music stories, and small comfort concerts.'],
        ['특징','Features','노래 실력보다 함께하는 즐거움을 소중히 하며 틀려도 괜찮은 편안한 모임입니다.','A relaxed gathering that values shared joy over singing ability—mistakes are always welcome.']
      ]
    }
  };
  const id = new URLSearchParams(location.search).get('program') || 'comfort-concert';
  const program = programs[id] || programs['comfort-concert'];
  const title = document.getElementById('programTitle');
  title.dataset.ko=program.titleKo; title.dataset.en=program.titleEn; title.textContent=program.titleKo;
  const breadcrumb=document.getElementById('programBreadcrumb'); breadcrumb.dataset.ko=program.titleKo; breadcrumb.dataset.en=program.titleEn; breadcrumb.textContent=program.titleKo;
  const intro=document.getElementById('programIntro'); intro.dataset.ko=program.introKo; intro.dataset.en=program.introEn; intro.textContent=program.introKo;
  const flyer=document.getElementById('programFlyer'); flyer.src=program.flyer; flyer.alt=program.titleKo+' 전단지'; flyer.parentElement.dataset.flyerSrc=program.flyer;
  document.getElementById('programInfo').innerHTML=program.sections.map(section=>`<section><h2 data-ko="${section[0]}" data-en="${section[1]}">${section[0]}</h2><p data-ko="${section[2]}" data-en="${section[3]}">${section[2]}</p></section>`).join('');
  document.body.dataset.titleKo=program.titleKo+' | Harmony Link'; document.body.dataset.titleEn=program.titleEn+' | Harmony Link';
})();
