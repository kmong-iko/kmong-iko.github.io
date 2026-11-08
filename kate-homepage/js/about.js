// "More about me?" popup: content comes from js/data/about.js.
import { ABOUT } from './data/about.js';
import { openWindow } from './window.js';

const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function initAbout(button, sound) {
  button.removeAttribute('aria-disabled');
  button.removeAttribute('tabindex');
  button.setAttribute('aria-haspopup', 'dialog');

  button.addEventListener('click', () => {
    const content = document.createElement('div');
    content.className = 'about';
    content.innerHTML = `
      <h2 class="about__name">${escapeHtml(ABOUT.name)}</h2>
      <p class="about__tagline">${escapeHtml(ABOUT.tagline)}</p>
      <hr class="about__rule about__rule--accent">
      <p><strong>${escapeHtml(ABOUT.intro.split('!')[0])}!</strong>${escapeHtml(ABOUT.intro.slice(ABOUT.intro.indexOf('!') + 1))}</p>
      <p>${escapeHtml(ABOUT.specialtiesLabel)}</p>
      <ul class="about__list">${ABOUT.specialties.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
      <hr class="about__rule">
      <h3>${escapeHtml(ABOUT.backgroundTitle)}</h3>
      ${ABOUT.background.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}`;
    openWindow({ label: 'More about Kae', className: 'win--about', content, width: 640, height: 520, sound });
  });
}
