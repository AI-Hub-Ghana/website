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

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(show);
    return;
  }

  const vh = window.innerHeight || document.documentElement.clientHeight || 800;

  // 1. Immediately reveal all elements in or near the viewport so they never blink or hide
  const belowFoldTargets: HTMLElement[] = [];
  targets.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.95) {
      show(el);
    } else {
      belowFoldTargets.push(el);
    }
  });

  // 2. Set up observer only for elements entering from below the fold
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      show(en.target as HTMLElement);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

  belowFoldTargets.forEach((el) => io.observe(el));

  // 3. Mark reveal system ready now that above-the-fold elements are marked is-in
  document.documentElement.classList.add('reveal-ready');

  // 4. Safety watchdog
  setTimeout(() => {
    targets.forEach(show);
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  initAnimations();
}
