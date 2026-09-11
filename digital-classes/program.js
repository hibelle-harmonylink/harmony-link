(function () {
  var params = new URLSearchParams(window.location.search);
  var categoryId = params.get('category');
  var programId = params.get('program');
  var category = window.DIGITAL_CATEGORIES.getCategory(categoryId);
  var program = window.DIGITAL_CATEGORIES.getProgram(categoryId, programId);
  var text = window.digitalText || function (ko) { return ko; };
  var english = window.DIGITAL_LANGUAGE === 'en';
  document.documentElement.lang = english ? 'en' : 'ko';

  if (!category || !program) {
    window.location.replace('index.html');
    return;
  }

  document.title = program.title + text(' | 하이벨 디지털 클래스', ' | Harmony Link Digital Classes');
  var breadcrumbTitles = {
    device: text('기기 활용반', 'Device Basics'),
    documents: text('문서 작성반', 'Document Creation'),
    design: text('디자인반', 'Design'),
    youtube: text('유튜브 활용반', 'YouTube'),
    apps: text('SNS·실생활 앱 활용반', 'SNS & Everyday Apps'),
    ai: text('AI 활용반', 'AI')
  };
  document.getElementById('breadcrumb').innerHTML =
    '<a href="index.html">' + text('디지털 클래스', 'Digital Classes') + '</a> / ' + (breadcrumbTitles[category.id] || program.title);
  document.querySelector('.dclass-course-heading h2').textContent = text('교육 과정', 'Curriculum');

  var comingSoon = program.status === 'comingSoon';
  var programFlyer = document.getElementById('programFlyer');
  programFlyer.src = category.image;
  programFlyer.alt = category.title + text(' 교육 프로그램 전단지', ' program flyer');
  var flyerButton = document.getElementById('programFlyerButton');
  var flyerLightbox = document.getElementById('flyerLightbox');
  var flyerLightboxImage = document.getElementById('flyerLightboxImage');
  var flyerLightboxClose = document.getElementById('flyerLightboxClose');

  function closeFlyerLightbox() {
    flyerLightbox.hidden = true;
    document.body.classList.remove('dclass-lightbox-open');
    flyerButton.focus();
  }

  flyerButton.addEventListener('click', function () {
    flyerLightboxImage.src = programFlyer.src;
    flyerLightboxImage.alt = programFlyer.alt;
    flyerLightbox.hidden = false;
    document.body.classList.add('dclass-lightbox-open');
    flyerLightboxClose.focus();
  });
  flyerLightboxClose.addEventListener('click', closeFlyerLightbox);
  flyerLightbox.addEventListener('click', function (event) {
    if (event.target === flyerLightbox) closeFlyerLightbox();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !flyerLightbox.hidden) closeFlyerLightbox();
  });
  document.getElementById('programSummary').textContent = category.shortDesc;

  var stepIcons = {
    device: ['📱', '💻', '🔗'],
    documents: ['⌨️', '✨', '📄', '🗂️', '📤', '☁️'],
    design: ['🖥️', '🎨', '🖼️', '📤'],
    youtube: ['▶️', '🔎', '🔔', '🔗', '📱', '🎬'],
    apps: ['💬', '🗺️', '📅', '💳', '🛍️', '🧭'],
    ai: ['🧠', '💬', '📄', '🎨', '✨', '⚙️']
  };
  var categoryIcons = stepIcons[category.id] || [category.icon];
  var stepCards = program.steps.map(function (step, index) {
    var icon = categoryIcons[index % categoryIcons.length];
    var summary = english ? 'Learn the essential skills through clear, practical activities.' : step.title + '의 핵심 내용을 쉽고 실용적으로 익힙니다.';
    return '<article class="dclass-step-block" style="--step-accent:' + category.accent + '">' +
      '<div class="dclass-step-visual" aria-hidden="true"><span>' + icon + '</span></div>' +
      '<div class="dclass-step-copy"><h4>' + step.title + '</h4><p>' + summary + '</p></div><ul>' +
      step.items.map(function (item) { return '<li>' + item + '</li>'; }).join('') +
      '</ul></article>';
  });

  if (category.id === 'ai' && program.id === 'ai-start') {
    var aiAdvancedTopics = english ? ['Using ChatGPT', 'Vibe Coding', 'Build an App', 'Build a Website', 'AI for Work', 'Using Claude', 'Using Gemini'] : ['ChatGPT 활용', '바이브 코딩', '앱 만들기', '홈페이지 만들기', '업무용 AI 활용', 'Claude 활용', 'Gemini 활용'];
    stepCards.push(
      '<article class="dclass-step-block" style="--step-accent:' + category.accent + '">' +
      '<div class="dclass-step-visual" aria-hidden="true"><span>🧩</span></div>' +
      '<div class="dclass-step-copy"><h4>' + text('단계별 심화 과정', 'Advanced Learning Path') + '</h4><p>' + text('다양한 AI 도구를 실전 중심으로 깊이 있게 활용합니다.', 'Build deeper, hands-on skills with a range of AI tools.') + '</p></div>' +
      '<ul>' + aiAdvancedTopics.map(function (topic) { return '<li>' + topic + '</li>'; }).join('') + '</ul>' +
      '</article>'
    );
  }
  document.getElementById('stepGrid').innerHTML = stepCards.join('');

  var shortsArea = document.getElementById('shortsArea');
  if (shortsArea && category.id === 'youtube' && program.id === 'youtube-basic') {
    shortsArea.innerHTML =
      '<section class="dclass-shorts-card" aria-labelledby="dclassShortsTitle">' +
      '<div class="dclass-shorts-icon" aria-hidden="true">🎬</div>' +
      '<div class="dclass-shorts-copy"><span>' + text('Premium $50 회원 전용', 'Premium $50 Members Only') + '</span>' +
      '<h3 id="dclassShortsTitle">' + text('AI 쇼츠 제작 프로그램', 'AI Shorts Maker') + '</h3>' +
      '<p>' + text('AI를 활용해 짧은 영상 콘텐츠를 빠르고 쉽게 제작할 수 있습니다.', 'Create short-form video content quickly and easily with AI.') + '</p></div>' +
      '<a class="dclass-btn dclass-btn-primary ytlab-ai-shorts-addon-btn" href="#" data-premium-href="https://ai-shorts-maker-production.up.railway.app/">' + text('AI 쇼츠 제작 실행하기', 'Launch AI Shorts Maker') + '</a>' +
      '</section>';
    var shortsAccessScript = document.createElement('script');
    shortsAccessScript.src = '../youtube-start/access.js?v=10';
    document.body.appendChild(shortsAccessScript);
  }

  var ctaHtml = '';
  if (comingSoon) {
    ctaHtml = '<button class="dclass-btn dclass-btn-disabled" type="button" disabled>' + text('준비 중입니다', 'Coming Soon') + '</button>';
  } else {
    if (program.cta) {
      var target = program.cta.type === 'form' ? ' target="_blank" rel="noopener noreferrer"' : '';
      ctaHtml += '<a class="dclass-btn dclass-btn-primary" href="' + program.cta.url + '"' + target + '>' + program.cta.label + '</a>';
    }
    if (program.secondaryCta) {
      var target2 = program.secondaryCta.type === 'form' ? ' target="_blank" rel="noopener noreferrer"' : '';
      ctaHtml += '<a class="dclass-btn dclass-btn-outline" href="' + program.secondaryCta.url + '"' + target2 + '>' + program.secondaryCta.label + '</a>';
    }
  }
  document.getElementById('ctaArea').innerHTML = ctaHtml;

  document.querySelectorAll('.dclass-footer p').forEach(function (paragraph, index) {
    if (index === 0) paragraph.textContent = text('하이벨 디지털은 하이벨컨설팅이 운영하는 Harmony Link 이음문화센터의 디지털 교육 프로그램입니다.', 'Hibelle Digital is a Harmony Link digital education program operated by Hibelle Consulting.');
    if (index === 1) paragraph.innerHTML = '<a href="index.html">' + text('디지털 클래스 전체 보기', 'All Digital Classes') + '</a> · <a href="../index.html">' + text('HarmonyLink 홈', 'Harmony Link Home') + '</a>';
  });

})();
