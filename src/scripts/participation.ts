// Client-side registration form logic with client validation, idempotency key generation, and async submission
import countries from '../data/countries.json';

// ─── Country lookup & canonicalization ────────────────────────────────────────

const COUNTRY_MAP = new Map<string, string>();
countries.forEach((c) => {
  COUNTRY_MAP.set(c.toLowerCase(), c);
});

// Common synonyms / abbreviations
const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  uae: 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
  "cote d'ivoire": "Ivory Coast (Côte d'Ivoire)",
  'cote divoire': "Ivory Coast (Côte d'Ivoire)",
  "côte d'ivoire": "Ivory Coast (Côte d'Ivoire)",
  drc: 'Democratic Republic of the Congo',
  'dr congo': 'Democratic Republic of the Congo',
  'congo drc': 'Democratic Republic of the Congo',
  korea: 'South Korea',
  'south korea': 'South Korea',
  russia: 'Russia',
  'russian federation': 'Russia',
  'czech republic': 'Czech Republic (Czechia)',
  czechia: 'Czech Republic (Czechia)',
};

Object.entries(COUNTRY_ALIASES).forEach(([alias, canonical]) => {
  COUNTRY_MAP.set(alias.toLowerCase(), canonical);
});

function getCanonicalCountry(val: string): string | null {
  if (!val || typeof val !== 'string') return null;
  const clean = val.trim().toLowerCase();
  return COUNTRY_MAP.get(clean) || null;
}

// WHATWG standard RFC 5322 compatible email pattern supporting personal & corporate domains
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// ─── Toast helper (CSS-custom-property driven — no keyframe delay) ────────────

type ToastType = 'success' | 'warning' | 'error' | 'failure' | 'info';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number; // ms; 0 = persistent until manually closed
}

const TOAST_ICONS: Record<string, string> = {
  // Mint tint - Success check
  success: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 10.2l2.4 2.4 4.8-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // Gold tint - Warning alert
  warning: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.8l7.5 13.2c.4.7-.1 1.6-.9 1.6H3.4c-.8 0-1.3-.9-.9-1.6L10 2.8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 7.8v4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14.8" r="0.9" fill="currentColor"/></svg>`,
  // Brick tint - Failure error
  error:   `<svg class="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M10 6.2v4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14" r="0.9" fill="currentColor"/></svg>`,
  failure: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M10 6.2v4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14" r="0.9" fill="currentColor"/></svg>`,
  // Info - Information
  info:    `<svg class="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M10 9.2v4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="6.6" r="0.9" fill="currentColor"/></svg>`,
};

function getOrCreateContainer(): HTMLElement {
  let el = document.getElementById('toast-container') as HTMLElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(el);
  }
  return el;
}

