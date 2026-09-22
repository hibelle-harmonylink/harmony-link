(function () {
  var grid = document.getElementById('careerPartnerGrid');
  if (!grid || !window.CAREER_PARTNERS) return;
  grid.innerHTML = window.CAREER_PARTNERS.map(function (partner) {
    var logoHtml = partner.logo
      ? '<div class="career-partner-logo"><img src="' + partner.logo.replace('../', '') + '" alt="' + partner.nameKo + ' 로고" onerror="this.closest(\'.career-partner-logo\').remove()"></div>'
      : '';
    return '' +
      '<a class="career-partner-card" href="career/partner.html?partner=' + encodeURIComponent(partner.id) + '">' +
      '<span class="career-partner-badge">' + partner.badgeKo + '</span>' +
      '<div class="career-partner-head">' + logoHtml + '<h3>' + partner.nameKo + '</h3></div>' +
      '<p>' + partner.taglineKo + '</p>' +
      '<span class="career-partner-cta">프로그램 보기 →</span>' +
      '</a>';
  }).join('');
})();
