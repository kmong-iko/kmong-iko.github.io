// Cursor highlight: one soft yellow-orange glow that sits exactly on the pointer.
// No easing, no trail, no particles. It is hidden whenever the pointer leaves the page (and on touch devices).

const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

export function initCursorGlow() {
  if (!hasMouse) return;

  const glow = Object.assign(document.createElement('div'), { className: 'cursor-glow' });
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow);

  const show = (event) => {
    if (event.pointerType === 'touch') return;
    glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    glow.classList.add('is-visible');
  };
  const hide = () => glow.classList.remove('is-visible');

  addEventListener('pointermove', show, { passive: true });
  addEventListener('pointerdown', show, { passive: true });
  document.documentElement.addEventListener('mouseleave', hide);
  document.addEventListener('pointerout', (event) => { if (!event.relatedTarget) hide(); }); // left the window
  addEventListener('blur', hide);
}
