const menu = document.querySelector('.menu');
const links = document.querySelector('.nav-links');
function closeMenu(returnFocus = false) {
  links.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menu');
  menu.textContent = '☰';
  if (returnFocus) menu.focus();
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  links.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.textContent = open ? '✕' : '☰';
});
links.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
matchMedia('(min-width: 601px)').addEventListener('change', () => closeMenu());
document.querySelector('#year').textContent = new Date().getFullYear();

// A página permanece legível sem JavaScript; movimento é uma melhoria progressiva.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveals = document.querySelectorAll('.section-title, .cycle-content, .about-photo, .benefit, .split-title, .rituals article, .faq-photo, .closing');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(element => { element.classList.add('reveal', 'pending'); observer.observe(element); });
  document.body.classList.add('motion-ready');
}
const progress = document.querySelector('.reading-progress');
const dockLinks = [...document.querySelectorAll('.app-dock a')];
let framePending = false;
function updateNavigation() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
  let current = dockLinks[0];
  dockLinks.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section.getBoundingClientRect().top <= innerHeight * 0.4) current = link;
  });
  dockLinks.forEach(link => {
    const active = link === current;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  framePending = false;
}
function scheduleNavigation() { if (!framePending) { framePending = true; requestAnimationFrame(updateNavigation); } }
addEventListener('scroll', scheduleNavigation, { passive: true });
addEventListener('resize', scheduleNavigation);
updateNavigation();

// Registro local dos rituais: sem conta, envio de dados ou promessa de serviço externo.
const storageKey = 'rotina-glow-up:daily-rituals';
function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}
let day = todayKey();
let completed = [];
let canSave = true;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && saved.day === day && Array.isArray(saved.completed)) completed = [...new Set(saved.completed.filter(i => [0, 1, 2].includes(i)))];
} catch { canSave = false; }
const ritualButtons = [...document.querySelectorAll('.ritual-check')];
const status = document.querySelector('#ritual-status');
const track = document.querySelector('.track');
const toast = document.querySelector('.toast');
let toastTimer;
function renderRituals() {
  ritualButtons.forEach((button, i) => {
    const done = completed.includes(i);
    button.setAttribute('aria-pressed', String(done));
    button.textContent = done ? 'Feito por mim' : 'Marcar como feito';
    button.closest('article').classList.toggle('completed', done);
  });
  status.textContent = `${completed.length} de 3 rituais concluídos`;
  track.setAttribute('aria-valuenow', String(completed.length));
  track.querySelector('span').style.width = `${completed.length / 3 * 100}%`;
}
function resetDay() {
  if (day !== todayKey()) { day = todayKey(); completed = []; renderRituals(); }
}
ritualButtons.forEach((button, i) => button.addEventListener('click', () => {
  resetDay();
  const wasDone = completed.includes(i);
  completed = wasDone ? completed.filter(value => value !== i) : [...completed, i];
  try { localStorage.setItem(storageKey, JSON.stringify({ day, completed })); } catch { canSave = false; }
  renderRituals();
  toast.textContent = !canSave ? 'Marcado nesta visita. Armazenamento local indisponível.' : wasDone ? 'Marcação desfeita.' : completed.length === 3 ? 'Seus três momentos de cuidado, concluídos.' : 'Um momento de cuidado registrado.';
  clearTimeout(toastTimer);
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}));
document.addEventListener('visibilitychange', () => { if (!document.hidden) resetDay(); });
renderRituals();

// Preserva as fotos originais e apresenta uma superfície limpa se a rede as bloquear.
document.querySelectorAll('.about-photo > img, .faq-photo > img').forEach(image => {
  function showFallback() { image.classList.add('media-unavailable'); image.parentElement.classList.add('media-fallback'); }
  image.addEventListener('error', showFallback);
  image.addEventListener('load', () => { image.classList.remove('media-unavailable'); image.parentElement.classList.remove('media-fallback'); });
  if (image.complete && !image.naturalWidth) showFallback();
});
