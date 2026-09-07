import { isStatic, prefersReducedMotion } from './utils/motion';

function initScrollScrub() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scrub]'));
  if (!nodes.length) return;

  function settle() {
    nodes.forEach((el) => {
      el.style.setProperty('--p', el.getAttribute('data-scrub') === 'through' ? '0.5' : '1');
    });
  }

  if (isStatic || (prefersReducedMotion && prefersReducedMotion.matches)) {
    settle();
    return;
  }

  let ticking = false;

  function paint() {
    ticking = false;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const p = el.getAttribute('data-scrub') === 'through'
        ? (vh - r.top) / (vh + r.height)
        : (vh - r.top) / (vh * 0.62);
      el.style.setProperty('--p', (p < 0 ? 0 : p > 1 ? 1 : p).toFixed(4));
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (prefersReducedMotion && prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        window.removeEventListener('scroll', onScroll);
        settle();
      }
    });
  }
  paint();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollScrub);
} else {
  initScrollScrub();
}
