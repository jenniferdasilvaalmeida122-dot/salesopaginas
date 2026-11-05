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
