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


// Rolagem manual dos três cards; sem avanço automático.
const cardTrack = document.querySelector('#journey-cards');
if (cardTrack) {
  const cards = [...cardTrack.querySelectorAll('.photo-card')];
  const pagination = document.createElement('nav');
  pagination.className = 'card-pagination';
  pagination.setAttribute('aria-label', 'Escolher card da jornada');
  const cardPosition = card => Math.min(
    cardTrack.scrollWidth - cardTrack.clientWidth,
    card.getBoundingClientRect().left - cardTrack.getBoundingClientRect().left + cardTrack.scrollLeft
  );
  const buttons = cards.map((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Ver card ${index + 1}: ${card.querySelector('h3').textContent}`);
    button.setAttribute('aria-controls', 'journey-cards');
    button.addEventListener('click', () => cardTrack.scrollTo({
      left: cardPosition(card),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    }));
    pagination.append(button);
    return button;
  });
  function updateCardIndicator() {
    const distances = cards.map(card => Math.abs(cardPosition(card) - cardTrack.scrollLeft));
    const active = distances.indexOf(Math.min(...distances));
    buttons.forEach((button, index) => button.setAttribute('aria-current', String(index === active)));
  }
  cardTrack.after(pagination);
  cardTrack.addEventListener('scroll', updateCardIndicator, { passive: true });
  addEventListener('resize', updateCardIndicator);
  cardTrack.addEventListener('keydown', event => {
    if (event.target !== cardTrack || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const active = buttons.findIndex(button => button.getAttribute('aria-current') === 'true');
    buttons[Math.max(0, Math.min(cards.length - 1, active + (event.key === 'ArrowRight' ? 1 : -1)))].click();
  });
  updateCardIndicator();
}
