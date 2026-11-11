// Development projects: builds the carousel cards from js/data/projects.js, the hover sneak-peek, and the project popup
// (fixed image gallery on top, details scrolling underneath).

import { PROJECTS, CATEGORY_COLORS, FALLBACK_COLORS } from './data/projects.js';
import { openWindow } from './window.js';

const FADE_MS = 350;        // gallery cross-fade
const PEEK_CYCLE_MS = 1400; // hover preview cycles through the project's images

const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const paragraphs = (text) => String(text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

const CODE_ICON = '<svg class="icon" viewBox="0 0 24 24"><path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/></svg>';

export const categoryColor = (name, index = 0) => CATEGORY_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];

/* ------------------------------------------------------------------ cards */
const cardHtml = (project) => {
  const cover = project.images?.[0];
  const thumb = cover
    ? `<div class="card__thumb card__thumb--photo" aria-hidden="true">${project.images.slice(0, 4).map((img, i) =>
        `<img src="${escapeHtml(img.src)}" alt="" loading="lazy" draggable="false"${i ? '' : ' class="is-current"'}>`).join('')}</div>`
    : `<div class="card__thumb card__thumb--${escapeHtml(project.accent || 'sun')}" aria-hidden="true">${CODE_ICON}</div>`;
  const tags = (project.categories ?? []).map((t) => `<li>${escapeHtml(t)}</li>`).join('');
  const techs = (project.technologies ?? []).slice(0, 4).map((t) => `<li>${escapeHtml(t)}</li>`).join('');
  return `
    <li class="carousel__item">
      <article class="card" role="button" tabindex="0" aria-haspopup="dialog" data-project-id="${escapeHtml(project.id)}"
               aria-label="${escapeHtml(project.title)}: open project details">
        ${thumb}
        <div class="card__caption">
          <h3 class="card__title">${escapeHtml(project.title)}</h3>
          <ul class="card__tags">${tags}</ul>
          <p class="card__text">${escapeHtml(project.summary)}</p>
          <div class="card__peek" aria-hidden="true">
            <p>${escapeHtml(project.peek || project.summary)}</p>
            ${techs ? `<ul class="card__techs">${techs}</ul>` : ''}
            <span class="card__cta">View project <svg class="icon" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5"/></svg></span>
          </div>
        </div>
      </article>
    </li>`;
};

export function renderProjectCards(track) {
  track.innerHTML = PROJECTS.map(cardHtml).join('');
}

/* ------------------------------------------------------------------ hover sneak peek (image cycling) */
function initPeek(root) {
  let timer = 0, current = null;
  const stop = () => {
    clearInterval(timer);
    if (current) {
      const imgs = [...current.querySelectorAll('.card__thumb--photo img')];
      imgs.forEach((img, i) => img.classList.toggle('is-current', i === 0));
    }
    current = null;
  };
  const start = (card) => {
    stop();
    const imgs = [...card.querySelectorAll('.card__thumb--photo img')];
    if (imgs.length < 2 || prefersReducedMotion()) return;
    current = card;
    let index = 0;
    timer = setInterval(() => {
      imgs[index].classList.remove('is-current');
      index = (index + 1) % imgs.length;
      imgs[index].classList.add('is-current');
    }, PEEK_CYCLE_MS);
  };
  root.addEventListener('pointerover', (event) => { if (event.pointerType === 'touch') return; const card = event.target.closest('.card'); if (card && card !== current) start(card); });
  root.addEventListener('pointerout', (event) => { const card = event.target.closest('.card'); if (card && !card.contains(event.relatedTarget)) stop(); });
  root.addEventListener('focusin', (event) => { const card = event.target.closest('.card'); if (card) start(card); });
  root.addEventListener('focusout', stop);
}

/* ------------------------------------------------------------------ popup */
const linkHtml = (label, url) => url
  ? `<a class="proj__link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>`
  : '';

