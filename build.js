// Builds the site into dist/ with Bun's bundler, then writes the page's markup into the HTML
// so it reads without scripts and paints before they load.
import { cp, rm } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App.jsx';
import { llmsTxt } from './src/content.js';

const outdir = './dist';
await rm(outdir, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ['./index.html'],
  outdir,
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const page = Bun.file(`${outdir}/index.html`);
const html = await page.text();
const empty = '<div id="root"></div>';
if (!html.includes(empty)) throw new Error('index.html has no empty #root to fill.');
await Bun.write(page, html.replace(empty, `<div id="root">${renderToString(createElement(App))}</div>`));

// Files served as they are, and the page as Markdown.
await cp('./public', outdir, { recursive: true });
await Bun.write(`${outdir}/llms.txt`, llmsTxt());

for (const output of result.outputs) console.log(`${(output.size / 1024).toFixed(1).padStart(7)} kB  ${output.path.replace(`${process.cwd()}/`, '')}`);
