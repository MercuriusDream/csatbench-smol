// Moving between this site and the home page. The two are different origins, so the browser cannot
// carry one page into the other. They hand over on this page's sky: its contents fade before
// leaving, and arrive after the bare sky. The home page does the rest with the row that opens this
// site, whose plane grows into the sky and collapses out of it. The veil is the data-veil attribute
// on <html>; the stylesheet does the fading, and index.html sets and clears it on arrival.

const LEAVE_MS = 170;

export function leaveTo(href) {
  const root = document.documentElement;
  root.dataset.veil = '';
  setTimeout(() => location.assign(href), LEAVE_MS);
  // If the visit is cancelled, the page comes back.
  setTimeout(() => root.removeAttribute('data-veil'), 3000);
}

// Returning with the browser's back button restores this page as it was left: veiled.
export function unveilOnReturn() {
  addEventListener('pageshow', (event) => {
    if (event.persisted) document.documentElement.removeAttribute('data-veil');
  });
}

// Ahead of the press. Between the sky this page leaves and the home page's first frame there is
// nothing to look at, and whatever the home page still has to fetch is spent there. So it is
// fetched before: the page, and what its first frame waits for, which is its stylesheets, its
// scripts, and what it preloads. Once when this page has loaded, and again when the pointer or the
// focus reaches a link there, because what was fetched goes stale in minutes.
// The home page does the same for this site, in its public/morph.js.
const FIRST_FRAME = 'link[rel~="stylesheet"][href], link[rel~="preload"][href], link[rel~="modulepreload"][href], script[src]';
const AGAIN_AFTER = 5000;

export function readyAhead(href) {
  let readied = -Infinity;

  async function ready() {
    if (navigator.connection?.saveData || Date.now() - readied < AGAIN_AFTER) return;
    readied = Date.now();
    try {
      const response = await fetch(href);
      if (!response.ok) return;
      const markup = new DOMParser().parseFromString(await response.text(), 'text/html');
      for (const el of markup.querySelectorAll(FIRST_FRAME)) {
        if (el.media && !matchMedia(el.media).matches) continue;
        const url = new URL(el.getAttribute('href') ?? el.getAttribute('src'), response.url);
        fetch(url, { mode: 'no-cors' }).catch(() => {});
      }
    } catch {}
  }

  const whenIdle = () => (window.requestIdleCallback ?? setTimeout)(ready);
  if (document.readyState === 'complete') whenIdle();
  else addEventListener('load', whenIdle, { once: true });

  const nearing = (event) => {
    if (event.target.closest?.('a[href]')?.href === href) ready();
  };
  addEventListener('pointerover', nearing, { passive: true });
  addEventListener('focusin', nearing);

  // The browser's back button restores this page with what it had fetched, however long ago.
  addEventListener('pageshow', (event) => {
    if (event.persisted) whenIdle();
  });
}
