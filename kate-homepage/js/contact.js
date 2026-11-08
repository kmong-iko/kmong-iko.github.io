// Contact page: validates the form, shows the Cloudflare Turnstile CAPTCHA, and posts to the secure endpoint
// (functions/api/contact.js), which verifies the CAPTCHA and sends the email server-side.
// Nothing secret lives in the browser: only the public Turnstile site key (js/config.js).

import { CONTACT_CONFIG } from './config.js';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const LIMITS = { name: [2, 80], email: [5, 120], message: [10, 2000] };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let scriptPromise = null;
const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement('script'), { src: TURNSTILE_SRC, async: true, defer: true });
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => { scriptPromise = null; reject(new Error('captcha-blocked')); };
    document.head.append(script);
  });
  return scriptPromise;
};

export function initContact(form, { sound, speak } = {}) {
  const status = form.querySelector('.note__status');
  const captchaSlot = form.querySelector('.note__captcha');
  const submit = form.querySelector('.note__send');
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    message: form.elements.message,
  };
  let token = '', widgetId = null, captchaFailed = false;

  const setStatus = (text, kind = '') => { status.textContent = text; status.dataset.kind = kind; };
  const fieldError = (input, text) => {
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
    const hint = form.querySelector(`[data-error-for="${input.name}"]`);
    if (hint) hint.textContent = text;
  };

  const validate = () => {
    let first = null;
    const check = (input, message) => { fieldError(input, message); if (message && !first) first = input; };
    const name = fields.name.value.trim(), email = fields.email.value.trim(), message = fields.message.value.trim();
    check(fields.name, name.length < LIMITS.name[0] ? 'Please tell me your name.' : name.length > LIMITS.name[1] ? 'That name is a bit long.' : '');
    check(fields.email, !EMAIL_PATTERN.test(email) || email.length > LIMITS.email[1] ? 'Please enter a valid email address.' : '');
    check(fields.message, message.length < LIMITS.message[0] ? 'Please write a few more words (10+ characters).' : message.length > LIMITS.message[1] ? 'Please keep it under 2000 characters.' : '');
    first?.focus();
    return !first;
  };
  Object.values(fields).forEach((input) => input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') fieldError(input, ''); }));

  /* ---- CAPTCHA (rendered lazily the first time the Contact page is shown) ---- */
  const renderCaptcha = async () => {
    if (widgetId !== null || !captchaSlot.offsetParent) return;
    try {
      const turnstile = await loadTurnstile();
      captchaFailed = false;
      widgetId = turnstile.render(captchaSlot, {
        sitekey: CONTACT_CONFIG.turnstileSiteKey,
        theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
        size: captchaSlot.clientWidth < 300 ? 'compact' : 'flexible',
        callback: (value) => { token = value; if (status.dataset.kind === 'error') setStatus(''); },
        'expired-callback': () => { token = ''; },
        'error-callback': () => { token = ''; },
      });
    } catch {
      captchaFailed = true;
      setStatus('The CAPTCHA could not load. Please disable any blockers for this page and refresh.', 'error');
    }
  };
  const resetCaptcha = () => { token = ''; if (widgetId !== null) window.turnstile?.reset(widgetId); };

  addEventListener('hashchange', () => { if (location.hash === '#contact') requestAnimationFrame(renderCaptcha); });
  if (location.hash === '#contact') requestAnimationFrame(renderCaptcha);

  /* ---- Submit ---- */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    setStatus('');
    if (!validate()) { sound?.sfx('error'); return; }
    if (!token) {
      setStatus(captchaFailed ? 'The CAPTCHA could not load, so I can’t send this yet.' : 'Please complete the CAPTCHA first.', 'error');
      sound?.sfx('error');
      renderCaptcha();
      return;
    }

    submit.disabled = true;
    form.classList.add('is-sending');
    setStatus('Sending…', 'info');
    try {
      const response = await fetch(CONTACT_CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.value.trim(),
          email: fields.email.value.trim(),
          message: fields.message.value.trim(),
          website: form.elements.website.value, // honeypot: real people leave it empty
          token,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'send-failed');

      form.reset();
      form.classList.add('is-done');
      setStatus('');
      sound?.sfx('success');
      speak?.('Message sent! Thank you, I’ll reply soon.');
    } catch (error) {
      setStatus(
        error instanceof TypeError || error.message === 'send-failed'
          ? 'Sorry, that didn’t go through. Please try again in a moment.'
          : String(error.message),
        'error',
      );
      sound?.sfx('error');
    } finally {
      submit.disabled = false;
      form.classList.remove('is-sending');
      resetCaptcha();
    }
  });

  form.querySelector('.note__again')?.addEventListener('click', () => { form.classList.remove('is-done'); fields.name.focus(); });
}
