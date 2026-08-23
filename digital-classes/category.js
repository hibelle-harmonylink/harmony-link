(function () {
  var params = new URLSearchParams(window.location.search);
  var categoryId = params.get('id');
  var category = window.DIGITAL_CATEGORIES.getCategory(categoryId);

  if (!category) {
    window.location.replace('index.html');
    return;
  }

  document.title = category.title + ' | 하이벨 디지털 클래스';
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
      ? '<span class="dclass-comingsoon-badge">준비 중 · COMING SOON</span>'
      : (program.badge ? '<span class="dclass-program-badge">' + program.badge + '</span>' : '');

    return '' +
      '<article class="dclass-program-card">' +
      badgeHtml +
      '<h3>' + program.title + '</h3>' +
      (program.tagline ? '<p class="dclass-program-tagline">' + program.tagline + '</p>' : '') +
      '<p class="intro">' + program.intro + '</p>' +
      '<a class="dclass-btn dclass-btn-primary" href="program.html?category=' + category.id + '&program=' + program.id + '">자세히 보기</a>' +
      '</article>';
  }).join('');
})();
