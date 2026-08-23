(function () {
  var STORAGE_KEY = 'ytlabAnswers';
  var raw = null;
  try { raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { raw = null; }

  if (!raw) {
    window.location.replace('assessment.html');
    return;
  }

  var YTLAB = window.YTLAB;
  var result = YTLAB.evaluate(raw);

  renderPlan(result);
  renderChannels(result);
  renderCautions(result);
  wireConsultForm(result);

  function planPriceLabel(plan) {
    return plan.priceLabel;
  }

  function renderPlan(result) {
    var top = result.planTop;
    var second = result.planSecond;

    var primaryHtml = '' +
      '<div class="ytlab-primary-plan">' +
      '<span class="ytlab-plan-tag">1순위 추천 · ' + top.plan.key + '</span>' +
      '<h3>' + top.plan.nameKo + '</h3>' +
      '<p class="ytlab-plan-price">' + planPriceLabel(top.plan) + ' <small>' + top.plan.priceUnitKo + '</small></p>' +
      '<p class="ytlab-plan-price-note">' + top.plan.priceNoteKo + '</p>' +
      (top.plan.includesNote ? '<p class="ytlab-plan-includes-note">' + top.plan.includesNote + '</p>' : '') +
      '<ul class="ytlab-fit-list" style="margin-top:6px">' +
      top.plan.includes.slice(0, 6).map(function (item) { return '<li><b>✓</b><span>' + item + '</span></li>'; }).join('') +
      '</ul>' +
      '<p style="font-weight:700;margin:20px 0 8px">이 프로그램을 추천하는 이유</p>' +
      '<ul class="ytlab-reason-list">' +
      top.reasons.map(function (r) { return '<li><b>•</b><span>' + r + '</span></li>'; }).join('') +
      '</ul>' +
      '</div>';

    var secondaryHtml = second ? (
      '<div class="ytlab-secondary-plan">' +
      '<h4>2순위 대안 · ' + second.plan.key + ' — ' + second.plan.nameKo + ' (' + planPriceLabel(second.plan) + ' ' + second.plan.priceUnitKo + ')</h4>' +
      '<ul class="ytlab-reason-list">' +
      second.reasons.slice(0, 3).map(function (r) { return '<li><b>•</b><span>' + r + '</span></li>'; }).join('') +
      '</ul>' +
      '</div>'
    ) : '';

    document.getElementById('planPrimary').innerHTML = primaryHtml;
    document.getElementById('planSecondary').innerHTML = secondaryHtml;
    document.getElementById('hiddenPlan').value = top.plan.key + ' - ' + top.plan.nameKo;

    var recommendTag = document.getElementById('consultRecommendTag');
    recommendTag.hidden = false;
    recommendTag.textContent = '추천 프로그램: ' + top.plan.key;

    document.getElementById('ctaConsult').addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('consultForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('cName').focus({ preventScroll: true });
    });
  }

  function channelDetailBlock(entry) {
    var t = entry.type;
    return '' +
      '<div class="ytlab-meta-grid">' +
      '<div class="ytlab-meta-block"><h5>예상 난이도</h5><p style="margin:0">' + t.difficultyKo + '</p></div>' +
      '<div class="ytlab-meta-block"><h5>필요한 기술</h5><ul>' + t.skills.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' +
      '<div class="ytlab-meta-block"><h5>필요한 장비</h5><ul>' + t.equipment.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' +
      '<div class="ytlab-meta-block"><h5>필요한 AI 도구</h5><ul>' + t.aiTools.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' +
      '</div>' +
      '<h5 style="margin:26px 0 10px;font-size:14px;color:var(--yt-blue)">첫 콘텐츠 아이디어 5개</h5>' +
      '<ol class="ytlab-idea-list">' + t.contentIdeas.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
      '<h5 style="margin:26px 0 10px;font-size:14px;color:var(--yt-blue)">첫 7일 실행계획</h5>' +
      '<ul class="ytlab-timeline">' + YTLAB.DAY7_PLAN.map(function (d) { return '<li><b>' + d.label + '</b><span>' + d.textKo + '</span></li>'; }).join('') + '</ul>' +
      '<h5 style="margin:26px 0 10px;font-size:14px;color:var(--yt-blue)">30일 실행 로드맵</h5>' +
      '<ul class="ytlab-timeline">' + YTLAB.ROADMAP_30DAY.map(function (d) { return '<li><b>' + d.label + '</b><span>' + d.textKo + '</span></li>'; }).join('') + '</ul>' +
      '<p style="margin-top:22px"><b>예상 초기 비용 범위:</b> ' + result.budgetRangeKo + '</p>';
  }

  function renderChannels(result) {
    var top = result.channelTop3[0];
    var alts = result.channelTop3.slice(1);

    var primaryHtml = '' +
      '<div class="ytlab-channel-primary">' +
      '<span class="ytlab-score"><b>' + top.score + '</b>점 / 100</span>' +
      '<p class="ytlab-score-note">※ 성공 확률이 아닌, 현재 답변하신 조건과의 적합도입니다.</p>' +
      '<h3>' + top.type.emoji + ' ' + top.type.nameKo + '</h3>' +
      '<p style="color:var(--yt-muted);font-size:17px;margin:0 0 10px">' + top.type.summaryKo + '</p>' +
      '<p style="font-weight:700;margin:20px 0 8px">추천 이유</p>' +
      '<ul class="ytlab-reason-list">' +
      top.reasons.map(function (r) { return '<li><b>•</b><span>' + r + '</span></li>'; }).join('') +
      '</ul>' +
      channelDetailBlock(top) +
      '</div>';

    document.getElementById('channelPrimary').innerHTML = primaryHtml;

    var altsHtml = alts.map(function (entry) {
      return '' +
        '<div class="ytlab-channel-alt-card">' +
        '<span class="ytlab-score-small">적합도 ' + entry.score + '점</span>' +
        '<h4>' + entry.type.emoji + ' ' + entry.type.nameKo + '</h4>' +
        '<p style="color:var(--yt-muted);font-size:15px;margin:0">' + entry.type.summaryKo + '</p>' +
        '</div>';
    }).join('');
    document.getElementById('channelAlts').innerHTML = altsHtml;
    document.getElementById('hiddenChannel').value = top.type.nameKo + ' (' + top.score + '점)';
  }

  function renderCautions(result) {
    document.getElementById('cautionList').innerHTML =
      result.cautionsKo.map(function (c) { return '<li>' + c + '</li>'; }).join('');
  }

  function wireConsultForm(result) {
    var form = document.getElementById('consultForm');
    var status = document.getElementById('consultStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.style.color = '#c3d1e8';
      status.textContent = '전송 중입니다...';
      var submitBtn = form.querySelector('button[type=submit]');
      submitBtn.disabled = true;

      var applicantName = document.getElementById('cName').value || '신청자';
      form.querySelector('input[name="_subject"]').value = '[YouTube Income Lab] 무료 상담 신청 - ' + applicantName;

      var formData = new FormData(form);
      formData.set('접수 경로', 'YouTube Income Lab 진단 결과 페이지');
      formData.set('신청 날짜와 시간', new Date().toLocaleString('ko-KR'));

      fetch(YTLAB.BRAND.formsubmitEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      }).then(function (res) {
        if (!res.ok) throw new Error('failed');
        status.style.color = '#8be0b3';
        status.textContent = '상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다.';
        form.reset();
      }).catch(function () {
        status.style.color = '#ffb4b4';
        status.textContent = '상담 신청을 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.';
      }).finally(function () {
        submitBtn.disabled = false;
      });
    });
  }
})();
