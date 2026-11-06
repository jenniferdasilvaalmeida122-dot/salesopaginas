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


// Entrada única e discreta dos benefícios; o conteúdo funciona sem animação.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const featureObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      featureObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.feature-item').forEach(item => featureObserver.observe(item));
}

// Mantém o gesto nativo no celular e permite arrastar os cards com o mouse.
if (cardTrack) {
  let drag = null;
  let suppressClickUntil = 0;
  cardTrack.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, left: cardTrack.scrollLeft, moved: false };
  });
  cardTrack.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      cardTrack.setPointerCapture(event.pointerId);
      cardTrack.classList.add('is-dragging');
    }
    cardTrack.scrollLeft = drag.left - delta;
  });
  function finishCardDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    if (moved) suppressClickUntil = performance.now() + 250;
    if (cardTrack.hasPointerCapture(event.pointerId)) cardTrack.releasePointerCapture(event.pointerId);
    cardTrack.classList.remove('is-dragging');
    if (moved) {
      const maxLeft = cardTrack.scrollWidth - cardTrack.clientWidth;
      const positions = [...cardTrack.querySelectorAll('.photo-card')].map(card => Math.min(maxLeft,
        card.getBoundingClientRect().left - cardTrack.getBoundingClientRect().left + cardTrack.scrollLeft));
      const nearest = positions.reduce((best, position) => Math.abs(position - cardTrack.scrollLeft) < Math.abs(best - cardTrack.scrollLeft) ? position : best);
      cardTrack.scrollTo({ left: nearest, behavior: 'instant' });
    }
  }
  cardTrack.addEventListener('pointerup', finishCardDrag);
  cardTrack.addEventListener('pointercancel', finishCardDrag);
  cardTrack.addEventListener('lostpointercapture', finishCardDrag);
  cardTrack.addEventListener('pointerleave', event => {
    if (drag && !drag.moved) finishCardDrag(event);
  });
  cardTrack.addEventListener('dragstart', event => event.preventDefault());
  cardTrack.addEventListener('click', event => {
    if (performance.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

// Entradas breves, uma única vez; nenhum conteúdo depende delas para aparecer.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const pageMotion = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('ui-enter');
      pageMotion.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.section-title, .cycle-content, .banner, .split-title, .rituals article, .faq-photo, .faq > div:last-child, .closing h2').forEach(element => pageMotion.observe(element));
}
