// macOS-style popup windows (used by "More about me?" and the project viewer).
//   • orange title bar with a red close button and a green full-screen button (there is NO minimize button)
//   • the window is static (it opens centered and cannot be dragged); resize from any edge or corner,
//     double-click the bar (or press green) to go full-screen and again to restore the previous size/position
//   • Esc or a click on the dimmed backdrop closes the top-most window; focus returns to whatever opened it
//   • works with mouse, touch and pen (pointer events)

const MIN_W = 300, MIN_H = 240;
const MARGIN = 8;                 // keep this much of the window on screen
const ANIMATE_MS = 280;
const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const root = document.documentElement;
const stack = [];                 // open windows, top-most last
let zCounter = 80;

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {{ label: string, className?: string, content: HTMLElement, width?: number, height?: number,
 *           sound?: { sfx: (name: string) => void }, onClose?: () => void }} options
 *   width/height are the preferred size in px (shrunk to fit small screens).
 */
export function openWindow({ label, className = '', content, width = 880, height = 620, sound, onClose }) {
  const opener = document.activeElement;

  const backdrop = Object.assign(document.createElement('div'), { className: 'win-backdrop' });
  const win = Object.assign(document.createElement('div'), { className: `win ${className}`.trim() });
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-modal', 'true');
  win.setAttribute('aria-label', label);
  win.tabIndex = -1;

  win.innerHTML = `
    <div class="win__bar">
      <div class="win__controls">
        <button class="win__btn win__btn--close" type="button" aria-label="Close window"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3.5 3.5 5 5m0-5-5 5"/></svg></button>
        <button class="win__btn win__btn--zoom" type="button" aria-label="Enter full screen" aria-pressed="false"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.4 8.6V5.2m0 3.4h3.4M8.6 3.4v3.4m0-3.4H5.2"/></svg></button>
      </div>
    </div>
    <div class="win__body"></div>
    ${EDGES.map((edge) => `<span class="win__grip win__grip--${edge}" data-edge="${edge}" aria-hidden="true"></span>`).join('')}`;
  win.querySelector('.win__body').append(content);
  backdrop.append(win);
  document.body.append(backdrop);

  const bar = win.querySelector('.win__bar');
  const zoomButton = win.querySelector('.win__btn--zoom');
  let rect = { left: 0, top: 0, width: 0, height: 0 };
  let restoreRect = null;         // set while full-screen
  let closed = false;

  /* ---------- geometry ---------- */
  const apply = () => {
    win.style.left = `${rect.left}px`;
    win.style.top = `${rect.top}px`;
    win.style.width = `${rect.width}px`;
    win.style.height = `${rect.height}px`;
  };
  const viewport = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight });
  const fit = () => { // re-clamp into the viewport (also on rotate / browser resize)
    const { w, h } = viewport();
    rect.width = clamp(rect.width, Math.min(MIN_W, w - 2 * MARGIN), w - 2 * MARGIN);
    rect.height = clamp(rect.height, Math.min(MIN_H, h - 2 * MARGIN), h - 2 * MARGIN);
    rect.left = clamp(rect.left, MARGIN - rect.width + 80, w - 80);   // always leave a grabbable strip
    rect.top = clamp(rect.top, 0, h - 40);
  };
  const initial = () => {
    const { w, h } = viewport();
    const small = w < 640;
    rect.width = Math.min(width, w - (small ? 16 : 48));
    rect.height = Math.min(height, h - (small ? 24 : 72));
    rect.left = Math.round((w - rect.width) / 2);
    rect.top = Math.round(Math.max(8, (h - rect.height) / 2));
  };
  initial();
  apply();

  const animateGeometry = (fn) => { // smooth full-screen / restore
    if (prefersReducedMotion()) return fn();
    win.classList.add('is-animating');
    fn();
    setTimeout(() => win.classList.remove('is-animating'), ANIMATE_MS + 30);
  };

  /* ---------- full-screen ---------- */
  const setFullscreen = (on, { silent = false } = {}) => {
    if (on === Boolean(restoreRect)) return;
    animateGeometry(() => {
      if (on) {
        restoreRect = { ...rect };
        const { w, h } = viewport();
        rect = { left: 0, top: 0, width: w, height: h };
      } else {
        rect = restoreRect;
        restoreRect = null;
        fit();
      }
      win.classList.toggle('is-fullscreen', on);
      apply();
    });
    zoomButton.setAttribute('aria-pressed', String(on));
    zoomButton.setAttribute('aria-label', on ? 'Exit full screen' : 'Enter full screen');
    if (!silent) sound?.sfx(on ? 'maximize' : 'restore');
  };
  zoomButton.addEventListener('click', () => setFullscreen(!restoreRect));
  bar.addEventListener('dblclick', (event) => { if (!event.target.closest('.win__btn')) setFullscreen(!restoreRect); });

  /* ---------- resize (the window itself is static: no dragging) ---------- */
  const startGesture = (event, edge) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (restoreRect) return; // full-screen windows stay put
    event.preventDefault();
    focusWindow();
    const start = { x: event.clientX, y: event.clientY, ...rect };
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    win.classList.add('is-dragging');

    const move = (e) => {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      const { w, h } = viewport();
      // resize: the opposite edge stays anchored
      let { left, top, width: wd, height: ht } = start;
      if (edge.includes('e')) wd = clamp(start.width + dx, MIN_W, w - start.left - MARGIN);
      if (edge.includes('s')) ht = clamp(start.height + dy, MIN_H, h - start.top - MARGIN);
      if (edge.includes('w')) { wd = clamp(start.width - dx, MIN_W, start.left + start.width - MARGIN); left = start.left + start.width - wd; }
      if (edge.includes('n')) { ht = clamp(start.height - dy, MIN_H, start.top + start.height - MARGIN); top = start.top + start.height - ht; }
      rect = { left, top, width: wd, height: ht };
      apply();
    };
    const end = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', end);
      target.removeEventListener('pointercancel', end);
      win.classList.remove('is-dragging');
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
  };
  win.querySelectorAll('.win__grip').forEach((grip) => grip.addEventListener('pointerdown', (event) => startGesture(event, grip.dataset.edge)));

  /* ---------- focus, stacking, closing ---------- */
  const focusWindow = () => { backdrop.style.zIndex = String(++zCounter); };
  const onResize = () => { if (restoreRect) { const { w, h } = viewport(); rect = { left: 0, top: 0, width: w, height: h }; } else fit(); apply(); };
  addEventListener('resize', onResize);

  const trapTab = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...win.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"], input, textarea')].filter((el) => el.offsetParent);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const onKey = (event) => {
    if (stack[stack.length - 1] !== api) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else trapTab(event);
  };
  addEventListener('keydown', onKey);

  const close = () => {
    if (closed) return;
    closed = true;
    removeEventListener('resize', onResize);
    removeEventListener('keydown', onKey);
    stack.splice(stack.indexOf(api), 1);
    if (!stack.length) { root.removeAttribute('data-project-open'); root.classList.remove('has-window'); }
    sound?.sfx('close');
    backdrop.classList.add('is-closing');
    const finish = () => { backdrop.remove(); onClose?.(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
    if (prefersReducedMotion()) finish(); else setTimeout(finish, 200);
  };
  win.querySelector('.win__btn--close').addEventListener('click', close);
  backdrop.addEventListener('pointerdown', (event) => { if (event.target === backdrop) close(); });
  win.addEventListener('pointerdown', () => { if (stack[stack.length - 1] !== api) { stack.splice(stack.indexOf(api), 1); stack.push(api); focusWindow(); } });

  const api = { element: win, body: win.querySelector('.win__body'), close, setFullscreen };
  stack.push(api);
  focusWindow();
  root.dataset.projectOpen = ''; // pauses the Workfolio carousel (see carousel.js)
  root.classList.add('has-window');
  sound?.sfx('open');
  requestAnimationFrame(() => { backdrop.classList.add('is-open'); win.focus({ preventScroll: true }); });
  return api;
}