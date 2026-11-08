// "View Certificates": an inline panel directly under Development. Names are plain hyperlinks (no popups).
import { CERTIFICATES } from './data/certificates.js';

const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function initCertificates(section, sound) {
  const button = section.querySelector('.certs__toggle');
  const panel = section.querySelector('.certs__panel');
  const list = section.querySelector('.certs__list');

  list.innerHTML = CERTIFICATES.length
    ? CERTIFICATES.map((c) => {
        const name = c.url
          ? `<a class="certs__name" href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.name)}</a>`
          : `<span class="certs__name certs__name--plain">${escapeHtml(c.name)}</span>`;
        const meta = [c.issuer, c.date].filter(Boolean).map(escapeHtml).join(' · ');
        return `<li>${name}${meta ? `<span class="certs__meta">${meta}</span>` : ''}</li>`;
      }).join('')
    : '<li class="certs__empty">Certificates coming soon.</li>';

  const set = (open) => {
    button.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
    sound?.sfx(open ? 'open' : 'close');
  };
  panel.inert = true;
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
}
