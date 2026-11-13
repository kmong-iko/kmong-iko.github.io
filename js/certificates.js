// "View Certificates": an inline panel directly under Development. Each credential is a minimal row/card whose title is a
// plain hyperlink (no popups). Optional `type: 'award'` (or category: 'award') in js/data/certificates.js lists an entry under
// "Awards"; everything else is a "Certification". Group headings only appear when both kinds are present.
import { CERTIFICATES } from './data/certificates.js';

const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const EXTERNAL_ICON = '<svg class="icon certs__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
const GROUPS = [
  { key: 'certification', label: 'Certifications' },
  { key: 'award', label: 'Awards' },
];
const groupOf = (c) => (/award|honou?r/i.test(String(c.type ?? c.category ?? '')) ? 'award' : 'certification');

const itemHtml = (c) => {
  const meta = [c.issuer, c.date].filter(Boolean).map((part) => `<span>${escapeHtml(part)}</span>`).join('');
  const body = `${meta ? `<span class="certs__meta">${meta}</span>` : ''}`;
  return c.url
    ? `<li class="certs__item certs__item--link"><a class="certs__name" href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.name)}&#8288;${EXTERNAL_ICON}<span class="visually-hidden"> (opens in a new tab)</span></a>${body}</li>`
    : `<li class="certs__item"><span class="certs__name certs__name--plain">${escapeHtml(c.name)}</span>${body}</li>`;
};

export function initCertificates(section, sound) {
  const button = section.querySelector('.certs__toggle');
  const panel = section.querySelector('.certs__panel');
  const list = section.querySelector('.certs__list');

  const groups = GROUPS.map((g) => ({ ...g, items: CERTIFICATES.filter((c) => groupOf(c) === g.key) })).filter((g) => g.items.length);
  list.innerHTML = groups.length
    ? groups.map((g) => `
        <li class="certs__group">
          ${groups.length > 1 ? `<h3 class="certs__group-title">${g.label}</h3>` : ''}
          <ul class="certs__items">${g.items.map(itemHtml).join('')}</ul>
        </li>`).join('')
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