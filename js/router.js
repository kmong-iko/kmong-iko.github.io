// Tiny hash router for the three pages (Home and Contact share the same character scene; Workfolio is separate). The header and footer never re-render, so their colours
// can transition smoothly while the content swaps (display is driven by html[data-page] in CSS).

const PAGES = {
  home: { title: 'kae's tambayan' },
  workfolio: { title: 'kae's workfolio' },
  contact: { title: 'kae's contact' },
};

const root = document.documentElement;
const pageFromHash = () => (location.hash === '#workfolio' ? 'workfolio' : location.hash === '#contact' ? 'contact' : 'home');

export function initRouter() {
  const links = [...document.querySelectorAll('[data-route]')];

  const show = (page, { scroll }) => {
    root.dataset.page = page;
    document.title = PAGES[page].title;
    links.forEach((link) => {
      if (link.dataset.route === page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (scroll) window.scrollTo(0, 0);
    // The character slides sideways between Home and Contact: keep eye tracking & cup bounds in step while it moves.
    if (previous !== page && (previous === 'contact' || page === 'contact') && previous !== null) {
      const until = performance.now() + 1400;
      const follow = () => { dispatchEvent(new Event('scroll')); if (performance.now() < until) requestAnimationFrame(follow); };
      requestAnimationFrame(follow);
    }
    previous = page;
  };
  let previous = null;

  addEventListener('hashchange', () => show(pageFromHash(), { scroll: true }));
  show(pageFromHash(), { scroll: false });
}
