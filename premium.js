// Movimento progressivo: conteúdo sempre visível, sem interceptar a rolagem.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('premium-arrive');
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.12});
    document.querySelectorAll('.feature-item,.bonus-card,.guarantee-panel,.access-steps li,.offer-card').forEach(element => {
      if (element.getBoundingClientRect().top > innerHeight) observer.observe(element);
    });
  }
  let frame = 0;
  function updateProgress() {
    frame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--reading-progress', range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0);
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateProgress); }, {passive:true});
  addEventListener('resize', updateProgress);
  updateProgress();
  const stage = document.querySelector('.app-preview-stage');
  if (stage && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    stage.addEventListener('pointermove', event => {
      if (motion.matches) return;
      const bounds = stage.getBoundingClientRect();
      stage.style.setProperty('--stage-x', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 3}deg`);
      stage.style.setProperty('--stage-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 4}deg`);
    }, {passive:true});
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--stage-x', '0deg');
      stage.style.setProperty('--stage-y', '0deg');
    });
    motion.addEventListener('change', () => {
      stage.style.setProperty('--stage-x', '0deg');
      stage.style.setProperty('--stage-y', '0deg');
    });
  }
})();

// Depoimentos em movimento contínuo, com deslize manual e movimento reduzido.
const testimonialCarousel = document.querySelector('.testimonials-track');
if (testimonialCarousel) {
  const slides = [...testimonialCarousel.querySelectorAll('.testimonial-screenshot')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const rail = document.createElement('div');
  rail.className = 'testimonial-rail';
  slides.forEach(slide => rail.append(slide));
  testimonialCarousel.append(rail);
  const speed = 0.028; // 32 pixels por segundo, independente da taxa de atualização.
  let animation = null, cycle = 0, inView = false, touching = false, keyboardFocused = false;
  let resumeAt = 0, resumeTimer = 0;
  function freezeMethods() {
    if (!animation) return;
    const position = cycle ? (Number(animation.currentTime || 0) * speed) % cycle : 0;
    animation.cancel();
    animation = null;
    testimonialCarousel.scrollLeft = position;
  }
  function measureMethods() {
    const copy = rail.querySelector('[data-testimonial-copy]');
    cycle = copy ? copy.getBoundingClientRect().left - slides[0].getBoundingClientRect().left : 0;
  }
  function syncMethods() {
    clearTimeout(resumeTimer);
    const enabled = inView && !document.hidden && !motion.matches && !touching && !keyboardFocused;
    if (!enabled || performance.now() < resumeAt) {
      freezeMethods();
      if (enabled) resumeTimer = setTimeout(syncMethods, Math.max(0, resumeAt - performance.now()) + 20);
      return;
    }
    if (animation || cycle <= 0) return;
    const position = testimonialCarousel.scrollLeft % cycle;
    testimonialCarousel.scrollLeft = 0;
    animation = rail.animate([
      {transform: 'translate3d(0,0,0)'},
      {transform: `translate3d(-${cycle}px,0,0)`}
    ], {duration: cycle / speed, iterations: Infinity, easing: 'linear'});
    animation.currentTime = position / speed;
  }
  function configureMethods() {
    freezeMethods();
    rail.querySelectorAll('[data-testimonial-copy]').forEach(copy => copy.remove());
    if (!motion.matches) {
      slides.forEach(slide => {
        const copy = slide.cloneNode(true);
        copy.dataset.testimonialCopy = '';
        copy.setAttribute('aria-hidden', 'true');
        copy.style.setProperty('--method-offset', getComputedStyle(slide).getPropertyValue('--method-offset'));
        copy.querySelectorAll('img').forEach(image => image.alt = '');
        rail.append(copy);
      });
    }
    measureMethods();
    syncMethods();
  }
  testimonialCarousel.addEventListener('pointerdown', () => { touching = true; keyboardFocused = false; syncMethods(); }, {passive: true});
  function releaseMethods() {
    if (!touching) return;
    touching = false;
    resumeAt = performance.now() + 700;
    syncMethods();
  }
  addEventListener('pointerup', releaseMethods, {passive: true});
  addEventListener('pointercancel', releaseMethods, {passive: true});
  testimonialCarousel.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) && !event.shiftKey) return;
    resumeAt = performance.now() + 700;
    syncMethods();
  }, {passive: true});
  testimonialCarousel.addEventListener('scroll', () => {
    if (animation || motion.matches) return;
    resumeAt = performance.now() + 700;
    syncMethods();
  }, {passive: true});
  testimonialCarousel.addEventListener('focusin', () => {
    keyboardFocused = testimonialCarousel.matches(':focus-visible');
    syncMethods();
  });
  testimonialCarousel.addEventListener('focusout', event => {
    if (!testimonialCarousel.contains(event.relatedTarget)) { keyboardFocused = false; syncMethods(); }
  });
  testimonialCarousel.addEventListener('keydown', event => {
    if (event.target !== testimonialCarousel || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    keyboardFocused = true;
    syncMethods();
    testimonialCarousel.scrollBy({left: (event.key === 'ArrowRight' ? 1 : -1) * (slides[0].offsetWidth + 20), behavior: motion.matches ? 'instant' : 'smooth'});
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncMethods(); }, {threshold: 0.05}).observe(testimonialCarousel);
  } else inView = true;
  addEventListener('resize', () => { freezeMethods(); measureMethods(); syncMethods(); });
  document.addEventListener('visibilitychange', syncMethods);
  motion.addEventListener('change', configureMethods);
  configureMethods();
}


