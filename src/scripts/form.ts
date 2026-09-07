// Registration form handler with mailto client and interest param pre-selection

function initForm() {
  // Pre-select interest from URL param client-side (supplements server-side preselection)
  try {
    const params = new URLSearchParams(window.location.search);
    const interest = params.get('interest');
    if (interest) {
      const checkbox = document.querySelector<HTMLInputElement>(
        `input[name="interest"][value="${CSS.escape(interest)}"]`
      );
      if (checkbox) {
        checkbox.checked = true;
      }
    }
  } catch (err) {
    // Ignore URL parsing errors
  }

  const form = document.getElementById('register-form') as HTMLFormElement | null;
  const note = document.getElementById('form-note');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const d = new FormData(form);
    const interests = d.getAll('interest') as string[];
    const body = [
      'Name: ' + (d.get('name') || ''),
      'Organisation: ' + (d.get('organisation') || ''),
      'Email: ' + (d.get('email') || ''),
      'Country: ' + (d.get('country') || ''),
      '',
      'Interested in:',
      interests.length
        ? interests.map((i) => '  - ' + i).join('\n')
        : '  (nothing ticked)',
      '',
      d.get('context') || '',
    ].join('\n');

    if (note) {
      note.hidden = false;
      note.textContent =
        'Opening your email app with these details. If nothing happens, send them to b.janischowsky@4th-ir.com.';
    }

    window.location.href =
      'mailto:b.janischowsky@4th-ir.com' +
      '?subject=' +
      encodeURIComponent('Register interest — AI Hub, Ghana') +
      '&body=' +
      encodeURIComponent(body);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForm);
} else {
  initForm();
}
