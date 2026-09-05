(function () {
  var YTLAB = window.YTLAB;

  renderPlans();
  wireConsultForm();
  wireConsultButtons();

  function renderPlans() {
    var order = ['start', 'build', 'coach'];
    var html = order.map(function (id) {
      var plan = YTLAB.PRICING.plans[id];
      var isBuild = id === 'build';
      return '' +
        '<div class="ytlab-plan' + (isBuild ? ' is-build' : '') + '">' +
        (isBuild ? '<span class="ytlab-plan-badge">가장 많이 선택</span>' : '') +
        '<p class="ytlab-plan-key">' + plan.key + '</p>' +
        '<h3>' + plan.nameKo + '</h3>' +
        '<p class="ytlab-plan-bestfor">' + (id === 'coach' ? plan.bestForKo.replace(/^개인\s*/, '') : plan.bestForKo) + '</p>' +
        '<ul>' + plan.includes.map(function (item) { return '<li><b>✓</b><span>' + item + '</span></li>'; }).join('') + '</ul>' +
        '<a class="ytlab-btn ytlab-btn-primary ytlab-btn-block" href="#consult" data-consult-plan="' + plan.key + '">' + plan.key + ' 상담 신청</a>' +
        '</div>';
    }).join('');
    document.getElementById('plansGrid').innerHTML = html;
  }

  function wireConsultButtons() {
    var consult = document.getElementById('consult');
    var interestField = document.getElementById('lInterest');
    document.getElementById('plansGrid').addEventListener('click', function (event) {
      var button = event.target.closest('[data-consult-plan]');
      if (!button) return;
      event.preventDefault();
      consult.hidden = false;
      interestField.value = button.dataset.consultPlan;
      window.requestAnimationFrame(function () {
        consult.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function wireConsultForm() {
    var form = document.getElementById('consultForm');
    var status = document.getElementById('consultStatus');
    var interestField = document.getElementById('lInterest');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!interestField.value) {
        status.style.color = '#ffb4b4';
        status.textContent = '관심 프로그램을 선택해 주세요.';
        interestField.focus();
        return;
      }

      status.style.color = '#c3d1e8';
      status.textContent = '전송 중입니다...';
      var submitBtn = form.querySelector('button[type=submit]');
      submitBtn.disabled = true;

      var applicantName = document.getElementById('lName').value || '신청자';
      form.querySelector('input[name="_subject"]').value = '[YouTube Income Lab] 무료 상담 신청 - ' + applicantName;

      var formData = new FormData(form);
      formData.set('접수 경로', 'YouTube Income Lab 랜딩페이지');
      formData.set('신청 날짜와 시간', new Date().toLocaleString('ko-KR'));

      fetch(YTLAB.BRAND.formsubmitEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      }).then(function (res) {
        if (!res.ok) throw new Error('failed');
        status.style.color = '#ffffff';
        status.style.fontWeight = '700';
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
