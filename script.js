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
    button.setAttribute('aria-label', `Ver card ${index + 1}: ${card.querySelector('h3')?.textContent || card.querySelector('img')?.alt || 'Sua jornada'}`);
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


// O preço no checkout é administrado separadamente; este aviso mostra o prazo diário.
const offerBanner = document.querySelector('.offer-banner');
if (offerBanner) {
  const offerDate = document.querySelector('#offer-date');
  const offerClock = document.querySelector('#offer-clock');
  const brasiliaClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  function updateOfferCountdown() {
    const parts = Object.fromEntries(brasiliaClock.formatToParts(new Date()).map(part => [part.type, part.value]));
    const remaining = 86400 - (Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second));
    const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
    const minutes = String(Math.floor(remaining % 3600 / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    offerDate.textContent = `${parts.day}/${parts.month}/${parts.year}`;
    offerDate.dateTime = `${parts.year}-${parts.month}-${parts.day}`;
    offerClock.textContent = `${hours}:${minutes}:${seconds}`;
    offerBanner.hidden = false;
  }
  updateOfferCountdown();
  setInterval(updateOfferCountdown, 1000);
  document.addEventListener('visibilitychange', updateOfferCountdown);
}
