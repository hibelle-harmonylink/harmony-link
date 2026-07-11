const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
const langButton = document.querySelector('.lang-toggle');
const toTop = document.querySelector('.to-top');
let currentLanguage = localStorage.getItem('harmonyLanguage') || 'ko';

function closeMenu() {
  menuButton.classList.remove('open');
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

menuButton.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  menuButton.classList.toggle('open', open);
  nav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.querySelectorAll('[data-ko][data-en]').forEach(element => {
    element.innerHTML = element.dataset[language];
  });
  document.querySelectorAll('[data-placeholder-ko]').forEach(element => {
    element.placeholder = element.dataset[`placeholder${language === 'ko' ? 'Ko' : 'En'}`];
  });
  langButton.querySelectorAll('span').forEach((item, index) => item.classList.toggle('active', (language === 'ko' && index === 0) || (language === 'en' && index === 1)));
  langButton.setAttribute('aria-label', language === 'ko' ? 'Switch to English' : '한국어로 전환');
  menuButton.setAttribute('aria-label', language === 'ko' ? '메뉴 열기' : 'Open menu');
  toTop.setAttribute('aria-label', language === 'ko' ? '맨 위로' : 'Back to top');
  document.title = language === 'ko' ? 'Harmony Link | 배움으로 이어지는 우리' : 'Harmony Link | Connected through learning';
  localStorage.setItem('harmonyLanguage', language);
}

langButton.addEventListener('click', () => setLanguage(currentLanguage === 'ko' ? 'en' : 'ko'));

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 30;
  header.classList.toggle('scrolled', scrolled);
  toTop.classList.toggle('show', window.scrollY > 500);
});

toTop.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {threshold: 0.12});

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.getElementById('applyForm').addEventListener('submit', event => {
  event.preventDefault();
  const status = event.currentTarget.querySelector('.form-status');
  status.textContent = currentLanguage === 'ko' ? '신청이 접수되었습니다. 빠르게 연락드리겠습니다.' : 'Your request has been received. We will be in touch shortly.';
  event.currentTarget.reset();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

setLanguage(currentLanguage);
