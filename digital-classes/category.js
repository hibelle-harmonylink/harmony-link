(function () {
  var params = new URLSearchParams(window.location.search);
  var categoryId = params.get('id');
  var category = window.DIGITAL_CATEGORIES.getCategory(categoryId);
  var text = window.digitalText || function (ko) { return ko; };
  document.documentElement.lang = window.DIGITAL_LANGUAGE || 'ko';

  if (!category) {
    window.location.replace('index.html');
    return;
  }

  document.title = category.title + text(' | 하이벨 디지털 클래스', ' | Harmony Link Digital Classes');
  document.getElementById('breadcrumbCurrent').textContent = '/ ' + category.title;

  document.getElementById('categoryHero').innerHTML =
    '<div class="dclass-hero-icon">' + category.icon + '</div>' +
    '<p class="dclass-eyebrow">DIGITAL CLASS</p>' +
    '<h1>' + category.title + '</h1>' +
    '<p>' + category.shortDesc + '</p>';

  document.getElementById('programList').innerHTML = category.programs.map(function (program) {
    if (program.highlight) {
      var ctaHtml = '';
      if (program.cta) {
        var target = program.cta.type === 'form' ? ' target="_blank" rel="noopener noreferrer"' : '';
        ctaHtml += '<a class="dclass-btn dclass-btn-primary" href="' + program.cta.url + '"' + target + '>' + program.cta.label + '</a>';
      }
      if (program.secondaryCta) {
        var target2 = program.secondaryCta.type === 'form' ? ' target="_blank" rel="noopener noreferrer"' : '';
        ctaHtml += '<a class="dclass-btn dclass-btn-outline" href="' + program.secondaryCta.url + '"' + target2 + '>' + program.secondaryCta.label + '</a>';
      }
      return '' +
        '<article class="dclass-highlight-band">' +
        (program.badge ? '<span class="dclass-highlight-badge">' + program.badge + '</span>' : '') +
        '<h3>' + program.tagline + '</h3>' +
        '<p class="intro">' + program.intro + '</p>' +
        (program.disclaimer ? '<p class="dclass-highlight-disclaimer">' + program.disclaimer + '</p>' : '') +
        '<div class="dclass-btn-row">' + ctaHtml + '</div>' +
        '<a class="dclass-highlight-more" href="program.html?category=' + category.id + '&program=' + program.id + '">' + program.title + ' 커리큘럼 자세히 보기 →</a>' +
        '</article>';
    }

    var badgeHtml = program.status === 'comingSoon'
      ? '<span class="dclass-comingsoon-badge">' + text('준비 중 · COMING SOON', 'COMING SOON') + '</span>'
      : (program.badge ? '<span class="dclass-program-badge">' + program.badge + '</span>' : '');

    return '' +
      '<article class="dclass-program-card">' +
      badgeHtml +
      '<h3>' + program.title + '</h3>' +
      (program.tagline ? '<p class="dclass-program-tagline">' + program.tagline + '</p>' : '') +
      '<p class="intro">' + program.intro + '</p>' +
      '<a class="dclass-btn dclass-btn-primary" href="program.html?category=' + category.id + '&program=' + program.id + '">' + text('자세히 보기', 'View Details') + '</a>' +
      '</article>';
  }).join('');

  document.querySelector('.dclass-breadcrumb a').textContent = text('디지털 클래스', 'Digital Classes');
  document.querySelectorAll('.dclass-footer p').forEach(function (paragraph, index) {
    if (index === 0) paragraph.textContent = text('하이벨 디지털은 하이벨컨설팅이 운영하는 Harmony Link 이음문화센터의 디지털 교육 프로그램입니다.', 'Hibelle Digital is a Harmony Link digital education program operated by Hibelle Consulting.');
    if (index === 1) paragraph.innerHTML = '<a href="index.html">' + text('디지털 클래스 전체 보기', 'All Digital Classes') + '</a> · <a href="../index.html">' + text('HarmonyLink 홈', 'Harmony Link Home') + '</a>';
  });
})();
