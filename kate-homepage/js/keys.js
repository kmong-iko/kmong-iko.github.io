// Dev-tool keys: they press down on hover (pure CSS) and play a soft key sound.
// On touch screens there is no hover, so a tap presses the key briefly instead.

const TOUCH_RELEASE_MS = 140;

export function initKeys(sound) {
  document.querySelectorAll('.key').forEach((key) => {
    key.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') sound.playKey();
    });

    key.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      key.classList.add('is-pressed');
      sound.playKey();
      setTimeout(() => key.classList.remove('is-pressed'), TOUCH_RELEASE_MS);
    });
  });
}
