import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import { HOME } from './content.js';
import { loadLines } from './converted.js';
import { readyAhead, unveilOnReturn } from './veil.js';

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The build writes the page's markup into the HTML, so it reads without scripts.
// The dev server serves an empty root.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

unveilOnReturn();
readyAhead(HOME);

// The admission lines, fetched apart (see build.js) once the page has loaded and is idle, so they
// are here before the hover card or the admissions panel is opened.
const fetchLines = () => (window.requestIdleCallback ?? setTimeout)(() => loadLines().catch(() => {}));
if (document.readyState === 'complete') fetchLines();
else addEventListener('load', fetchLines, { once: true });
