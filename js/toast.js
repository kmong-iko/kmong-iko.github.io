// Phones and small touch screens only: a small, dismissible tip at the bottom that the site is best on a computer.
const MESSAGE = 'For the best experience, view this portfolio on a desktop or laptop.';
const SHOW_MS = 7000;

export function initMobileToast() {
  if (!matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1024px)').matches) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M8.5 20h7M12 16.5V20"/></svg><p></p><button type="button" aria-label="Dismiss">\u00d7</button>';
  toast.querySelector('p').textContent = MESSAGE;
  document.body.append(toast);

  let timer = 0;
  const hide = () => { clearTimeout(timer); toast.classList.remove('is-visible'); setTimeout(() => toast.remove(), 450); };
  toast.querySelector('button').addEventListener('click', hide);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-visible')));
  timer = setTimeout(hide, SHOW_MS);
}
