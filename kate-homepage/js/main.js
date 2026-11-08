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
import { renderProjectCards, initProjects } from './projects.js';
import { initCertificates } from './certificates.js';
import { initAbout } from './about.js';
import { initContact } from './contact.js';
import { initSfx } from './sfx.js';
import { initLoader } from './loader.js';

const sound = createSound();

initRouter();
initClock(document.querySelector('[data-pht-clock]'));
initTheme(document.querySelector('.theme-toggle'));
initSoundToggle(document.querySelector('.sound-toggle'), sound);
initBackground();
initCursorGlow();
initKeys(sound);
renderProjectCards(document.querySelector('.carousel__track')); // cards come from js/data/projects.js
initCarousel(document.querySelector('.carousel'));
initProjects(document.querySelector('.carousel'), sound);
initCertificates(document.querySelector('.certs'), sound);
initAbout(document.querySelector('.btn-outline'), sound);
initSfx(sound);

// Home page: the character, her personality, and the draggable cup (its walls are the Home view).
const scene = document.querySelector('.scene');
const character = initCharacter(scene);
const personality = initPersonality(scene, character);

initContact(document.querySelector('.note'), { sound, speak: (message) => character.speak(message, 4200) });

initCup(document.querySelector('.layer--cup'), document.querySelector('.view--home'), {
  shadow: document.querySelector('.cup-shadow'),
  onBounce: sound.play,
  onInteract: sound.unlock,
  onMove: personality.onCupMove,
});

// Browsers only allow audio after a user gesture: unlock it on the first interaction anywhere.
['pointerdown', 'keydown'].forEach((type) => addEventListener(type, () => sound.unlock(), { once: true, passive: true }));


initLoader(); // fade the loading screen away once the artwork is ready
