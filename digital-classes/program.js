(function () {
  var params = new URLSearchParams(window.location.search);
  var categoryId = params.get('category');
  var programId = params.get('program');
  var category = window.DIGITAL_CATEGORIES.getCategory(categoryId);
  var program = window.DIGITAL_CATEGORIES.getProgram(categoryId, programId);

  if (!category || !program) {
    window.location.replace('index.html');
    return;
  }

  document.title = program.title + ' | 하이벨 디지털 클래스';
  var breadcrumbTitles = {
    device: '기기 활용반',
    documents: '문서 작성반',
    design: '디자인반',
    youtube: '유튜브 활용반',
    apps: 'SNS·실생활 앱 활용반',
    ai: 'AI 활용반'
  };
  document.getElementById('breadcrumb').innerHTML =
    '<a href="index.html">디지털 클래스</a> / ' + (breadcrumbTitles[category.id] || program.title);

  var comingSoon = program.status === 'comingSoon';
  var programFlyer = document.getElementById('programFlyer');
  programFlyer.src = category.image;
  programFlyer.alt = category.title + ' 교육 프로그램 전단지';
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
    var summary = step.title + '의 핵심 내용을 쉽고 실용적으로 익힙니다.';
    return '<article class="dclass-step-block" style="--step-accent:' + category.accent + '">' +
      '<div class="dclass-step-visual" aria-hidden="true"><span>' + icon + '</span></div>' +
      '<div class="dclass-step-copy"><h4>' + step.title + '</h4><p>' + summary + '</p></div><ul>' +
      step.items.map(function (item) { return '<li>' + item + '</li>'; }).join('') +
      '</ul></article>';
  });

  if (category.id === 'ai' && program.id === 'ai-start') {
    var aiAdvancedTopics = ['ChatGPT 활용', '바이브 코딩', '앱 만들기', '홈페이지 만들기', '업무용 AI 활용', 'Claude 활용', 'Gemini 활용'];
    stepCards.push(
      '<article class="dclass-step-block" style="--step-accent:' + category.accent + '">' +
      '<div class="dclass-step-visual" aria-hidden="true"><span>🧩</span></div>' +
      '<div class="dclass-step-copy"><h4>단계별 심화 과정</h4><p>다양한 AI 도구를 실전 중심으로 깊이 있게 활용합니다.</p></div>' +
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
      '<div class="dclass-shorts-copy"><span>Premium $50 회원 전용</span>' +
      '<h3 id="dclassShortsTitle">AI 쇼츠 제작 프로그램</h3>' +
      '<p>AI를 활용해 짧은 영상 콘텐츠를 빠르고 쉽게 제작할 수 있습니다.</p></div>' +
      '<a class="dclass-btn dclass-btn-primary ytlab-ai-shorts-addon-btn" href="#" data-premium-href="https://ai-shorts-maker-production.up.railway.app/">AI 쇼츠 제작 실행하기</a>' +
      '</section>';
    var shortsAccessScript = document.createElement('script');
    shortsAccessScript.src = '../youtube-start/access.js?v=10';
    document.body.appendChild(shortsAccessScript);
  }

  var ctaHtml = '';
  if (comingSoon) {
    ctaHtml = '<button class="dclass-btn dclass-btn-disabled" type="button" disabled>준비 중입니다</button>';
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

})();
