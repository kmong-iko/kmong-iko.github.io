// Tiny hash router for the two pages. The header and footer never re-render, so their colours
// can transition smoothly while the content swaps (display is driven by html[data-page] in CSS).

const PAGES = {
  home: { title: 'Kae — UI/UX Designer, Illustrator, Developer' },
  workfolio: { title: 'Workfolio — Kae' },
};

const root = document.documentElement;
const pageFromHash = () => (location.hash === '#workfolio' ? 'workfolio' : 'home');

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
  };

  addEventListener('hashchange', () => show(pageFromHash(), { scroll: true }));
  show(pageFromHash(), { scroll: false });
}
