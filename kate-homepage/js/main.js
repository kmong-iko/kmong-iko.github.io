import { initTheme } from './theme.js';
import { initCharacter } from './character.js';
import { initCup } from './cup.js';

initTheme(document.querySelector('.theme-toggle'));
initCharacter(document.querySelector('.scene'));
initCup(document.querySelector('.layer--cup'), document.querySelector('.page'));
