// Development projects: builds the carousel cards from js/data/projects.js, the hover sneak-peek, and the project popup
// (fixed media viewer on top, a fixed title/tags header, then the details scrolling underneath).

import { PROJECTS, CATEGORY_COLORS, FALLBACK_COLORS } from './data/projects.js';
import { openWindow } from './window.js';

const FADE_MS = 350;        // gallery cross-fade
const VIDEO_TIMEOUT_MS = 12000; // show the "couldn't load" message if a Drive video hasn't loaded by then
const PEEK_CYCLE_MS = 1400; // hover preview cycles through the project's images

const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const paragraphs = (text) => String(text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

const CODE_ICON = '<svg class="icon" viewBox="0 0 24 24"><path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/></svg>';

const IMAGE_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10.5" r="1.5"/><path d="m4 17 5-4.5 3.5 3L16 12l4 4.5"/></svg>';
const VIDEO_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5z"/></svg>';

/* Turns a shareable Google Drive link into the embeddable /preview URL (or null if it isn't a usable Drive file link).
   Accepts: .../file/d/<id>/view?usp=sharing, .../file/u/0/d/<id>/..., .../open?id=<id>, .../uc?id=<id>&export=download, .../file/d/<id>/preview */
export function driveEmbedUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  let url;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== 'https:' || !/^(www\.)?(drive|docs)\.google\.com$/i.test(url.hostname)) return null;
  const id = url.pathname.match(/\/file\/(?:u\/\d+\/)?d\/([\w-]{10,})/)?.[1] ?? url.searchParams.get('id');
  return id && /^[\w-]{10,}$/.test(id) ? `https://drive.google.com/file/d/${id}/preview` : null;
}

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
  const videoSrc = driveEmbedUrl(project.videoUrl); // null (no Video button at all) when missing or not a valid Drive link
  if (project.videoUrl && !videoSrc) console.warn(`[projects] "${project.id}": videoUrl is not a valid Google Drive file link, so the Video button is hidden.`);
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
      ${videoSrc ? '<div class="proj__video" hidden></div>' : ''}
    </div>
    <header class="proj__header">
      <div class="proj__headline">
        <h2 class="proj__title">${escapeHtml(project.title)}</h2>
        ${videoSrc ? `
        <div class="proj__media-toggle" role="group" aria-label="Project media">
          <button type="button" class="proj__toggle-btn is-current" data-media="image" aria-pressed="true">${IMAGE_ICON}Image</button>
          <button type="button" class="proj__toggle-btn" data-media="video" aria-pressed="false">${VIDEO_ICON}Video</button>
        </div>` : ''}
      </div>
      <ul class="proj__tags">${tags}</ul>
    </header>
    <div class="proj__info" tabindex="0">
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
    gallery.addEventListener('keydown', (e) => { if (gallery.classList.contains('is-video')) return; if (e.key === 'ArrowLeft') show(index - 1); if (e.key === 'ArrowRight') show(index + 1); });
    gallery.addEventListener('pointerdown', (e) => { if (!e.target.closest('button') && !gallery.classList.contains('is-video')) startX = e.clientX; });
    gallery.addEventListener('pointerup', (e) => { if (startX !== null && Math.abs(e.clientX - startX) > 40) show(index + (e.clientX < startX ? 1 : -1)); startX = null; });
  }

  /* Image / Video toggle (only built when the project has a valid Drive link). The gallery's state is never touched, so
     switching back to Image shows the same slide; the video iframe is removed on leaving Video so it stops playing. */
  if (videoSrc) {
    const gallery = wrap.querySelector('.proj__gallery');
    const stage = wrap.querySelector('.proj__video');
    const buttons = [...wrap.querySelectorAll('.proj__toggle-btn')];
    const driveViewUrl = videoSrc.replace(/\/preview$/, '/view');
    let loadTimer = 0, guarded = false;

    const showError = () => {
      clearTimeout(loadTimer);
      stage.classList.remove('is-loaded');
      stage.innerHTML = `
        <div class="proj__video-status proj__video-status--error" role="alert">
          <p><strong>This video couldn&rsquo;t be loaded.</strong></p>
          <p>It may be private, removed, or you may be offline.</p>
          <div class="proj__links">
            <button class="proj__link" type="button" data-retry>Try again</button>
            ${linkHtml('Open in Drive', driveViewUrl)}
          </div>
        </div>`;
      stage.querySelector('[data-retry]').addEventListener('click', mountVideo);
    };

    function mountVideo() {
      clearTimeout(loadTimer);
      stage.classList.remove('is-loaded');
      stage.innerHTML = '<div class="proj__video-status" role="status"><span class="proj__spinner" aria-hidden="true"></span>Loading video&hellip;</div>';
      if (navigator.onLine === false) return showError();
      const frame = document.createElement('iframe');
      frame.className = 'proj__video-frame';
      frame.title = `${project.title} video`;
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.addEventListener('load', () => { clearTimeout(loadTimer); stage.classList.add('is-loaded'); stage.querySelector('.proj__video-status')?.remove(); });
      frame.src = videoSrc;
      stage.append(frame);
      loadTimer = setTimeout(showError, VIDEO_TIMEOUT_MS);
    }

    /* A cross-origin iframe swallows pointer events, which would break dragging/resizing the window over it:
       while the pointer is down anywhere in the window, let events pass through the iframe. */
    const guardWindowPointer = () => {
      const win = wrap.closest('.win');
      if (guarded || !win) return;
      guarded = true;
      win.addEventListener('pointerdown', () => {
        const frame = stage.querySelector('iframe');
        if (!frame) return;
        frame.style.pointerEvents = 'none';
        const restore = () => { frame.style.pointerEvents = ''; };
        addEventListener('pointerup', restore, { once: true });
        addEventListener('pointercancel', restore, { once: true });
      }, true);
    };

    const setMedia = (mode) => {
      const video = mode === 'video';
      if (video === gallery.classList.contains('is-video')) return;
      gallery.classList.toggle('is-video', video);
      buttons.forEach((b) => { const on = b.dataset.media === mode; b.classList.toggle('is-current', on); b.setAttribute('aria-pressed', String(on)); });
      if (video) { stage.hidden = false; guardWindowPointer(); mountVideo(); }
      else { clearTimeout(loadTimer); stage.replaceChildren(); stage.hidden = true; }
      wrap.dispatchEvent(new CustomEvent('gallery-change', { bubbles: true }));
    };
    buttons.forEach((b) => b.addEventListener('click', () => setMedia(b.dataset.media)));
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