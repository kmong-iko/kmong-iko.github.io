// Cursor effects: a warm glow that follows the mouse, a short fading trail, a click/tap ripple,
// and pixel-sparkle bursts (used by easter eggs). The canvas loop only runs while something is animating.

const TRAIL_MS = 450;
const TRAIL_MAX_POINTS = 48;
const TRAIL_SPACING_PX = 12;
const RIPPLE_MS = 650;
const BURST_MS = 1000;
const BURST_COLORS = ['255,176,40', '255,110,199', '180,92,255', '255,230,120'];

const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

export function initCursorFx() {
  const glow = Object.assign(document.createElement('div'), { className: 'cursor-glow' });
  const canvas = Object.assign(document.createElement('canvas'), { className: 'cursor-fx' });
  canvas.setAttribute('aria-hidden', 'true');
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow, canvas);
  const ctx = canvas.getContext('2d');

  let trail = [], ripples = [], sparks = [];
  let frame = 0, lastTime = 0, glowFrame = 0, pointer = { x: 0, y: 0 };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /* ---- Canvas loop ---- */
  const draw = (now) => {
    const dt = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    trail = trail.filter((p) => now - p.t < TRAIL_MS);
    for (const p of trail) {
      const life = 1 - Math.max(0, now - p.t) / TRAIL_MS;
      ctx.fillStyle = `rgba(255,150,30,${life * 0.16})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 15 * (0.4 + 0.6 * life), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,205,70,${life * 0.34})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 7 * (0.4 + 0.6 * life), 0, Math.PI * 2); ctx.fill();
    }

    ripples = ripples.filter((r) => now - r.t < RIPPLE_MS);
    for (const r of ripples) {
      const progress = Math.max(0, now - r.t) / RIPPLE_MS;
      const eased = 1 - (1 - progress) ** 3;
      ctx.strokeStyle = `rgba(255,150,30,${(1 - progress) * 0.55})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, 6 + 40 * eased, 0, Math.PI * 2); ctx.stroke();
    }

    sparks = sparks.filter((s) => now - s.t < BURST_MS);
    for (const s of sparks) {
      s.vy += 520 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      ctx.fillStyle = `rgba(${s.color},${1 - Math.max(0, now - s.t) / BURST_MS})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
    }

    frame = trail.length || ripples.length || sparks.length ? requestAnimationFrame(draw) : 0;
    if (!frame) ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  const start = () => { if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(draw); } };

  /* ---- Glow + trail follow the mouse ---- */
  const moveGlow = () => { glowFrame = 0; glow.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`; };

  const addTrailPoint = (x, y, t) => {
    const last = trail[trail.length - 1];
    if (last) { // fill gaps left by fast movement
      const steps = Math.floor(Math.hypot(x - last.x, y - last.y) / TRAIL_SPACING_PX);
      for (let i = 1; i <= steps; i++) trail.push({ x: last.x + ((x - last.x) * i) / (steps + 1), y: last.y + ((y - last.y) * i) / (steps + 1), t });
    }
    trail.push({ x, y, t });
    if (trail.length > TRAIL_MAX_POINTS) trail.splice(0, trail.length - TRAIL_MAX_POINTS);
  };

  if (hasMouse) {
    addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      glow.classList.add('is-visible');
      if (!glowFrame) glowFrame = requestAnimationFrame(moveGlow);
      if (!prefersReducedMotion) { addTrailPoint(pointer.x, pointer.y, performance.now()); start(); }
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => glow.classList.remove('is-visible'));
  }

  /* ---- Click / tap ripple ---- */
  if (!prefersReducedMotion) {
    addEventListener('pointerdown', (event) => {
      ripples.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      start();
    }, { passive: true });
  }

  /** Pixel-sparkle burst at client coordinates. */
  const burst = (x, y, count = 22) => {
    if (prefersReducedMotion) return;
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 90 + Math.random() * 230;
      sparks.push({
        x, y, t: now, size: 3 + Math.floor(Math.random() * 3),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 140,
        color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
      });
    }
    start();
  };

  resize();
  addEventListener('resize', resize);
  return { burst };
}
