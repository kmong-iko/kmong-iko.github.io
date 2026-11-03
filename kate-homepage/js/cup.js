// Draggable coffee cup with gravity, bounce, friction and throw momentum.
// The cup's resting spot is its original place in the artwork (the floor). While it is held or
// flying, it is offset from that spot with a CSS transform, so layout is never affected.
// Once it stops bouncing it always glides back to that original spot.

/* Tunables (speeds in px/s, accelerations in px/s² at REFERENCE_WIDTH; scaled to the scene) */
const REFERENCE_WIDTH = 800;
const GRAVITY = 2600;
const FLOOR_BOUNCE = 0.45;       // fraction of vertical speed kept after hitting the floor
const WALL_BOUNCE = 0.5;
const AIR_DRAG = 0.25;           // per second
const FLOOR_FRICTION = 7;        // per second, applied while sliding on the floor
const MIN_BOUNCE_SPEED = 150;    // below this a landing just settles
const MAX_THROW_SPEED = 3500;
const THROW_SAMPLE_MS = 100;     // window used to estimate release velocity
const HOLD_STILL_MS = 80;        // holding still this long before release cancels the throw
const MAX_TILT_DEG = 22;
const MIN_SOUND_SPEED = 120;     // wall/ceiling hits slower than this are silent
const LOUDEST_IMPACT = 2200;     // impact speed that maps to full (still soft) bounce volume
const RETURN_DELAY_MS = 250;     // short pause once settled, before gliding home
const RETURN_MIN_MS = 500;
const RETURN_MAX_MS = 1000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * @param {HTMLElement} cup
 * @param {HTMLElement} bounds  element whose box acts as walls and ceiling
 * @param {{ onBounce?: (intensity: number) => void, onInteract?: () => void }} [hooks]
 *   onBounce gets 0–1 for every audible surface hit; onInteract fires on grab/release (lets audio unlock).
 */
