// Navigation: mobile menu and section scroll-spy (matching launch.js behaviour)

function initNavigation() {
  const menuButton = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu') as HTMLElement | null;

  const closeMenu = (restoreFocus = false) => {
    if (!menu || !menuButton) return;
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    if (restoreFocus) (menuButton as HTMLElement).focus();
  };

  if (menu && menuButton) {
    menuButton.setAttribute('aria-label', 'Open menu');

    menuButton.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    menu.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeMenu();
    }, { passive: true });
  }

  // Section scroll-spy — highlights active desktop nav link while scrolling
  if ('IntersectionObserver' in window && document.body.classList.contains('launch-page')) {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.desktop-nav a[href^="#"]'));
    const sections = links
      .map(link => document.querySelector<HTMLElement>(link.getAttribute('href') as string))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (!visible.length) return;

      links.forEach(link => {
        const active = link.getAttribute('href') === '#' + visible[0].target.id;
        link.classList.toggle('active', active);
        if (active) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-90px 0px -55% 0px', threshold: 0 });

    sections.forEach(section => observer.observe(section));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}
