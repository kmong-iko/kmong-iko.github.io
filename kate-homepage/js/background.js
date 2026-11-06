// Home ambient: time-of-day atmosphere (a subtle tint over the gradient, via [data-period]) + sparse floating pixel stars.

const root = document.documentElement;
const PERIOD_REFRESH_MS = 5 * 60 * 1000;
const STAR_COUNT = { desktop: 16, mobile: 9 };
const STAR_COLORS = ['#ff6ec7', '#b45cff', '#ff9a1f', '#7a5cff'];

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
      `--size:${isSpark ? 9 : pick([2, 3, 4])}px`, `--color:${pick(STAR_COLORS)}`,
      `--peak:${rand(0.45, 0.95).toFixed(2)}`,
      `--duration:${rand(3, 14).toFixed(1)}s`, `--delay:-${rand(0, 10).toFixed(1)}s`,
      `--dx:${rand(-14, 14).toFixed(0)}px`, `--dy:${rand(-28, -8).toFixed(0)}px`,
    ].join(';');
    fragment.append(star);
  }
  container.append(fragment);
}

export function initBackground() {
  const ambient = document.querySelector('.hero-ambient');
  const applyPeriod = () => { root.dataset.period = getPeriod(); };

  applyPeriod();
  setInterval(applyPeriod, PERIOD_REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) applyPeriod(); });

  createStars(ambient.querySelector('.hero-ambient__stars'));
  requestAnimationFrame(() => ambient.classList.add('is-ready'));
}