export function initCup(cup, bounds, { onBounce, onInteract } = {}) {
  const scene = cup.offsetParent;
  const state = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 }; // offset from the resting spot
  let limits = { minX: 0, maxX: 0, minY: 0 };           // maxY is always 0 (the floor)
  let dragging = false, grab = { x: 0, y: 0 }, samples = [], frame = 0, lastTime = 0;

  const render = () => {
    cup.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${state.angle}deg)`;
  };

  // Walls and ceiling are the page area; measured relative to the cup's untransformed position.
  const measure = () => {
    const sceneBox = scene.getBoundingClientRect();
    const area = bounds.getBoundingClientRect();
    const left = sceneBox.left + cup.offsetLeft;
    const top = sceneBox.top + cup.offsetTop;
    limits = {
      minX: area.left - left,
      maxX: area.right - (left + cup.offsetWidth),
      minY: area.top - top,
    };
    state.x = clamp(state.x, limits.minX, limits.maxX);
    state.y = clamp(state.y, limits.minY, 0);
    render();
  };

  /* ---- Return to the original spot ---- */
  const glideHome = () => {
    const from = { x: state.x, angle: state.angle };
    const duration = clamp(RETURN_MIN_MS + Math.abs(from.x) * 0.4, RETURN_MIN_MS, RETURN_MAX_MS);
    const start = performance.now() + RETURN_DELAY_MS;
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = easeInOutCubic(t);
      state.x = from.x * (1 - eased);
      state.angle = from.angle * (1 - eased);
      render();
      frame = t < 1 ? requestAnimationFrame(tick) : 0;
    };
    frame = requestAnimationFrame(tick);
  };

  /* ---- Physics loop ---- */
  const step = (time) => {
    const dt = Math.min((time - lastTime) / 1000, 1 / 30);
    lastTime = time;
    const scale = scene.offsetWidth / REFERENCE_WIDTH;

    state.vy += GRAVITY * scale * dt;
    const drag = Math.exp(-AIR_DRAG * dt);
    state.vx *= drag;
    state.vy *= drag;
    state.x += state.vx * dt;
    state.y += state.vy * dt;

    const bounce = (impactSpeed) => {
      if (impactSpeed > MIN_SOUND_SPEED * scale) onBounce?.(clamp(impactSpeed / (LOUDEST_IMPACT * scale), 0, 1));
    };

    if (state.x < limits.minX) { state.x = limits.minX; bounce(-state.vx); state.vx = Math.abs(state.vx) * WALL_BOUNCE; }
    if (state.x > limits.maxX) { state.x = limits.maxX; bounce(state.vx); state.vx = -Math.abs(state.vx) * WALL_BOUNCE; }
    if (state.y < limits.minY) { state.y = limits.minY; bounce(-state.vy); state.vy = Math.abs(state.vy) * WALL_BOUNCE; }

    const onFloor = state.y >= 0;
    if (onFloor) {
      const impact = state.vy;
      state.y = 0;
      if (impact > MIN_BOUNCE_SPEED * scale) {
        bounce(impact);
        state.vy = -impact * FLOOR_BOUNCE;
      } else {
        state.vy = 0;
      }
      state.vx *= Math.exp(-FLOOR_FRICTION * dt);
    }

    // Tilt into the direction of travel in the air; straighten up on the floor.
    const tiltTarget = onFloor ? 0 : clamp(state.vx * 0.025 / scale, -MAX_TILT_DEG, MAX_TILT_DEG);
    state.angle += (tiltTarget - state.angle) * Math.min(1, dt * 10);
    render();

    const atRest = onFloor && state.vy === 0 && Math.abs(state.vx) < 8 && Math.abs(state.angle) < 0.1;
    if (atRest) {
      state.vx = 0;
      glideHome();
    } else {
      frame = requestAnimationFrame(step);
    }
  };

  const startPhysics = () => {
    cancelAnimationFrame(frame);
    lastTime = performance.now();
    frame = requestAnimationFrame(step);
  };

  /* ---- Dragging (pointer events cover mouse, touch and pen) ---- */
  cup.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    cancelAnimationFrame(frame);
    frame = 0;
    measure();
    dragging = true;
    grab = { x: event.clientX - state.x, y: event.clientY - state.y };
    samples = [];
    state.vx = state.vy = 0;
    cup.setPointerCapture(event.pointerId);
    cup.classList.add('is-dragging');
    onInteract?.();
    event.preventDefault();
  });

  cup.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const x = clamp(event.clientX - grab.x, limits.minX, limits.maxX);
    const y = clamp(event.clientY - grab.y, limits.minY, 0);
    const previous = samples[samples.length - 1];
    if (previous) state.angle = clamp(state.angle + (x - previous.x) * 0.15, -MAX_TILT_DEG, MAX_TILT_DEG);
    state.x = x;
    state.y = y;
    samples.push({ x, y, t: event.timeStamp });
    while (samples.length > 2 && event.timeStamp - samples[0].t > THROW_SAMPLE_MS) samples.shift();
    render();
  });

  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    cup.classList.remove('is-dragging');
    onInteract?.();
    if (cup.hasPointerCapture(event.pointerId)) cup.releasePointerCapture(event.pointerId);

    const first = samples[0];
    const last = samples[samples.length - 1];
    const elapsed = last && first ? (last.t - first.t) / 1000 : 0;
    const stale = last && event.timeStamp - last.t > HOLD_STILL_MS;
    if (elapsed > 0.005 && !stale) {
      const vx = (last.x - first.x) / elapsed;
      const vy = (last.y - first.y) / elapsed;
      const speed = Math.hypot(vx, vy);
      const limit = Math.min(1, MAX_THROW_SPEED / (speed || 1));
      state.vx = vx * limit;
      state.vy = vy * limit;
    }
    startPhysics();
  };
  cup.addEventListener('pointerup', release);
  cup.addEventListener('pointercancel', release);

  new ResizeObserver(() => { if (!dragging) measure(); }).observe(bounds);
  measure();
}