export function showToast(type: ToastType, opts: ToastOptions): void {
  const { title, message, duration = 6500 } = opts;
  const container = getOrCreateContainer();

  // Normalize variant key for CSS class and icon
  const normalizedType = type === 'failure' ? 'failure' : type;
  const iconSvg = TOAST_ICONS[normalizedType] || TOAST_ICONS.info;

  // Build the card element
  const toast = document.createElement('div');
  toast.className = `toast toast-${normalizedType}`;
  toast.setAttribute('role', normalizedType === 'error' || normalizedType === 'failure' ? 'alert' : 'status');
  toast.setAttribute('aria-atomic', 'true');

  // Ark UI initial collapsed state
  toast.style.setProperty('--toast-opacity', '0');
  toast.style.setProperty('--toast-y', '14px');
  toast.style.setProperty('--toast-scale', '0.96');
  if (duration > 0) {
    toast.style.setProperty('--toast-duration', `${duration}ms`);
  }

  toast.innerHTML = [
    `<div class="toast-icon-wrap" aria-hidden="true">${iconSvg}</div>`,
    `<div class="toast-body">`,
    `  <p class="toast-title">${title}</p>`,
    message ? `  <p class="toast-message">${message}</p>` : '',
    `</div>`,
    `<button class="toast-close" aria-label="Dismiss notification" type="button">`,
    `  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    `</button>`,
    duration > 0 ? `<div class="toast-progress" aria-hidden="true"></div>` : '',
  ].join('');

  let dismissTimer: ReturnType<typeof setTimeout> | null = null;
  let remaining = duration;
  let startTime = Date.now();

  function dismiss() {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    toast.style.setProperty('--toast-opacity', '0');
    toast.style.setProperty('--toast-y', '14px');
    toast.style.setProperty('--toast-scale', '0.96');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 280);
  }

  function startTimer() {
    if (duration <= 0) return;
    startTime = Date.now();
    dismissTimer = setTimeout(dismiss, remaining);
  }

  function pauseTimer() {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
      remaining -= Date.now() - startTime;
    }
  }

  // Hover pauses auto-dismissal
  if (duration > 0) {
    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', () => {
      if (remaining > 0) startTimer();
    });
    startTimer();
  }

  toast.querySelector('.toast-close')?.addEventListener('click', dismiss);
  container.appendChild(toast);

  // Trigger entering animation on next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.setProperty('--toast-opacity', '1');
      toast.style.setProperty('--toast-y', '0px');
      toast.style.setProperty('--toast-scale', '1');
    });
  });
}

// Expose globally for convenience and developer smoke-testing in console
if (typeof window !== 'undefined') {
  (window as unknown as { aiHubToast: typeof showToast }).aiHubToast = showToast;
}

// ─── Country Combobox Controller ─────────────────────────────────────────────

function initCountryCombobox(
  input: HTMLInputElement,
  dropdown: HTMLElement,
  toggleBtn: HTMLButtonElement | null
) {
  let focusedIndex = -1;
  const options = Array.from(dropdown.querySelectorAll<HTMLLIElement>('.country-option'));

  function openDropdown() {
    dropdown.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    dropdown.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    focusedIndex = -1;
    options.forEach((opt) => opt.classList.remove('is-focused'));
  }

  function filterOptions(query: string) {
    const q = query.trim().toLowerCase();
    let visibleCount = 0;
    options.forEach((opt) => {
      const val = (opt.dataset.value || opt.textContent || '').toLowerCase();
      const match = !q || val.includes(q);
      opt.hidden = !match;
      if (match) visibleCount++;
    });

    let noResults = dropdown.querySelector('.country-no-results') as HTMLElement | null;
    if (visibleCount === 0) {
      if (!noResults) {
        noResults = document.createElement('li');
        noResults.className = 'country-no-results';
        noResults.textContent = 'No matching countries found';
        dropdown.appendChild(noResults);
      }
      noResults.hidden = false;
    } else if (noResults) {
      noResults.hidden = true;
    }
  }

  function selectOption(countryName: string) {
    input.value = countryName;
    input.setCustomValidity('');
    options.forEach((opt) => {
      const isMatch = opt.dataset.value === countryName;
      opt.classList.toggle('is-selected', isMatch);
      opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    closeDropdown();
    input.focus();
  }

  input.addEventListener('focus', () => {
    filterOptions(input.value);
    openDropdown();
  });

  input.addEventListener('input', () => {
    input.setCustomValidity('');
    filterOptions(input.value);
    openDropdown();
  });

  input.addEventListener('blur', () => {
    // Slight delay to allow option click to register
    setTimeout(() => {
      const val = input.value.trim();
      if (val) {
        const canonical = getCanonicalCountry(val);
        if (canonical) {
          input.value = canonical;
          input.setCustomValidity('');
        } else {
          input.setCustomValidity('Please select a valid country from the list.');
        }
      }
      closeDropdown();
    }, 180);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.hidden) {
        filterOptions('');
        openDropdown();
        input.focus();
      } else {
        closeDropdown();
      }
    });
  }

  dropdown.addEventListener('mousedown', (e) => {
    // Prevent input blur before click registers
    e.preventDefault();
  });

  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.value || opt.textContent || '';
      if (val) selectOption(val);
    });
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const visibleOpts = options.filter((o) => !o.hidden);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (dropdown.hidden) openDropdown();
      if (visibleOpts.length > 0) {
        focusedIndex = (focusedIndex + 1) % visibleOpts.length;
        visibleOpts.forEach((o, i) => o.classList.toggle('is-focused', i === focusedIndex));
        visibleOpts[focusedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (dropdown.hidden) openDropdown();
      if (visibleOpts.length > 0) {
        focusedIndex = (focusedIndex - 1 + visibleOpts.length) % visibleOpts.length;
        visibleOpts.forEach((o, i) => o.classList.toggle('is-focused', i === focusedIndex));
        visibleOpts[focusedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      if (!dropdown.hidden && focusedIndex >= 0 && visibleOpts[focusedIndex]) {
        e.preventDefault();
        selectOption(visibleOpts[focusedIndex].dataset.value || '');
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.closest('.country-combobox')?.contains(e.target as Node)) {
      closeDropdown();
    }
  });
}

// ─── Form logic ──────────────────────────────────────────────────────────────

export function initParticipation() {
  const form = document.getElementById('register-form') as HTMLFormElement | null;
  if (!form) return;

  const interests = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="interest"]'));
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const registrationStatus = document.getElementById('registration-status');
  const registrationSuccess = document.getElementById('registration-success');
  const nameInput = document.getElementById('f-name') as HTMLInputElement | null;
  const emailInput = document.getElementById('f-email') as HTMLInputElement | null;
  const orgInput = document.getElementById('f-org') as HTMLInputElement | null;
  const countryInput = document.getElementById('f-country') as HTMLInputElement | null;
  const countryDropdown = document.getElementById('country-dropdown-list') as HTMLElement | null;
  const countryToggleBtn = form.querySelector<HTMLButtonElement>('.country-combobox-toggle');

  let idempotencyKey: string | null = null;

  // Initialize searchable country dropdown
  if (countryInput && countryDropdown) {
    initCountryCombobox(countryInput, countryDropdown, countryToggleBtn);
  }

  // Clear customValidity immediately when the user types in ANY input/textarea
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((el) => {
    el.addEventListener('input', () => {
      el.setCustomValidity('');
      if (submitButton && !submitButton.disabled) {
        idempotencyKey = null;
      }
    });
  });

  // Sanitize email on blur (trim whitespace and normalize lowercase)
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      emailInput.value = emailInput.value.trim().toLowerCase();
    });
  }

  function newIdempotencyKey(): string {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'registration-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  // Inline status text
  function setStatus(message: string) {
    if (registrationStatus) {
      registrationStatus.textContent = message;
    }
  }

  // Preselect interests from query params (?interest=...)
  const query = new URLSearchParams(window.location.search);
  query.getAll('interest').forEach((value) => {
    interests.forEach((input) => {
      if (input.value === value) input.checked = true;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // 1. Sanitize all field values before validation
    if (nameInput) nameInput.value = nameInput.value.trim();
    if (emailInput) emailInput.value = emailInput.value.trim().toLowerCase();
    if (orgInput) orgInput.value = orgInput.value.trim();
    if (countryInput) countryInput.value = countryInput.value.trim();

    // 2. Validate fields client-side
    if (nameInput) {
      nameInput.setCustomValidity(nameInput.value ? '' : 'Enter your name.');
    }

    if (emailInput) {
      const em = emailInput.value;
      if (!em) {
        emailInput.setCustomValidity('Enter your email address.');
      } else if (!EMAIL_REGEX.test(em)) {
        emailInput.setCustomValidity('Enter a valid email address (e.g. name@organisation.com).');
      } else {
        emailInput.setCustomValidity('');
      }
    }

    if (orgInput) {
      orgInput.setCustomValidity(orgInput.value ? '' : 'Enter your organisation.');
    }

    if (countryInput) {
      const cVal = countryInput.value;
      if (!cVal) {
        countryInput.setCustomValidity('Select your country.');
      } else {
        const canonical = getCanonicalCountry(cVal);
        if (canonical) {
          countryInput.value = canonical;
          countryInput.setCustomValidity('');
        } else {
          countryInput.setCustomValidity('Please select a valid country from the list.');
        }
      }
    }

    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      organisation: String(data.get('organisation') || '').trim(),
      country: String(data.get('country') || '').trim(),
      interest: data.getAll('interest'),
      context: String(data.get('context') || '').trim(),
    };

    if (!idempotencyKey) {
      idempotencyKey = newIdempotencyKey();
    }

    // Visual loading state on button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('data-loading', '');
      submitButton.textContent = 'Submitting…';
    }
    setStatus('Submitting your registration…');
    if (registrationSuccess) registrationSuccess.hidden = true;

    try {
      const endpoint = form.dataset.endpoint || '/api/registrations';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 422 && result.fields) {
          // Field-level validation errors — highlight the specific inputs
          Object.keys(result.fields).forEach((name) => {
            const input = form.elements.namedItem(name) as HTMLInputElement | null;
            if (input && input.setCustomValidity) {
              input.setCustomValidity(result.fields[name]);
            }
          });
          form.reportValidity();
          const fieldCount = Object.keys(result.fields).length;
          setStatus('Please check the highlighted details and try again.');
          showToast('warning', {
            title: 'Please check your details',
            message: `${fieldCount} field${fieldCount > 1 ? 's need' : ' needs'} attention before we can complete your registration.`,
            duration: 7000,
          });
        } else {
          const msg = 'We could not submit your registration. Your details are still here — please try again.';
          setStatus(msg);
          showToast('failure', {
            title: 'Submission failed',
            message: msg,
            duration: 8000,
          });
        }
        return;
      }

      // ── Success (201 Created or 200 duplicate) ──
      const isDuplicate: boolean = !!result.duplicate;

      const successTitle = isDuplicate ? 'Already registered' : 'Registration confirmed';
      const successMsg = isDuplicate
        ? 'We already have your details on file. Our team will be in touch soon.'
        : 'Your place request has been received. Our team will reply within five working days.';

      // Inline success block
      if (registrationSuccess) {
        registrationSuccess.hidden = false;
        registrationSuccess.textContent = successMsg;
        registrationSuccess.focus();
      }
      setStatus('Registration received.');

      // Toast (clean, warm, without unnecessary technical reference IDs)
      showToast('success', {
        title: successTitle,
        message: successMsg,
        duration: 8000,
      });

      // Reset form so the inputs are refreshed and not locked with old data
      form.reset();
      idempotencyKey = null;

      // Temporary success state on button, then restore ready state
      if (submitButton) {
        submitButton.removeAttribute('data-loading');
        submitButton.setAttribute('data-success', '');
        submitButton.textContent = 'Registered ✓';
        setTimeout(() => {
          submitButton.removeAttribute('data-success');
          submitButton.textContent = 'Register for free';
          submitButton.disabled = false;
        }, 4500);
      }
    } catch (_) {
      const msg = 'We could not reach the registration service. Your details are still here — please try again.';
      setStatus(msg);
      showToast('failure', {
        title: 'Connection problem',
        message: msg,
        duration: 8000,
      });
    } finally {
      // If submission did not complete, restore button
      if (submitButton && submitButton.hasAttribute('data-loading')) {
        submitButton.removeAttribute('data-loading');
        submitButton.textContent = 'Register for free';
        submitButton.disabled = false;
      }
    }
  });

  // Open privacy disclosure accordion on #privacy link click
  document.querySelectorAll('a[href="#privacy"]').forEach((link) => {
    link.addEventListener('click', () => {
      const privacy = document.getElementById('privacy') as HTMLDetailsElement | null;
      if (privacy) privacy.open = true;
    });
  });

  if (window.location.hash === '#privacy') {
    const privacy = document.getElementById('privacy') as HTMLDetailsElement | null;
    if (privacy) privacy.open = true;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticipation);
  } else {
    initParticipation();
  }
}
