// Character personality: blinking, unprompted chatter, glances at the viewer, a reaction when the cup
// comes close, and two hidden easter eggs. Uses the API returned by initCharacter().

const BLINK_MS = [2600, 6200];
const BLINK_DURATION_MS = 170;
const DOUBLE_BLINK_CHANCE = 0.2;
const GLANCE_MS = [7000, 15000];
const GLANCE_HOLD_MS = [1100, 1900];
const CHATTER_MS = [28000, 55000];

const CUP_NEAR = 0.36;           // × scene width: the cup is "close" inside this distance…
const CUP_FAR = 0.5;             // …and "gone" beyond this one (hysteresis)
const CUP_REACTION_COOLDOWN_MS = 6000;

const SECRET_CLICKS = 5, SECRET_WINDOW_MS = 3000;
const STICKER_TAPS = 3, STICKER_WINDOW_MS = 2000;

const CUP_LINES = ['Hey, careful with my coffee!', 'Is that my cup?! Mind the laptop!', 'Whoa, incoming mug!'];
const SECRET_LINE = 'Secret unlocked: I name all my bugs. This one is Gary.';
const STICKER_LINE = 'That’s Mochi, my debugging buddy. He’s never been wrong. He’s also never said a word.';
const CHATTER = {
  any: ['Psst… try picking up my coffee.', 'Still here! Take your time.', 'Pixel by pixel, that’s how I work.', 'Go on, toss the cup. It bounces.'],
  dawn: ['Early bird gets the bugs.'],
  day: ['Good day for shipping things.'],
  dusk: ['Golden hour. Best lighting there is.'],
  night: ['It’s getting late… one more commit.'],
};

const randomBetween = ([min, max]) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const loop = (range, action) => { // repeat `action` at random intervals, skipping while the tab is hidden
  const run = () => setTimeout(() => { if (!document.hidden) action(); run(); }, randomBetween(range));
  run();
};

export function initPersonality(scene, character, fx) {
  const pupils = scene.querySelector('.layer--pupils');

  /* ---- Blinking: squash the pupils flat (the skin behind them reads as a closed eye) ---- */
  const blink = () => pupils.animate(
    [{ scale: '1 1' }, { scale: '1 0.05', offset: 0.4 }, { scale: '1 1' }],
    { duration: BLINK_DURATION_MS, easing: 'ease-in-out' },
  );
  loop(BLINK_MS, () => {
    blink();
    if (Math.random() < DOUBLE_BLINK_CHANCE) setTimeout(blink, BLINK_DURATION_MS + 90);
  });

  /* ---- Unprompted chatter ---- */
  loop(CHATTER_MS, () => {
    if (character.isTalking()) return;
    const period = document.documentElement.dataset.period;
    character.speak(pick([...CHATTER.any, ...(CHATTER[period] ?? [])]), 3200);
  });

  /* ---- Glances at the viewer (only while she's idle) ---- */
  loop(GLANCE_MS, () => {
    if (!character.isIdle()) return;
    character.glance({ x: randomBetween([-4, 4]), y: randomBetween([-6, -1]) }, randomBetween(GLANCE_HOLD_MS));
  });

  /* ---- Reaction when the cup comes close ---- */
  let following = false, isNear = false, lastReaction = 0;
  const onCupMove = ({ x, y, away }) => {
    if (!away) {
      if (following) { character.followCup(null); following = false; }
      isNear = false;
      return;
    }
    following = true;
    character.followCup({ x, y });

    const head = character.headMetrics();
    const distance = Math.hypot(x - head.x, y - head.y) / head.width;
    if (!isNear && distance < CUP_NEAR) {
      isNear = true;
      const now = performance.now();
      if (now - lastReaction > CUP_REACTION_COOLDOWN_MS) {
        lastReaction = now;
        character.speak(pick(CUP_LINES), 2400);
        character.emitMood('startled', 2600);
      }
    } else if (isNear && distance > CUP_FAR) {
      isNear = false;
    }
  };

  /* ---- Easter eggs ---- */
  const counter = (needed, windowMs, onComplete) => {
    let times = [];
    return () => {
      const now = performance.now();
      times = times.filter((t) => now - t < windowMs);
      times.push(now);
      if (times.length >= needed) { times = []; onComplete(); }
    };
  };

  // 1) Click her five times quickly.
  const head = scene.querySelector('.scene__head');
  head.addEventListener('click', counter(SECRET_CLICKS, SECRET_WINDOW_MS, () => {
    const { x, y } = character.headMetrics();
    character.speak(SECRET_LINE, 4800);
    character.emitMood('loved', 5000);
    fx.burst(x, y - 40, 26);
  }));

  // 2) Tap the pig sticker on her laptop three times.
  const sticker = scene.querySelector('.scene__sticker');
  sticker.addEventListener('click', counter(STICKER_TAPS, STICKER_WINDOW_MS, () => {
    const box = sticker.getBoundingClientRect();
    character.speak(STICKER_LINE, 5200);
    fx.burst(box.left + box.width / 2, box.top + box.height / 2, 16);
  }));

  return { onCupMove };
}
