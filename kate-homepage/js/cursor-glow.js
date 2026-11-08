// Cursor highlight: one soft yellow-orange glow that follows the pointer with a slight delay and a smooth,
// flowy ease (it glides toward the pointer instead of snapping to it). Hidden whenever the pointer leaves the page
// (and on touch devices).

const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOLLOW = 0.22;        // 0–1 per frame at 60 fps: lower = lazier, floatier trail (frame-rate independent below)
const SETTLE_PX = 0.15;     // stop animating once this close

export function initCursorGlow() {
  if (!hasMouse) return;

  const glow = Object.assign(document.createElement('div'), { className: 'cursor-glow' });
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow);

  const target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
  let frame = 0, last = 0, placed = false;

  const render = (time) => {
    const dt = Math.min((time - last) / (1000 / 60), 3) || 1; // normalise to 60 fps so it feels the same on any display
    last = time;
    const k = prefersReducedMotion ? 1 : 1 - (1 - FOLLOW) ** dt;
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    glow.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
    frame = Math.hypot(target.x - current.x, target.y - current.y) > SETTLE_PX ? requestAnimationFrame(render) : 0;
  };

  const show = (event) => {
    if (event.pointerType === 'touch') return;
    target.x = event.clientX;
    target.y = event.clientY;
    if (!placed) { current.x = target.x; current.y = target.y; placed = true; } // first appearance: no fly-in from the corner
    if (!frame) { last = performance.now(); frame = requestAnimationFrame(render); }
    glow.classList.add('is-visible');
  };
  const hide = () => { glow.classList.remove('is-visible'); placed = false; };

  addEventListener('pointermove', show, { passive: true });
  addEventListener('pointerdown', show, { passive: true });
  document.documentElement.addEventListener('mouseleave', hide);
  document.addEventListener('pointerout', (event) => { if (!event.relatedTarget) hide(); }); // left the window
  addEventListener('blur', hide);
}
