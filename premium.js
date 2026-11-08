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
