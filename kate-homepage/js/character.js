// Character behaviour: eye tracking, typing/idle pose, and click-to-talk.

/* Tunables (distances are in original artwork pixels) */
const ART_WIDTH = 1919;                                   // cropped artwork width
const EYE_CENTER = { x: (1163 - 20) / ART_WIDTH, y: (795 - 16) / 1602 }; // between the eyes, as scene fractions
const MAX_PUPIL_MOVE = { x: 26, y: 18 };                  // the pupil-cover layer clips any overshoot
const EYE_EASING = 0.16;                                  // 0–1, higher = snappier
const IDLE_DELAY_MS = 1500;                               // inactivity before she stops typing
const TOUCH_TYPING_INTERVAL_MS = 6000;                    // touch devices: short typing bursts

const WELCOME_MESSAGE = 'Hi, I’m Kate! Welcome to my little corner of the web.';
const RANDOM_MESSAGES = [
  'Psst… my workfolio is worth a peek.',
  'Coffee first, pixels second.',
  'I draw things, then I make them clickable.',
  'Thanks for stopping by!',
  'Need a designer who codes? Hi.',
  'Shh, I’m mid-commit.',
];

const isTouch = matchMedia('(pointer: coarse)').matches;
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initCharacter(scene) {
  const pupils = scene.querySelector('.layer--pupils');
  const head = scene.querySelector('.scene__head');
  const bubble = scene.querySelector('.bubble');
  const bubbleText = scene.querySelector('.bubble__text');

  /* ---- Eye tracking ---- */
  const restingGaze = () => ({ x: -0.55 * MAX_PUPIL_MOVE.x, y: 0.5 * MAX_PUPIL_MOVE.y }); // glance at the laptop
  let current = restingGaze();
  let target = { ...current };
  let sceneRect, pixelScale, frame = 0;

  const measure = () => {
    sceneRect = scene.getBoundingClientRect();
    pixelScale = sceneRect.width / ART_WIDTH;
    renderEyes();
  };

  const renderEyes = () => {
    pupils.style.transform = `translate3d(${current.x * pixelScale}px, ${current.y * pixelScale}px, 0)`;
  };

  const animateEyes = () => {
    const ease = prefersReducedMotion ? 1 : EYE_EASING;
    current.x += (target.x - current.x) * ease;
    current.y += (target.y - current.y) * ease;
    renderEyes();
    const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.03;
    frame = settled ? 0 : requestAnimationFrame(animateEyes);
  };

  const setGaze = (gaze) => {
    target = gaze;
    if (!frame) frame = requestAnimationFrame(animateEyes);
  };

  const lookAt = (clientX, clientY) => {
    const dx = clientX - (sceneRect.left + EYE_CENTER.x * sceneRect.width);
    const dy = clientY - (sceneRect.top + EYE_CENTER.y * sceneRect.height);
    const distance = Math.hypot(dx, dy) || 1;
    const strength = Math.min(1, distance / (sceneRect.width * 0.45));
    setGaze({ x: (dx / distance) * strength * MAX_PUPIL_MOVE.x, y: (dy / distance) * strength * MAX_PUPIL_MOVE.y });
  };

  /* ---- Typing / idle pose ---- */
  let idleTimer;
  const wake = () => {
    scene.dataset.pose = 'typing';
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      scene.dataset.pose = 'idle';
      if (isTouch) setGaze(restingGaze());
    }, IDLE_DELAY_MS);
  };

  const onPointer = (event) => { lookAt(event.clientX, event.clientY); wake(); };
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('mouseleave', () => { if (!isTouch) setGaze(restingGaze()); });
  if (isTouch) setInterval(() => { if (!document.hidden) wake(); }, TOUCH_TYPING_INTERVAL_MS);

  /* ---- Click to talk ---- */
  let hasGreeted = false, lastIndex = -1, hideTimer;

  const pickMessage = () => {
    if (!hasGreeted) { hasGreeted = true; return WELCOME_MESSAGE; }
    let index;
    do { index = Math.floor(Math.random() * RANDOM_MESSAGES.length); } while (index === lastIndex);
    lastIndex = index;
    return RANDOM_MESSAGES[index];
  };

  head.addEventListener('click', () => {
    const message = pickMessage();
    bubbleText.textContent = message;
    scene.classList.add('is-talking');
    bubble.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      scene.classList.remove('is-talking');
      bubble.classList.remove('is-visible');
    }, 2200 + message.length * 40);
  });

  new ResizeObserver(measure).observe(scene);
  addEventListener('scroll', measure, { passive: true });
  measure();
  wake();
}
