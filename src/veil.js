// Moving between this site and the home page. The two are different origins, so the browser cannot
// carry one page into the other. They hand over on this page's sky: its contents fade before
// leaving, and arrive after the bare sky. The home page does the rest with the row that opens this
// site, whose plane grows into the sky and collapses out of it. The veil is the data-veil attribute
// on <html>; the stylesheet does the fading, and index.html sets and clears it on arrival.
//
// The title goes across too: this page's h1 is that row's title. Nothing on screen survives the
// change of origin, so the title's place goes in the address. The page being left keeps its title
// where it is, over the veil, and adds #title=x,y,size,weight to the address it opens, where x and
// y are where the title's ink starts on screen. The page arriving draws its own title there, in
// that size and weight, and moves it into place as its contents arrive; then the title itself takes
// over. A fragment is the one part of an address that neither server nor cache sees, and the page
// arriving takes it off the address at once. While the title is carried, data-carry is on <html>,
// the copies are drawn in #carried-title, and the h1 waits under them. Arriving here is done in
// index.html, before the first frame; the home page does both in its public/morph.js. Under reduced
// motion the title stays where it is.

const LEAVE_MS = 170;

export function leaveTo(href) {
  const root = document.documentElement;
  const to = sendTitle(href);
  root.dataset.veil = '';
  setTimeout(() => location.assign(to), LEAVE_MS);
  // If the visit is cancelled, the page comes back.
  setTimeout(() => {
    root.removeAttribute('data-veil');
    dropTitle();
  }, 3000);
}

// Returning with the browser's back button restores this page as it was left: veiled, its title
// held over the veil.
export function unveilOnReturn() {
  addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    document.documentElement.removeAttribute('data-veil');
    dropTitle();
  });
}

const TYPE = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-optical-sizing',
  'font-feature-settings', 'font-variation-settings', 'font-kerning', 'line-height', 'letter-spacing',
  'word-spacing', 'text-rendering', '-webkit-font-smoothing', 'color'];

function inkOf(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getClientRects();
}

// The address to open, with the title's place when the title can go: it is on one line and on
// screen. The title then stays where it is, drawn over the veil as the contents fade.
function sendTitle(href) {
  const title = document.querySelector('h1');
  if (!title || matchMedia('(prefers-reduced-motion: reduce)').matches) return href;
  const lines = inkOf(title);
  const ink = lines[0];
  if (lines.length !== 1 || ink.bottom <= 0 || ink.top >= innerHeight || ink.right <= 0 || ink.left >= innerWidth) return href;
  dropTitle();
  const style = getComputedStyle(title);
  const layer = document.createElement('div');
  layer.id = 'carried-title';
  layer.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span');
  copy.textContent = title.textContent;
  for (const property of TYPE) copy.style.setProperty(property, style.getPropertyValue(property));
  layer.append(copy);
  document.body.append(layer);
  // Its box on whole pixels and its letters set off inside it by the rest, as in index.html.
  const box = copy.getBoundingClientRect();
  const own = inkOf(copy)[0];
  const [x, y] = [ink.left - (own.left - box.left), ink.top - (own.top - box.top)];
  const [left, top] = [x, y].map((n) => Math.floor(n * devicePixelRatio) / devicePixelRatio);
  Object.assign(copy.style, { left: `${left}px`, top: `${top}px`, padding: `${y - top}px 0 0 ${x - left}px` });
  document.documentElement.dataset.carry = '';
  // The numbers go as they are: a place rounded by even a hundredth of a pixel can set the letters
  // on another fraction of a pixel there.
  const url = new URL(href);
  url.hash = `title=${ink.left},${ink.top},${parseFloat(style.fontSize)},${style.fontWeight}`;
  return url.href;
}

function dropTitle() {
  document.getElementById('carried-title')?.remove();
  document.documentElement.removeAttribute('data-carry');
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
