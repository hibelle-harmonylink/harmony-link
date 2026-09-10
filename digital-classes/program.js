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
  document.getElementById('breadcrumb').innerHTML =
    '<a href="index.html">디지털 클래스</a> / <a href="category.html?id=' + category.id + '">' + category.title + '</a> / ' + program.title;

  var comingSoon = program.status === 'comingSoon';
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

  var upcoming = category.programs.filter(function (p) { return p.status === 'comingSoon' && p.id !== program.id; });
  if (category.id === 'ai' && program.id === 'ai-start' && upcoming.length) {
    stepCards.push(
      '<article class="dclass-step-block dclass-step-upcoming" style="--step-accent:' + category.accent + '">' +
      '<div class="dclass-step-visual" aria-hidden="true"><span>🧩</span></div>' +
      '<div class="dclass-step-copy"><h4>단계별 AI 심화 과정</h4><p>실전 중심의 AI 수업을 단계별로 확장합니다.</p></div>' +
      '<ul>' + upcoming.map(function (p) { return '<li>' + p.title + ' · 순차 오픈 예정</li>'; }).join('') + '</ul>' +
      '</article>'
    );
  }
  document.getElementById('stepGrid').innerHTML = stepCards.join('');

  document.getElementById('audienceList').innerHTML = program.audience.map(function (a) {
    return '<li><b>✓</b><span>' + a + '</span></li>';
  }).join('');

  document.getElementById('noteArea').innerHTML = program.note
    ? '<div class="dclass-note">' + program.note + '</div>' : '';

  document.getElementById('disclaimerArea').innerHTML = program.disclaimer
    ? '<div class="dclass-disclaimer"><h3 style="margin:0 0 8px;font-size:16px">수익 관련 안내</h3><p style="margin:0">' + program.disclaimer + '</p></div>' : '';

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

  var upcomingEl = document.getElementById('upcomingArea');
  if (upcomingEl) {
    upcomingEl.innerHTML = upcoming.length && !(category.id === 'ai' && program.id === 'ai-start')
      ? '<div class="dclass-note"><b>세부 프로그램은 순차적으로 추가됩니다.</b><ul style="margin:10px 0 0;padding-left:20px">' +
        upcoming.map(function (p) { return '<li>' + p.title + ' <span style="color:var(--dc-muted)">(준비 중)</span></li>'; }).join('') +
        '</ul></div>'
      : '';
  }
})();
