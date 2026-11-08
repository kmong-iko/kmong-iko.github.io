// One place that wires the UI sound effects to the whole site (all pages), using delegated listeners.
// Every sound goes through sound.sfx(), which already respects the on/off toggle and the overlap limiter.

export function initSfx(sound) {
  const root = document.documentElement;
  const hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Clicks
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.closest('.theme-toggle')) { sound.sfx(root.dataset.theme === 'dark' ? 'theme-dark' : 'theme-light'); return; }
    if (target.closest('.sound-toggle')) return;                         // has its own preview
    if (target.closest('.nav a, .site-header a')) { sound.sfx('nav'); return; }
    if (target.closest('.carousel__arrow')) { sound.sfx('slide'); return; }
    if (target.closest('.social a, .tile')) { sound.sfx('click'); return; }
    if (target.closest('.certs__name')) { sound.sfx('click'); return; }
    if (target.closest('.note__send, .proj__link, .note__again')) { sound.sfx('click'); }
  });

  if (!hoverable) return;

  // Soft hovers: creative tools, project cards, footer links, header controls
  const hoverRules = [['.tile', 'tile'], ['.card', 'hover'], ['.social a', 'hover'], ['.icon-button', 'hover'], ['.btn-outline', 'hover']];
  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    for (const [selector, name] of hoverRules) {
      const element = event.target.closest(selector);
      if (element && !element.contains(event.relatedTarget)) { sound.sfx(name); return; }
    }
  });
}
