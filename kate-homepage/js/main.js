import { initTheme } from './theme.js';
import { initBackground } from './background.js';
import { initCursorFx } from './cursor-fx.js';
import { initCharacter } from './character.js';
import { initPersonality } from './personality.js';
import { initStatus } from './status.js';
import { initCup } from './cup.js';
import { createSound, initSoundToggle } from './sound.js';

const scene = document.querySelector('.scene');
const sound = createSound();

initTheme(document.querySelector('.theme-toggle'));
initSoundToggle(document.querySelector('.sound-toggle'), sound);
initBackground();
const fx = initCursorFx();

const character = initCharacter(scene);
const personality = initPersonality(scene, character, fx);
initStatus(scene);

initCup(document.querySelector('.layer--cup'), document.querySelector('.page'), {
  shadow: document.querySelector('.cup-shadow'),
  onBounce: sound.play,
  onInteract: sound.unlock,
  onMove: personality.onCupMove,
});