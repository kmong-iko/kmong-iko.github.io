// Short, cute loading screen. The markup + CSS are inline in index.html / styles.css so it shows instantly;
// this waits for the character artwork (max ~3 s) and a minimum display time, then fades it away.

const MIN_SHOW_MS = 1100;
const MAX_WAIT_MS = 3200;

export function initLoader() {
  const loader = document.querySelector('.loader');
  const root = document.documentElement;
  if (!loader) { root.classList.remove('is-loading'); return Promise.resolve(); }

  const started = performance.now();
  const layers = [...document.querySelectorAll('.scene .layer')];
  const decoded = Promise.allSettled(layers.map((img) => (img.decode ? img.decode() : Promise.resolve())));
  const timeout = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));

  return Promise.race([decoded, timeout]).then(() => {
    const wait = Math.max(0, MIN_SHOW_MS - (performance.now() - started));
    return new Promise((resolve) => setTimeout(() => {
      loader.classList.add('is-done');
      root.classList.remove('is-loading');
      setTimeout(() => { loader.remove(); resolve(); }, 650);
    }, wait));
  });
}
