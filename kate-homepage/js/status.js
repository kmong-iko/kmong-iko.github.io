// Retro status panel: live clock + a mood that reacts to what the character is doing.
// Mood events come from js/character.js / js/personality.js as CustomEvent('mood', { detail: { mood, ms } }).
// ms > 0 → temporary mood that reverts after that long; otherwise it becomes the base mood.

const MOOD_LABELS = {
  coding: 'CODING', vibing: 'VIBING', sleepy: 'SLEEPY', chatty: 'CHATTY',
  startled: 'STARTLED', loved: 'LOVED', curious: 'CURIOUS',
};

export function initStatus(scene) {
  const clock = document.querySelector('[data-status-clock]');
  const moodLabel = document.querySelector('[data-status-mood]');
  const format = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  /* ---- Clock ---- */
  let clockTimer = 0;
  const tickClock = () => {
    clock.textContent = format.format(new Date());
    clockTimer = setTimeout(tickClock, 1000 - (Date.now() % 1000)); // stay aligned to whole seconds
  };
  document.addEventListener('visibilitychange', () => {
    clearTimeout(clockTimer);
    if (!document.hidden) tickClock();
  });
  tickClock();

  /* ---- Mood ---- */
  let baseMood = 'coding', temporary = null, revertTimer = 0;
  const render = () => {
    let mood = temporary ?? baseMood;
    if (mood === 'vibing' && ['night', 'dawn'].includes(document.documentElement.dataset.period)) mood = 'sleepy';
    moodLabel.textContent = MOOD_LABELS[mood] ?? mood.toUpperCase();
  };

  scene.addEventListener('mood', ({ detail: { mood, ms } }) => {
    if (ms > 0) {
      temporary = mood;
      clearTimeout(revertTimer);
      revertTimer = setTimeout(() => { temporary = null; render(); }, ms);
    } else {
      baseMood = mood;
    }
    render();
  });
  render();
}
