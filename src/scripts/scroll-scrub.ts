// Scroll-linked animation driver (mirrors launch.js scroll scrub logic)

function initScrollScrub() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scrub]'));
  if (!nodes.length) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const staticView = new URLSearchParams(location.search).get('static') === '1';

  let frame = 0;

  function paint() {
    frame = 0;
    const still = preference.matches || staticView;
    const height = innerHeight;

    nodes.forEach(node => {
      // Measure the stable frame, not the transformed image element
      const rect = (node.classList.contains('drift') ? node.parentElement! : node).getBoundingClientRect();
      const through = node.dataset.scrub === 'through';

      const rawProgress = still
        ? (through ? 0.5 : 1)
        : through
          ? (height - rect.top) / (height + rect.height)
          : (height - rect.top) / (height * 0.62);

      const progress = Math.max(0, Math.min(1, rawProgress)).toFixed(4);
      node.style.setProperty('--p', progress);
      node.classList.toggle('motion-ready', !still);
    });
  }

  function schedule() {
    if (!frame && !preference.matches && !staticView) {
      frame = requestAnimationFrame(paint);
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  preference.addEventListener('change', paint);
  paint();
}

// Reveal the computer-vision illustration once, when it scrolls into view
function initResearchVisual() {
  const visual = document.querySelector<HTMLElement>('.research-visual');
  if (!visual) return;
  if (new URLSearchParams(location.search).get('static') === '1') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      visual.classList.add('is-in-view');
      observer.disconnect();
    }
  }, { threshold: 0.3 });

  observer.observe(visual);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initScrollScrub();
    initResearchVisual();
  });
} else {
  initScrollScrub();
  initResearchVisual();
}
