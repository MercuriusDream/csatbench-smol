// Everything the page says. The page and llms.txt are both written from here.
// The scores are in board.js, which the board generator writes from the graded results.
import { BOARD, FAMILIES, FULL, SUBJECTS, UPDATED } from './board.js';

export const MARK = 'CSAT-benchmark-smol';
export const HOME = 'https://mercuriusdream.com/';
export const REPO = 'https://github.com/MercuriusDream/csatbench-smol';
export const HARNESS = 'https://github.com/hehee9/CSAT-benchmark';

// Every sentence here holds for every row of the board.
export const LEDE = `Small open-weight language models take the 2026 Korean college entrance exam, the 수능. Totals out of ${FULL}.`;
export const WHY =
  'The defences proposed against AI in the exam hall work on the network: jamming, Wi-Fi shut off, radio detectors. A model of this size needs no network. Each one here fits in the memory of a laptop, and the smallest fit in a phone.';
export const HOW = `Each model answers every question in its own request. The answers are graded and totalled out of ${FULL} the way CSAT-benchmark does it.`;
export const SCALE = 'Korean, Math, English and Inquiry are out of 100, History out of 50.';

export const LINKS = [
  { name: 'Method', detail: 'GitHub', href: REPO },
  { name: 'CSAT-benchmark', detail: 'the harness', href: HARNESS },
];

export { BOARD, FAMILIES, FULL, SUBJECTS, UPDATED };

export const FRONTIER = 'The line is the best total at each size or under.';
export const SIZE_AXIS = 'Billions of parameters, as in each model\'s name';
// Sizes run from 1 to 32 billion, each line twice the one before.
export const SIZE_TICKS = [1, 2, 4, 8, 16, 32];
export const sizeAt = (size) => Math.log2(size) / Math.log2(SIZE_TICKS[SIZE_TICKS.length - 1]);

// The axis of each chart: the marks it is out of, and where its lines go.
export const TOTAL_TICKS = [0, 100, 200, 300, 400, 450];
export const ticks = (full) => (full === 50 ? [0, 10, 20, 30, 40, 50] : [0, 25, 50, 75, 100]);

// What is known of a row's build and its thinking setting, as words.
export const detail = (entry) => [entry.build, entry.mode].filter(Boolean).join(', ');

// A score as it is written: 97, 98.7.
export const points = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

// The page as plain Markdown, for readers that are not browsers.
export const llmsTxt = () =>
  [
    `# ${MARK}`,
    LEDE,
    [
      `| Model | Build | ${SUBJECTS.map((subject) => `${subject.name} (${subject.full})`).join(' | ')} | Total (${FULL}) |`,
      `| --- | --- | ${SUBJECTS.map(() => '---:').join(' | ')} | ---: |`,
      ...BOARD.map((entry) => `| ${entry.name} | ${detail(entry)} | ${entry.subjects.map(points).join(' | ')} | ${points(entry.total)} |`),
    ].join('\n'),
    `Updated ${UPDATED}.`,
    WHY,
    HOW,
    ...LINKS.map((link) => `[${link.name}](${link.href})`),
    `[@mercuriusdream](${HOME})`,
  ].join('\n\n') + '\n';
