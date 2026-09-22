(function () {
  var params = new URLSearchParams(window.location.search);
  var partnerId = params.get('partner');
  var partner = window.getCareerPartner ? window.getCareerPartner(partnerId) : null;

  if (!partner) {
    window.location.replace('../career.html');
    return;
  }

  document.title = partner.nameKo + ' | Harmony Link 직업교육';

  var logoHtml = partner.logo
    ? '<div class="career-partner-logo"><img src="' + partner.logo + '" alt="' + partner.nameKo + ' 로고" onerror="this.closest(\'.career-partner-logo\').remove()"></div>'
    : '';
  var websiteHtml = partner.websiteUrl
    ? '<a class="career-partner-website" href="' + partner.websiteUrl + '" target="_blank" rel="noopener noreferrer">공식 홈페이지 보기 ↗</a>'
    : '';

  document.getElementById('partnerHero').innerHTML =
    '<div class="career-shell">' +
    '<div class="career-partner-hero-head">' + logoHtml + '<h1>' + partner.nameKo + '</h1></div>' +
    '<p class="lead">' + partner.taglineKo + '</p>' +
    '<div class="career-hero-meta"><span class="career-badge">' + partner.badgeKo + '</span>' + websiteHtml + '</div>' +
    '</div>';

  document.getElementById('programGrid').innerHTML = partner.programs.map(function (program) {
    return '' +
      '<a class="career-program-card" href="program.html?partner=' + encodeURIComponent(partner.id) + '&program=' + encodeURIComponent(program.id) + '">' +
      '<div class="career-program-image"><span class="placeholder-icon" aria-hidden="true">' + program.icon + '</span>' +
      '<img src="' + program.image + '" alt="' + program.nameKo + '" loading="lazy" onerror="this.style.display=\'none\'"></div>' +
      '<div class="career-program-body">' +
      '<h3>' + program.nameKo + '</h3>' +
      '<p class="career-program-name-en">' + program.nameEn + '</p>' +
      '<div class="career-program-meta"><span>' + program.duration + '</span><span>' + program.certification.code + '</span></div>' +
      '<p class="desc">' + (program.shortIntro || (program.certPrepKo + '. ' + program.format[0] + '.')) + '</p>' +
      '<span class="career-program-btn">과정 보기 →</span>' +
      '</div></a>';
  }).join('');

  document.getElementById('footerNote').textContent = partner.nameKo + '는 Harmony Link에 입점한 파트너 기관이 직접 운영하는 프로그램입니다.';
})();
