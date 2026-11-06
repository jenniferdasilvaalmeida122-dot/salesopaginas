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
  document.querySelectorAll('.cycle-content, .rituals article, .faq > div:last-child').forEach(element => pageMotion.observe(element));
}


// Revelação editorial sem alterar palavras, ênfases ou leitura por tecnologia assistiva.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const editorialObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(entry.target.matches('h1,h2') ? 'type-arrived' : 'media-arrived');
      editorialObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('h1,h2').forEach(heading => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    let wordIndex = 0;
    textNodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part.trim()) { fragment.append(document.createTextNode(part)); return; }
        const word = document.createElement('span');
        word.className = 'type-word';
        word.textContent = part;
        word.style.setProperty('--word-delay', `${Math.min(wordIndex++ * 35, 350)}ms`);
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    editorialObserver.observe(heading);
  });
  document.querySelectorAll('.hero-visual,.card-artwork,.faq-photo,.banner').forEach(element => editorialObserver.observe(element));
}


// Abas de apresentação: apenas capturas, sem conectar aos dados pessoais do app.
const previewTabs = [...document.querySelectorAll('[data-preview]')];
let previewTheme = 'light';
const previewScreens = {
  habitos: { title: 'Sua constância, um dia de cada vez.', description: 'Crie seus hábitos, defina uma meta diária e acompanhe o que já fez. Você escolhe entre cartões, últimos cinco dias e calendário mensal.', alt: 'Tela Hábitos do HabitKit com metas diárias, progresso de hoje e histórico dos hábitos' },
  calendario: { title: 'Seu caminho fica registrado.', description: 'Abra um hábito para consultar o calendário, registrar dias anteriores e guardar notas sobre o que ajudou ou dificultou a sua rotina.', alt: 'Tela interna de um hábito com histórico anual, sequência e calendário mensal' },
  estatisticas: { title: 'Enxergue o seu progresso.', description: 'Veja suas conclusões, a constância e a evolução dos hábitos ao longo do tempo. Pequenos passos que você consegue acompanhar.', alt: 'Tela de Estatísticas do HabitKit com o resumo e a evolução dos hábitos' },
  'vision-board': { title: 'Dê forma à vida que você deseja.', description: 'Reúna imagens, frases e referências no seu mural. Organize por categorias e escolha suas fotos principais para aparecerem na tela inicial.', alt: 'Tela Vision Board do HabitKit com mural pessoal, imagens favoritas e categorias' }
};
function selectPreviewTab(tab) {
  const key = tab.dataset.preview;
  const screen = previewScreens[key];
  if (!screen) return;
  previewTabs.forEach(button => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelector('#app-preview-panel').setAttribute('aria-labelledby', tab.id);
  document.querySelector('#preview-title').textContent = screen.title;
  document.querySelector('#preview-description').textContent = screen.description;
  document.querySelector('#preview-step').textContent = `0${previewTabs.indexOf(tab) + 1} / 04`;
  const image = document.querySelector('#preview-image');
  image.alt = screen.alt;
  image.src = `assets/app-preview/${key}${previewTheme === 'dark' ? '-escuro' : ''}.png?v=${key === 'vision-board' ? 'mural-sem-barra-1' : 'fotos-reais-1'}`;
  image.parentElement.dataset.theme = previewTheme;
  const frame = image.parentElement;
  frame.scrollTop = 0;
  frame.classList.remove('is-switching');
  void frame.offsetWidth;
  frame.classList.add('is-switching');
  const list = tab.parentElement;
  list.scrollTo({ left: Math.max(0, tab.offsetLeft - list.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
previewTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPreviewTab(tab));
  tab.addEventListener('keydown', event => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? previewTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + previewTabs.length) % previewTabs.length;
    previewTabs[next].focus({ preventScroll: true });
    selectPreviewTab(previewTabs[next]);
  });
});


const previewThemeButtons = [...document.querySelectorAll('[data-preview-theme]')];
previewThemeButtons.forEach(button => {
  button.addEventListener('click', () => {
    previewTheme = button.dataset.previewTheme;
    previewThemeButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    const selected = previewTabs.find(tab => tab.getAttribute('aria-selected') === 'true');
    if (selected) selectPreviewTab(selected);
  });
});
