// Home ambient: time-of-day atmosphere (a subtle tint over the gradient, via [data-period]) + floating pixel sparkles.
// Sparkle colours come from CSS (--spark-1…4, different in Light and Dark mode). Sparkles also drift gently away from the
// pointer when it comes close (desktop only).

const root = document.documentElement;
const PERIOD_REFRESH_MS = 5 * 60 * 1000;
const STAR_COUNT = { desktop: 22, mobile: 12 };
const STAR_COLOR_VARS = ['var(--spark-1)', 'var(--spark-2)', 'var(--spark-3)', 'var(--spark-4)'];
const REACT_RADIUS = 120;     // px: how close the pointer must be to nudge a sparkle
const REACT_PUSH = 30;        // px: maximum nudge
const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function getPeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function createStars(container) {
  const count = matchMedia('(max-width: 760px)').matches ? STAR_COUNT.mobile : STAR_COUNT.desktop;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const star = document.createElement('i');
    const isSpark = Math.random() < 0.3;
    star.className = isSpark ? 'star star--spark' : 'star';
    star.style.cssText = [
      `--x:${rand(2, 98).toFixed(1)}%`, `--y:${rand(2, 96).toFixed(1)}%`,
      `--size:${isSpark ? 9 : pick([2, 3, 4])}px`, `--color:${pick(STAR_COLOR_VARS)}`,
      `--peak:${rand(0.45, 0.95).toFixed(2)}`,
      `--duration:${rand(3, 14).toFixed(1)}s`, `--delay:-${rand(0, 10).toFixed(1)}s`,
      `--dx:${rand(-14, 14).toFixed(0)}px`, `--dy:${rand(-28, -8).toFixed(0)}px`,
    ].join(';');
    fragment.append(star);
  }
  container.append(fragment);
}

function initSparkleHover(container) {
  if (!hasMouse) return;
  let stars = [], centers = [], pointer = null, frame = 0;

  const measure = () => {
    stars = [...container.children];
    centers = stars.map((star) => { // centre of the sparkle's resting spot, ignoring its drift and nudge
      const box = star.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });
  };
  const update = () => {
    frame = 0;
    stars.forEach((star, i) => {
      const dx = centers[i].x - (pointer?.x ?? -9999), dy = centers[i].y - (pointer?.y ?? -9999);
      const distance = Math.hypot(dx, dy);
      if (pointer && distance < REACT_RADIUS) {
        const strength = (1 - distance / REACT_RADIUS) ** 1.5;
        const push = REACT_PUSH * strength / (distance || 1);
        star.style.translate = `${(dx * push).toFixed(1)}px ${(dy * push).toFixed(1)}px`;
        star.style.scale = String(1 + 0.9 * strength);
        star.classList.add('is-excited');
      } else if (star.classList.contains('is-excited')) {
        star.style.translate = '';
        star.style.scale = '';
        star.classList.remove('is-excited');
      }
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  addEventListener('pointermove', (event) => {
    if (!container.offsetParent || event.pointerType === 'touch') return;
    if (!stars.length || event.timeStamp - (initSparkleHover.measuredAt ?? 0) > 1500) { measure(); initSparkleHover.measuredAt = event.timeStamp; }
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { pointer = null; schedule(); });
  addEventListener('resize', () => { stars = []; });
}

export function initBackground() {
  const ambient = document.querySelector('.hero-ambient');
  const applyPeriod = () => { root.dataset.period = getPeriod(); };

  applyPeriod();
  setInterval(applyPeriod, PERIOD_REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) applyPeriod(); });

  const starsContainer = ambient.querySelector('.hero-ambient__stars');
  createStars(starsContainer);
  initSparkleHover(starsContainer);
  requestAnimationFrame(() => ambient.classList.add('is-ready'));
}
