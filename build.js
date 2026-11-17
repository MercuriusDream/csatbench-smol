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
// Hangul only, and from another site, as on the home page: it loads as a print sheet, so the first
// frame does not wait for it.
const hangul =
  '<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'" />';
// The rules for the chart's morph go into the head as they are: see src/morph.css.
const morph = (await Bun.file('./src/morph.css').text()).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
if (!html.includes('</head>')) throw new Error('index.html has no </head> to write the morph rules before.');
await Bun.write(
  page,
  html.replace('</head>', `${hangul}<style>${morph}</style></head>`).replace(empty, `<div id="root">${renderToString(createElement(App))}</div>`),
);

// Files served as they are, and the page as Markdown.
await cp('./public', outdir, { recursive: true });
await Bun.write(`${outdir}/llms.txt`, llmsTxt());

for (const output of result.outputs) console.log(`${(output.size / 1024).toFixed(1).padStart(7)} kB  ${output.path.replace(`${process.cwd()}/`, '')}`);
