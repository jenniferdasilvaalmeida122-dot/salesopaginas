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

// Depoimentos exclusivamente automáticos, sem arrastar ou controles de avanço.
const testimonialCarousel = document.querySelector('.testimonials-track');
if (testimonialCarousel) {
  const slides = [...testimonialCarousel.querySelectorAll('.testimonial-screenshot')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const rail = document.createElement('div');
  rail.className = 'testimonial-rail';
  slides.forEach(slide => rail.append(slide));
  testimonialCarousel.append(rail);
  let animation = null;
  let inView = !('IntersectionObserver' in window);
  function syncTestimonials() {
    if (!animation) return;
    if (inView && !document.hidden) animation.play();
    else animation.pause();
  }
  function configureTestimonials() {
    const progress = animation ? Number(animation.effect.getComputedTiming().progress || 0) : 0;
    if (animation) animation.cancel();
    animation = null;
    rail.querySelectorAll('[data-testimonial-copy]').forEach(copy => copy.remove());
    if (motion.matches) return;
    slides.forEach(slide => {
      const copy = slide.cloneNode(true);
      copy.dataset.testimonialCopy = '';
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('img').forEach(img => img.alt = '');
      rail.append(copy);
    });
    const cycle = rail.querySelector('[data-testimonial-copy]').offsetLeft - slides[0].offsetLeft;
    if (cycle <= 0) return;
    const duration = cycle / 0.028;
    animation = rail.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(-${cycle}px,0,0)`}], {duration,iterations:Infinity,easing:'linear'});
    animation.currentTime = progress * duration;
    syncTestimonials();
  }
  testimonialCarousel.addEventListener('dragstart', event => event.preventDefault());
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncTestimonials();
  }, {threshold:0.05}).observe(testimonialCarousel);
  addEventListener('resize', configureTestimonials);
  document.addEventListener('visibilitychange', syncTestimonials);
  motion.addEventListener('change', configureTestimonials);
  configureTestimonials();
}
