import { isStatic, shouldReduceMotion } from './utils/motion';

function initAnimations() {
  if (isStatic) {
    document.documentElement.classList.remove('js');
  }

  const reduce = shouldReduceMotion();

  function countUp(el: HTMLElement) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const end = parseInt(el.dataset.count || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (reduce || isNaN(end)) {
      el.textContent = end + suffix;
      return;
    }
    const dur = 1100;
    let t0: number | null = null;
    function step(t: number) {
      if (t0 === null) t0 = t;
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal, .reveal-img, .pat-sweep, .slab'));

  function show(el: HTMLElement) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    const p = el.parentElement;
    if (p) p.classList.add('is-in');
    el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
    if (el.hasAttribute('data-count')) countUp(el);
  }

  if (!('IntersectionObserver' in window)) {
    targets.forEach(show);
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        show(en.target as HTMLElement);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

    targets.forEach((el) => io.observe(el));

    const vh = window.innerHeight || 800;
    let i = 0;
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.94) {
        setTimeout(() => {
          show(el);
          io.unobserve(el);
        }, i++ * 45);
      }
    });

    setTimeout(() => {
      targets.forEach(show);
    }, 2500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  initAnimations();
}
