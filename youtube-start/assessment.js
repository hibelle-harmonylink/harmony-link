(function () {
  var QUESTIONS = window.YTLAB.QUESTIONS;
  var STORAGE_KEY = 'ytlabAnswers';
  var current = 0;
  // Every load of this page is a fresh "무료 진단 시작하기" entry point (there's no
  // in-page resume link), so always start blank instead of restoring a previous run.
  var answers = {};
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}

  var questionArea = document.getElementById('questionArea');
  var progressFill = document.getElementById('progressFill');
  var progressLabel = document.getElementById('progressLabel');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  function save() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch (e) {}
  }

  function isAnswered(q) {
    var v = answers[q.id];
    if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
    return !!v;
  }

  function render() {
    var q = QUESTIONS[current];
    var pct = Math.round(((current + 1) / QUESTIONS.length) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = '질문 ' + (current + 1) + ' / ' + QUESTIONS.length;

    var html = '<h2>' + q.titleKo + '</h2>';
    if (q.helpKo) html += '<p class="ytlab-question-help">' + q.helpKo + '</p>';
    html += '<div class="ytlab-options" role="group" aria-label="' + q.titleKo + '">';

    q.options.forEach(function (opt, i) {
      var inputType = q.type === 'multi' ? 'checkbox' : 'radio';
      var name = 'q_' + q.id;
      var checked = q.type === 'multi'
        ? (Array.isArray(answers[q.id]) && answers[q.id].indexOf(opt.value) !== -1)
        : (answers[q.id] === opt.value);
      html += '<label class="ytlab-option' + (checked ? ' is-checked' : '') + '" data-value="' + opt.value + '">' +
        '<input type="' + inputType + '" name="' + name + '" value="' + opt.value + '"' + (checked ? ' checked' : '') + '>' +
        '<span>' + opt.labelKo + '</span></label>';
    });
    html += '</div>';
    questionArea.innerHTML = html;

    questionArea.querySelectorAll('.ytlab-option input').forEach(function (input) {
      input.addEventListener('change', function () { onAnswerChange(q); });
    });

    prevBtn.disabled = current === 0;
    var isLast = current === QUESTIONS.length - 1;
    nextBtn.textContent = isLast ? '결과 보기' : '다음';
    updateNextEnabled(q);
  }

  function updateNextEnabled(q) {
    nextBtn.disabled = !isAnswered(q);
  }

  function onAnswerChange(q) {
    if (q.type === 'multi') {
      var values = Array.prototype.map.call(
        questionArea.querySelectorAll('input:checked'),
        function (el) { return el.value; }
      );
      answers[q.id] = values;
    } else {
      var checkedEl = questionArea.querySelector('input:checked');
      answers[q.id] = checkedEl ? checkedEl.value : '';
    }
    questionArea.querySelectorAll('.ytlab-option').forEach(function (label) {
      var input = label.querySelector('input');
      label.classList.toggle('is-checked', input.checked);
    });
    save();
    updateNextEnabled(q);
  }

  prevBtn.addEventListener('click', function () {
    if (current === 0) return;
    current -= 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', function () {
    var q = QUESTIONS[current];
    if (!isAnswered(q)) return;
    if (current === QUESTIONS.length - 1) {
      save();
      window.location.href = 'result.html';
      return;
    }
    current += 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  render();
})();
