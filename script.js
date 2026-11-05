const menu = document.querySelector('.menu');
const links = document.querySelector('.nav-links');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.textContent = open ? '✕' : '☰';
  links.classList.toggle('open', open);
});
links.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  links.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menu');
  menu.textContent = '☰';
}));
document.querySelector('#year').textContent = new Date().getFullYear();

// Movimento progressivo: não altera conteúdo nem esconde elementos sem JavaScript.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const revealed = new WeakSet();
let entryObserver;
function configureEntrances() {
  entryObserver?.disconnect();
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  entryObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      revealed.add(element);
      if (element.classList.contains('type-ready')) {
        revealLines(element);
        entryObserver.unobserve(element);
        return;
      }
      element.classList.add('motion-enter');
      element.addEventListener('animationend', event => {
        if (event.target === element) {
          element.classList.remove('motion-enter');
          element.style.removeProperty('--entry-delay');
        }
      });
      entryObserver.unobserve(element);
    });
  }, { threshold: 0.12 });
  const groups = document.querySelectorAll('.hero-copy, .section-title, .cycle-list, .rituals, .cards');
  groups.forEach(group => [...group.children].forEach((element, index) => {
    if (!revealed.has(element)) element.style.setProperty('--entry-delay', `${Math.min(index, 2) * 110}ms`);
  }));
  document.querySelectorAll('.hero-copy > *, .section-title > *, .cycle h2, .cycle-list li, .cycle blockquote, .photo-card, .about > div:first-child > .eyebrow, .about h2, .intro, .benefit, .about-photo, .banner > *, .split-title, .rituals article, .faq-photo, .faq h2, .faq details, .closing > *').forEach(element => {
    if (!revealed.has(element)) entryObserver.observe(element);
  });
}
// Deslocamento máximo de 2px, sem zoom, troca de foto ou animação contínua.
const backgroundSections = [...document.querySelectorAll('.hero, .banner')];
let scrollFrame = 0;
function updateBackgroundMotion() {
  scrollFrame = 0;
  if (motionPreference.matches || document.hidden) return;
  backgroundSections.forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = element.classList.contains('hero')
      ? Math.max(0, Math.min(1, -rect.top / rect.height))
      : Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
    element.style.setProperty('--photo-drift', `${(progress * 2).toFixed(2)}px`);
  });
}
function requestBackgroundMotion() {
  if (!motionPreference.matches && !scrollFrame) scrollFrame = requestAnimationFrame(updateBackgroundMotion);
}
addEventListener('scroll', requestBackgroundMotion, { passive: true });
addEventListener('resize', requestBackgroundMotion);
document.addEventListener('visibilitychange', requestBackgroundMotion);
motionPreference.addEventListener('change', () => {
  document.querySelectorAll('.motion-enter').forEach(element => {
    element.classList.remove('motion-enter');
    element.style.removeProperty('--entry-delay');
  });
  if (motionPreference.matches) {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    backgroundSections.forEach(element => element.style.removeProperty('--photo-drift'));
  }
  document.querySelectorAll('.type-reveal').forEach(element => element.classList.remove('type-reveal'));
  configureEntrances();
  requestBackgroundMotion();
});
initializeTypography();
configureEntrances();
// O fundo mantém a posição original até a primeira interação.
function closeMenu(returnFocus = false) {
  links.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menu');
  menu.textContent = '☰';
  if (returnFocus) menu.focus();
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => {
  if (menu.getAttribute('aria-expanded') === 'true' && !event.target.closest('.nav')) closeMenu();
});

// Revelação por linhas reais: preserva texto, ênfases e quebras em cada largura.
function initializeTypography() {
  document.querySelectorAll('h1, h2, .hero-copy > p:not(.eyebrow), .section-title > p:last-child, .intro, .cycle blockquote p').forEach(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) fragment.append(document.createTextNode(part));
        else { const span = document.createElement('span'); span.className = 'type-word'; span.textContent = part; fragment.append(span); }
      });
      node.replaceWith(fragment);
    });
    element.classList.add('type-ready');
    measureLines(element);
  });
}
function measureLines(element) {
  let previous = -Infinity;
  let line = -1;
  element.querySelectorAll('.type-word').forEach(word => {
    // offsetTop é estável durante a animação de transform.
    const top = word.offsetTop;
    if (Math.abs(top - previous) > 5) { line++; previous = top; }
    word.style.setProperty('--line-delay', `${Math.min(line, 8) * 120}ms`);
  });
  return Math.min(line, 8) * 120;
}
function revealLines(element) {
  if (motionPreference.matches) return;
  const delay = measureLines(element);
  element.classList.add('type-reveal');
  setTimeout(() => element.classList.remove('type-reveal'), delay + (parseInt(element.style.getPropertyValue('--entry-delay'), 10) || 0) + 900);
}
let typeResize;
addEventListener('resize', () => {
  clearTimeout(typeResize);
  typeResize = setTimeout(() => document.querySelectorAll('.type-ready').forEach(measureLines), 140);
});
document.fonts?.ready.then(() => document.querySelectorAll('.type-ready').forEach(measureLines));
