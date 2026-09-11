(() => {
  const languageButtons = document.querySelectorAll('.lang-toggle');
  const menuButton = document.querySelector('.menu-toggle');
  const header = document.querySelector('.site-header');
  const applyLanguage = language => {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-ko][data-en]').forEach(element => {
      element.innerHTML = element.dataset[language];
    });
    languageButtons.forEach(button => {
      button.querySelectorAll('span').forEach((item,index) => item.classList.toggle('active',(language==='ko'&&index===0)||(language==='en'&&index===1)));
      button.setAttribute('aria-label',language==='ko'?'Switch to English':'한국어로 전환');
    });
    document.title = language === 'ko' ? document.body.dataset.titleKo : document.body.dataset.titleEn;
    localStorage.setItem('harmonyLanguage', language);
    document.querySelectorAll('.detail-instructor-card').forEach(card => {
      const name = card.querySelector('strong');
      const englishName = card.querySelector('small');
      if (!name || !englishName) return;
      if (!name.dataset.koName) name.dataset.koName = name.textContent.trim();
      name.textContent = language === 'en' ? englishName.textContent.trim() : name.dataset.koName;
      englishName.hidden = language === 'en';
    });
    const firstMelodyTitle = document.querySelector('.melody-program-card .melody-program-body h3');
    if (firstMelodyTitle && language === 'en') firstMelodyTitle.innerHTML = 'A Piece of Melody –<br>A Small Comfort Concert';
  };
  languageButtons.forEach(button => button.addEventListener('click', () => applyLanguage(document.documentElement.lang === 'ko' ? 'en' : 'ko')));
  menuButton?.addEventListener('click', () => {
    const open = !header.classList.contains('menu-open');
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.primary-nav a').forEach(link => link.addEventListener('click', () => {
    header?.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded','false');
  }));

  document.querySelectorAll('button.specialty-detail-more').forEach(button => {
    button.addEventListener('click', () => {
      const detail = button.nextElementSibling;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      if (detail) detail.hidden = expanded;
    });
  });

  const flyerLightbox = document.querySelector('.specialty-flyer-lightbox');
  const flyerImage = flyerLightbox?.querySelector('img');
  let flyerTrigger = null;
  const closeFlyer = () => {
    if (!flyerLightbox || flyerLightbox.hidden) return;
    flyerLightbox.hidden = true;
    document.body.classList.remove('modal-open');
    flyerImage?.removeAttribute('src');
    flyerTrigger?.focus();
  };
  document.querySelectorAll('[data-flyer-src]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      flyerTrigger = trigger;
      if (flyerImage) {
        flyerImage.src = trigger.dataset.flyerSrc;
        flyerImage.alt = trigger.querySelector('img')?.alt || '';
      }
      if (flyerLightbox) flyerLightbox.hidden = false;
      document.body.classList.add('modal-open');
      flyerLightbox?.querySelector('.specialty-flyer-close')?.focus();
    });
  });
  flyerLightbox?.querySelectorAll('[data-specialty-flyer-close]').forEach(control => control.addEventListener('click', closeFlyer));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeFlyer();
  });
  applyLanguage(localStorage.getItem('harmonyLanguage') === 'en' ? 'en' : 'ko');
})();
