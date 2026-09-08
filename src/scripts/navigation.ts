// Navigation: scroll glass effect and mobile menu handling

function initNavigation() {
  const nav = document.getElementById("nav");
  const inner = nav?.querySelector<HTMLElement>("[data-nav-inner]");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let lastState: boolean | null = null;

  function onScroll() {
    if (!nav || !inner) return;
    const s = (window.scrollY || document.documentElement.scrollTop || 0) > 40;
    if (s === lastState) return;
    lastState = s;
    nav.style.background = s ? "rgba(244,240,232,0.82)" : "";
    nav.style.backdropFilter = s ? "saturate(1.4) blur(14px)" : "";
    // @ts-ignore
    nav.style.webkitBackdropFilter = s ? "saturate(1.4) blur(14px)" : "";
    nav.style.boxShadow = s ? "0 1px 20px rgba(29,29,27,0.08)" : "none";
    inner.style.paddingBlock = s ? "10px" : "";
  }

  function scrollToHash(hash: string) {
    const target = hash ? document.querySelector(hash) : null;
    if (!target) return;
    const behaviour: ScrollBehavior = reducedMotion ? "auto" : "smooth";
    target.scrollIntoView({ behavior: behaviour, block: "start" });
  }

  document
    .querySelectorAll<HTMLAnchorElement>('a[href*="#"]')
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") === false) return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        scrollToHash(href);
      });
    });

  if (window.location.hash) {
    requestAnimationFrame(() => scrollToHash(window.location.hash));
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  const iconUse = btn?.querySelector("[data-menu-icon] use");
  const srText = btn?.querySelector(".sr-only");

  function setMenu(open: boolean) {
    if (!menu || !btn) return;
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (srText) srText.textContent = open ? "Close menu" : "Open menu";
    if (iconUse) iconUse.setAttribute("href", open ? "#i-x" : "#i-menu");
  }

  btn?.addEventListener("click", () => {
    if (menu) setMenu(menu.hidden);
  });

  menu?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && !menu.hidden) {
      setMenu(false);
      btn?.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024 && menu && !menu.hidden) {
      setMenu(false);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  initNavigation();
}