function buildProjectContent(project) {
  const wrap = document.createElement('div');
  wrap.className = 'proj';
  const images = project.images ?? [];
  const tags = [
    project.year ? `<li class="tag tag--year">${escapeHtml(project.year)}</li>` : '',
    ...(project.categories ?? []).map((c, i) => `<li class="tag" style="--tag:${categoryColor(c, i)}">${escapeHtml(c)}</li>`),
  ].join('');
  const list = (items) => (items?.length ? `<ul class="proj__list">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '');
  const links = [linkHtml('Live Demo', project.links?.liveDemo), linkHtml('GitHub', project.links?.github), linkHtml('Figma', project.links?.figma), linkHtml('Case Study', project.links?.caseStudy)].filter(Boolean);

  wrap.innerHTML = `
    <div class="proj__gallery" role="group" aria-roledescription="carousel" aria-label="${escapeHtml(project.title)} images">
      ${images.length
        ? `<div class="proj__frames">${images.map((img, i) => `<img class="proj__frame${i ? '' : ' is-current'}" src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || `${project.title} screenshot ${i + 1}`)}" draggable="false">`).join('')}</div>`
        : '<div class="proj__placeholder" role="img" aria-label="Project image placeholder"><span>Image coming soon</span></div>'}
      ${images.length > 1 ? `
        <button class="proj__nav proj__nav--prev" type="button" aria-label="Previous image"><svg class="icon" viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg></button>
        <button class="proj__nav proj__nav--next" type="button" aria-label="Next image"><svg class="icon" viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg></button>
        <div class="proj__dots">${images.map((_, i) => `<button type="button" class="proj__dot${i ? '' : ' is-current'}" aria-label="Show image ${i + 1}"></button>`).join('')}</div>` : ''}
    </div>
    <div class="proj__info" tabindex="0">
      <h2 class="proj__title">${escapeHtml(project.title)}</h2>
      <ul class="proj__tags">${tags}</ul>
      ${project.overview ? `<section><h3>Overview</h3>${paragraphs(project.overview).map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</section>` : ''}
      ${project.contributions?.length ? `<section><h3>My Contributions</h3>${list(project.contributions)}</section>` : ''}
      ${project.technologies?.length ? `<section><h3>Tools &amp; Technologies</h3><ul class="proj__chips">${project.technologies.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul></section>` : ''}
      ${links.length ? `<section><h3>Project Links</h3><div class="proj__links">${links.join('')}</div></section>` : ''}
    </div>`;

  /* Gallery: stacked images that cross-fade (opacity only, so switching never jumps). */
  if (images.length > 1) {
    const frames = [...wrap.querySelectorAll('.proj__frame')];
    const dots = [...wrap.querySelectorAll('.proj__dot')];
    let index = 0, startX = null;
    const show = (next, announce = true) => {
      next = (next + frames.length) % frames.length;
      if (next === index) return;
      frames[index].classList.remove('is-current');
      dots[index].classList.remove('is-current');
      frames[next].classList.add('is-current');
      dots[next].classList.add('is-current');
      index = next;
      if (announce) wrap.dispatchEvent(new CustomEvent('gallery-change', { bubbles: true }));
    };
    wrap.querySelector('.proj__nav--prev').addEventListener('click', () => show(index - 1));
    wrap.querySelector('.proj__nav--next').addEventListener('click', () => show(index + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
    const gallery = wrap.querySelector('.proj__gallery');
    gallery.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(index - 1); if (e.key === 'ArrowRight') show(index + 1); });
    gallery.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) startX = e.clientX; });
    gallery.addEventListener('pointerup', (e) => { if (startX !== null && Math.abs(e.clientX - startX) > 40) show(index + (e.clientX < startX ? 1 : -1)); startX = null; });
  }
  return wrap;
}

export function openProject(id, sound) {
  const project = PROJECTS.find((p) => p.id === id);
  if (!project) return null;
  const content = buildProjectContent(project);
  content.addEventListener('gallery-change', () => sound?.sfx('slide'));
  return openWindow({ label: `${project.title} project details`, className: 'win--project', content, width: 920, height: 660, sound });
}

export function initProjects(carouselRoot, sound) {
  const open = (card) => openProject(card.dataset.projectId, sound);
  carouselRoot.addEventListener('click', (event) => { const card = event.target.closest('.card'); if (card) open(card); });
  carouselRoot.addEventListener('keydown', (event) => {
    const card = event.target.closest('.card');
    if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); open(card); }
  });
  initPeek(carouselRoot);
}