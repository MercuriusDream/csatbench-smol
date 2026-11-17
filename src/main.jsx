import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import { HOME } from './content.js';
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
