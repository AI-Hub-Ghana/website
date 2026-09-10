// Client-side registration form logic with client validation, idempotency key generation, and async submission
export function initParticipation() {
  const form = document.getElementById('register-form') as HTMLFormElement | null;
  if (!form) return;

  const interests = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="interest"]'));
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const registrationStatus = document.getElementById('registration-status');
  const registrationSuccess = document.getElementById('registration-success');
  let idempotencyKey: string | null = null;

  const requiredTextFields = [
    { input: document.getElementById('f-name') as HTMLInputElement | null, message: 'Enter your name.' },
    { input: document.getElementById('f-org') as HTMLInputElement | null, message: 'Enter your organisation.' },
    { input: document.getElementById('f-country') as HTMLInputElement | null, message: 'Enter your country.' },
  ];

  requiredTextFields.forEach(({ input }) => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.setCustomValidity('');
    });
  });

  function newIdempotencyKey(): string {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'registration-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  function setStatus(message: string) {
    if (registrationStatus) {
      registrationStatus.textContent = message;
    }
  }

  form.addEventListener('input', () => {
    if (submitButton && !submitButton.disabled) {
      idempotencyKey = null;
    }
  });

  // Preselect interests from query params (?interest=...)
  const query = new URLSearchParams(window.location.search);
  query.getAll('interest').forEach((value) => {
    interests.forEach((input) => {
      if (input.value === value) input.checked = true;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Check whitespace-only values
    requiredTextFields.forEach(({ input, message }) => {
      if (!input) return;
      input.setCustomValidity(input.value.trim() ? '' : message);
    });

    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      organisation: String(data.get('organisation') || '').trim(),
      country: String(data.get('country') || '').trim(),
      interest: data.getAll('interest'),
      context: String(data.get('context') || '').trim(),
    };

    if (!idempotencyKey) {
      idempotencyKey = newIdempotencyKey();
    }

    if (submitButton) submitButton.disabled = true;
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
          Object.keys(result.fields).forEach((name) => {
            const input = form.elements.namedItem(name) as HTMLInputElement | null;
            if (input && input.setCustomValidity) {
              input.setCustomValidity(result.fields[name]);
            }
          });
          form.reportValidity();
          setStatus('Please check the highlighted details and try again.');
        } else {
          setStatus('We could not submit your registration. Your details are still here. Please try again.');
        }
        return;
      }

      if (registrationSuccess) {
        registrationSuccess.hidden = false;
        registrationSuccess.textContent =
          'Your place request has been received. Reference: ' +
          result.registrationId +
          '. The team will reply within five working days.';
        registrationSuccess.focus();
      }
      setStatus('Registration received.');
    } catch (_) {
      setStatus('We could not reach the registration service. Your details are still here. Please try again.');
    } finally {
      if (submitButton) submitButton.disabled = false;
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
