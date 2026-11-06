// Workfolio carousel: cards slide one at a time, looping forever. It cycles on its own every few seconds
// unless the pointer/focus is inside it, the tab or page is hidden, or a project is open
// (<html data-project-open>, to be set by the future project viewer).

const AUTOPLAY_MS = 4500;
const SLIDE_MS = 600;

const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initCarousel(root) {
  const track = root.querySelector('.carousel__track');
  const originals = [...track.children];

  // Clone the cards once so there is always a next card to slide in, even when every card is already visible.
  originals.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.dataset.clone = '';
    track.append(clone);
  });

  let busy = false, paused = false, timer = 0;

  const visibleCount = () => Number.parseInt(getComputedStyle(root).getPropertyValue('--visible'), 10) || 1;
  const stepPx = () => track.children[1].offsetLeft - track.children[0].offsetLeft;
  const projectOpen = () => document.documentElement.hasAttribute('data-project-open');

  // Only the cards actually in view are exposed to assistive tech / keyboard.
  const refresh = () => {
    const visible = visibleCount();
    [...track.children].forEach((item, index) => {
      const hidden = index >= visible;
      item.inert = hidden;
      item.setAttribute('aria-hidden', String(hidden));
    });
  };

  const slide = (direction) => {
    if (busy || !track.offsetParent) return;
    busy = true;
    const duration = prefersReducedMotion ? 0 : SLIDE_MS;
    const ease = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    if (direction === 'next') {
      track.style.transition = ease;
      track.style.transform = `translateX(${-stepPx()}px)`;
    } else {
      track.prepend(track.lastElementChild);                 // bring the last card in front…
      track.style.transition = 'none';
      track.style.transform = `translateX(${-stepPx()}px)`;  // …shifted so nothing visibly jumps
      track.getBoundingClientRect();                          // flush
      track.style.transition = ease;
      track.style.transform = 'none';
    }

    setTimeout(() => {
      track.style.transition = 'none';
      if (direction === 'next') track.append(track.firstElementChild);
      track.style.transform = 'none';
      refresh();
      busy = false;
    }, duration + 20);
  };

  /* ---- Autoplay ---- */
  const tick = () => {
    if (paused || document.hidden || projectOpen() || !track.offsetParent) return;
    slide('next');
  };
  const restart = () => { clearInterval(timer); timer = setInterval(tick, AUTOPLAY_MS); };

  root.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') paused = true; });
  root.addEventListener('pointerleave', () => { paused = false; });
  root.addEventListener('focusin', () => { paused = true; });
  root.addEventListener('focusout', () => { paused = false; });

  root.querySelector('.carousel__arrow--next').addEventListener('click', () => { slide('next'); restart(); });
  root.querySelector('.carousel__arrow--prev').addEventListener('click', () => { slide('prev'); restart(); });

  new ResizeObserver(refresh).observe(root);
  refresh();
  restart();
}
