import { initTheme } from './theme.js';
import { initCharacter } from './character.js';
import { initCup } from './cup.js';
import { createSound, initSoundToggle } from './sound.js';

const sound = createSound();

initTheme(document.querySelector('.theme-toggle'));
initSoundToggle(document.querySelector('.sound-toggle'), sound);
initCharacter(document.querySelector('.scene'));
initCup(document.querySelector('.layer--cup'), document.querySelector('.page'), {
  onBounce: sound.play,
  onInteract: sound.unlock,
});