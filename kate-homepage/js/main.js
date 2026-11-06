import { initRouter } from './router.js';
import { initClock } from './clock.js';
import { initTheme } from './theme.js';
import { initBackground } from './background.js';
import { initCursorGlow } from './cursor-glow.js';
import { initCharacter } from './character.js';
import { initPersonality } from './personality.js';
import { initCup } from './cup.js';
import { initCarousel } from './carousel.js';
import { initKeys } from './keys.js';
import { createSound, initSoundToggle } from './sound.js';

const sound = createSound();

initRouter();
initClock(document.querySelector('[data-pht-clock]'));
initTheme(document.querySelector('.theme-toggle'));
initSoundToggle(document.querySelector('.sound-toggle'), sound);
initBackground();
initCursorGlow();
initKeys(sound);
initCarousel(document.querySelector('.carousel'));

// Home page: the character, her personality, and the draggable cup (its walls are the Home view).
const scene = document.querySelector('.scene');
const character = initCharacter(scene);
const personality = initPersonality(scene, character);

initCup(document.querySelector('.layer--cup'), document.querySelector('.view--home'), {
  shadow: document.querySelector('.cup-shadow'),
  onBounce: sound.play,
  onInteract: sound.unlock,
  onMove: personality.onCupMove,
});

// Browsers only allow audio after a user gesture: unlock it on the first interaction anywhere.
['pointerdown', 'keydown'].forEach((type) => addEventListener(type, () => sound.unlock(), { once: true, passive: true }));
