(function () {
  var HARMONY_REQUEST_FORM_URL = 'https://docs.google.com/forms/d/1LfKkCnsfGLgsvs9ptLluwZkkGupY6iJYBzBbA7jMEK8/viewform';

  var params = new URLSearchParams(window.location.search);
  var partnerId = params.get('partner');
  var programId = params.get('program');
  var found = window.getCareerProgram ? window.getCareerProgram(partnerId, programId) : null;

  if (!found) {
    window.location.replace('../career.html');
    return;
  }

  var partner = found.partner;
  var program = found.program;
  var partnerUrl = 'partner.html?partner=' + encodeURIComponent(partner.id);

  document.title = program.nameKo + ' | ' + partner.nameKo + ' | Harmony Link';
  document.getElementById('backLink').href = partnerUrl;
  document.getElementById('backLink').textContent = '← ' + partner.nameKo + ' 프로그램 목록';

  document.getElementById('breadcrumb').innerHTML =
    '<a href="../">홈</a> / <a href="../career.html">직업</a> / <a href="' + partnerUrl + '">' + partner.nameKo + '</a> / ' + program.nameKo;

  document.getElementById('detailMeta').innerHTML =
    '<span>' + program.duration + '</span><span>' + program.certification.code + '</span>';
  document.getElementById('detailTitle').textContent = program.nameKo;
  document.getElementById('detailTitleEn').textContent = program.nameEn;

  document.getElementById('detailFlyer').innerHTML =
    '<span class="placeholder-icon" aria-hidden="true">' + program.icon + '</span>' +
    '<img src="' + program.image + '" alt="' + program.nameKo + '" onerror="this.style.display=\'none\'">';

  var sections = [];

  var introBody = program.shortIntro
    ? '<p>' + program.shortIntro + '</p>'
    : '<p>' + program.duration + ' 과정으로 ' + program.certPrepKo + '을 목표로 합니다.</p>';
  sections.push('<section class="career-detail-section"><h2>과정 소개</h2>' + introBody + '</section>');

  sections.push(
    '<section class="career-detail-section"><h2>무엇을 배우나요?</h2>' +
    '<ul class="career-bullet-list">' + program.whatYouLearn.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
    '</section>'
  );

  sections.push(
    '<section class="career-detail-section"><h2>수업은 어떻게 진행되나요?</h2>' +
    '<p><strong>' + program.duration + '</strong> · ' + program.certPrepKo + '</p>' +
    '<ul class="career-format-list">' + program.format.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
    '</section>'
  );

  sections.push(
    '<section class="career-detail-section"><h2>어떤 자격증을 준비하나요?</h2>' +
    '<div class="career-cert-card"><b>' + program.certification.code + '</b><span>' + program.certification.name + '</span></div>' +
    '</section>'
  );

  if (program.audience && program.audience.length) {
    sections.push(
      '<section class="career-detail-section"><h2>어떤 분에게 추천하나요?</h2>' +
      '<ul class="career-bullet-list">' + program.audience.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
      '</section>'
    );
  }

  var remoteNoteHtml = program.remoteNote ? '<p class="career-remote-note">' + program.remoteNote + '</p>' : '';
  sections.push(
    '<section class="career-detail-section"><h2>어디에 취직하나요?</h2>' +
    '<ul class="career-bullet-list">' + program.careerFields.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
    remoteNoteHtml +
    '</section>'
  );

  sections.push(
    '<section class="career-detail-section">' +
    '<h2>꼭 확인하세요</h2>' +
    '<p class="career-disclaimer">자격증 활용, 업무 범위, 등록·면허 및 취업 요건은 주(State)와 고용기관에 따라 달라질 수 있습니다. 위 내용은 일반적인 과정 안내이며, 특정 취업이나 합격을 보장하지 않습니다.</p>' +
    '<div class="career-cta-row">' +
    '<a class="career-btn career-btn-primary" href="' + HARMONY_REQUEST_FORM_URL + '" target="_blank" rel="noopener noreferrer">문의 및 신청하기</a>' +
    '<a class="career-btn career-btn-outline" href="' + partnerUrl + '">다른 프로그램 보기</a>' +
    '</div>' +
    '</section>'
  );

  document.getElementById('detailSections').innerHTML = sections.join('');
  document.getElementById('footerNote').textContent = partner.nameKo + '는 Harmony Link에 입점한 파트너 기관이 직접 운영하는 프로그램입니다.';
})();
