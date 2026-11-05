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

// Anima apenas elementos existentes, sem esconder conteúdo antes da entrada.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let entryObserver;
if ('IntersectionObserver' in window && !motionPreference.matches) {
  entryObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-enter');
      entry.target.addEventListener('animationend', () => entry.target.classList.remove('motion-enter'), { once: true });
      entryObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.hero-copy, .section-title, .cycle-content, .benefit, .about-photo, .banner, .split-title, .rituals article, .faq-photo, .closing').forEach(element => entryObserver.observe(element));
}
motionPreference.addEventListener('change', event => {
  if (event.matches) {
    entryObserver?.disconnect();
    document.querySelectorAll('.motion-enter').forEach(element => element.classList.remove('motion-enter'));
  }
});
// Mantém o menu original e permite fechá-lo pelo teclado.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    links.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menu');
    menu.textContent = '☰';
    menu.focus();
  }
});
