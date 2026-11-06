// Character core: eye tracking, continuous typing, and speaking.
// Extra behaviour (blinking, glances, reactions, easter eggs) lives in personality.js and uses the API returned here.

/* Tunables (distances are in original artwork pixels) */
const ART_WIDTH = 1919;                                   // cropped artwork width
const ART_HEIGHT = 1602;
const EYE_CENTER = { x: (1163 - 20) / ART_WIDTH, y: (795 - 16) / ART_HEIGHT }; // between the eyes, as scene fractions
const HEAD_CENTER = { x: 0.66, y: 0.44 };                 // as scene fractions
const MAX_PUPIL_MOVE = { x: 26, y: 18 };                  // the pupil-cover layer clips any overshoot
const EYE_EASING = 0.16;                                  // 0–1, higher = snappier (following the cursor)
const EYE_RETURN_EASING = 0.07;                           // slower, so the eyes drift back to the laptop
const IDLE_DELAY_MS = 1500;                               // cursor stillness before her eyes drift back to the laptop

/* Typing rhythm: bursts of fast key presses alternate with slower ones. Each value is a [min, max] in ms
   between key-down / key-up frames, and how many frame changes a burst lasts. */
const TYPING_PACES = {
  fast: { interval: [60, 120], changes: [6, 14] },
  slow: { interval: [220, 420], changes: [2, 4] },
};

const WELCOME_MESSAGE = 'Hi, I’m Kae! Welcome to my little corner of the web.';
const RANDOM_MESSAGES = [
  'Psst… my workfolio is worth a peek.',
  'Coffee first, pixels second.',
  'I draw things, then I make them clickable.',
  'Thanks for stopping by!',
  'Need a designer who codes? Hi.',
  'Shh, I’m mid-commit.',
];

const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const randomBetween = ([min, max]) => min + Math.random() * (max - min);

export function initCharacter(scene) {
  const pupils = scene.querySelector('.layer--pupils');
  const head = scene.querySelector('.scene__head');
  const bubble = scene.querySelector('.bubble');
  const bubbleText = scene.querySelector('.bubble__text');

  /* ---- Eye tracking ---- */
  const restingGaze = () => ({ x: -0.55 * MAX_PUPIL_MOVE.x, y: 0.5 * MAX_PUPIL_MOVE.y }); // glance at the laptop
  let current = restingGaze();
  let target = { ...current };
  let easing = EYE_EASING;
  let sceneRect, pixelScale, frame = 0;
  let cupCenter = null; // while set, the eyes follow the cup instead of the cursor

  const measure = () => {
    sceneRect = scene.getBoundingClientRect();
    pixelScale = sceneRect.width / ART_WIDTH;
    renderEyes();
  };

  const renderEyes = () => {
    pupils.style.transform = `translate3d(${current.x * pixelScale}px, ${current.y * pixelScale}px, 0)`;
  };

  const animateEyes = () => {
    const ease = prefersReducedMotion ? 1 : easing;
    current.x += (target.x - current.x) * ease;
    current.y += (target.y - current.y) * ease;
    renderEyes();
    const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.03;
    frame = settled ? 0 : requestAnimationFrame(animateEyes);
  };

  const setGaze = (gaze, ease = EYE_EASING) => {
    target = gaze;
    easing = ease;
    if (!frame) frame = requestAnimationFrame(animateEyes);
  };
  const returnGazeToLaptop = () => setGaze(restingGaze(), EYE_RETURN_EASING);

  const lookAt = (clientX, clientY) => {
    const dx = clientX - (sceneRect.left + EYE_CENTER.x * sceneRect.width);
    const dy = clientY - (sceneRect.top + EYE_CENTER.y * sceneRect.height);
    const distance = Math.hypot(dx, dy) || 1;
    const strength = Math.min(1, distance / (sceneRect.width * 0.45));
    setGaze({ x: (dx / distance) * strength * MAX_PUPIL_MOVE.x, y: (dy / distance) * strength * MAX_PUPIL_MOVE.y });
  };

  /* ---- Typing: always running, whether or not the cursor moves ---- */
  let keyIsDown = true, pace = 'fast', changesLeft = 0;

  // Alternates the key-down / key-up body frames at randomised intervals (paused while Home or the tab is hidden).
  const typeStep = () => {
    if (scene.offsetParent && !document.hidden) {
      keyIsDown = !keyIsDown;
      scene.dataset.key = keyIsDown ? 'down' : 'up';
      if (--changesLeft <= 0) {
        pace = pace === 'fast' ? 'slow' : 'fast';
        changesLeft = Math.round(randomBetween(TYPING_PACES[pace].changes));
      }
    }
    setTimeout(typeStep, randomBetween(TYPING_PACES[pace].interval));
  };
  if (!prefersReducedMotion) typeStep();

  /* ---- Cursor activity: only affects where she looks (and the laptop glow), never the typing ---- */
  let idleTimer;
  const wake = () => {
    scene.dataset.activity = 'active';
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      scene.dataset.activity = 'idle';
      if (!cupCenter) returnGazeToLaptop();
    }, IDLE_DELAY_MS);
  };

  const onPointer = (event) => {
    if (!cupCenter) lookAt(event.clientX, event.clientY);
    wake();
  };
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('mouseleave', () => { if (!cupCenter) returnGazeToLaptop(); });

  /* ---- Speaking ---- */
  let hasGreeted = false, lastIndex = -1, hideTimer;

  /** Opens her mouth and shows the speech bubble for `ms` (default: based on message length). */
  const speak = (message, ms = 2200 + message.length * 40) => {
    bubbleText.textContent = message;
    scene.classList.add('is-talking');
    bubble.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      scene.classList.remove('is-talking');
      bubble.classList.remove('is-visible');
    }, ms);
  };

  const pickMessage = () => {
    if (!hasGreeted) { hasGreeted = true; return WELCOME_MESSAGE; }
    let index;
    do { index = Math.floor(Math.random() * RANDOM_MESSAGES.length); } while (index === lastIndex);
    lastIndex = index;
    return RANDOM_MESSAGES[index];
  };
  head.addEventListener('click', () => speak(pickMessage()));

  new ResizeObserver(measure).observe(scene);
  addEventListener('scroll', measure, { passive: true });
  measure();
  wake();

  /* ---- API for personality.js / cup.js ---- */
  return {
    speak,
    isIdle: () => scene.dataset.activity === 'idle',
    isTalking: () => scene.classList.contains('is-talking'),
    /** Brief look at an offset gaze (artwork px), then back to the laptop. */
    glance(gaze, holdMs) {
      setGaze(gaze, 0.12);
      setTimeout(() => { if (!cupCenter && scene.dataset.activity === 'idle') returnGazeToLaptop(); }, holdMs);
    },
    /** Follow the cup at client coords {x, y}; pass null to let go. */
    followCup(center) {
      const wasFollowing = Boolean(cupCenter);
      cupCenter = center;
      if (center) lookAt(center.x, center.y);
      else if (wasFollowing) returnGazeToLaptop();
    },
    /** Head centre in client px, and the scene width (to measure distances against). */
    headMetrics: () => ({ x: sceneRect.left + HEAD_CENTER.x * sceneRect.width, y: sceneRect.top + HEAD_CENTER.y * sceneRect.height, width: sceneRect.width }),
  };
}
