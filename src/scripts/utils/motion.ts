export const isStatic = typeof window !== 'undefined' && /[?&]static=1/.test(window.location.search);

export const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return isStatic || (prefersReducedMotion ? prefersReducedMotion.matches : false);
};
