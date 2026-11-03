// Light/dark toggle. The initial theme is applied by the inline script in <head>.
const root = document.documentElement;

export function initTheme(button) {
  const sync = () => {
    const isDark = root.dataset.theme === 'dark';
    button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    sync();
  });

  sync();
}
