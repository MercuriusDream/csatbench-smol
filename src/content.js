// Everything the page says. The page and llms.txt are both written from here.
// The scores are in board.js, which the board generator writes from the graded results.
import { BOARD, FAMILIES, FULL, OFF, SUBJECTS, UPDATED } from './board.js';

export const MARK = 'CSAT-benchmark-smol';
export const HOME = 'https://mercuriusdream.com/';
export const REPO = 'https://github.com/MercuriusDream/csatbench-smol';
export const HARNESS = 'https://github.com/hehee9/CSAT-benchmark';

// Every sentence here holds for every row of the board.
export const LEDE = `Small open-weight language models take the 2026 Korean college entrance exam, the 수능. Totals out of ${FULL}.`;
export const WHY =
  'The defences proposed against AI in the exam hall work on the network: jamming, Wi-Fi shut off, radio detectors. A model of this size needs no network. Each one here fits in the memory of a laptop, and the smallest fit in a phone.';
export const HOW = `Each model answers every question in its own request. The answers are graded and totalled out of ${FULL} the way CSAT-benchmark does it.`;
export const SCALE = 'Korean, Math, English and Inquiry are out of 100, History out of 50. GB is the size of the weights.';
export const FRONTIER = 'The line is the best total at each size or under.';
export const SIZE_AXIS = 'Size of the weights, GB. Under a size: devices with that much memory.';

// Sizes run from 1 to 32 GB, each octave the same width. A line stands at each size a device below has.
export const SIZE_TICKS = [1, 2, 4, 6, 8, 12, 16, 24, 32];
export const sizeAt = (gb) => Math.log2(gb) / Math.log2(SIZE_TICKS[SIZE_TICKS.length - 1]);

// What has that much memory: a phone's or a watch's, and a graphics card's own.
export const DEVICES = [
  { name: 'Galaxy Watch8', gb: 2 },
  { name: 'iPhone 15', gb: 6 },
  { name: 'iPhone 16 Pro', gb: 8 },
  { name: 'RTX 5060', gb: 8 },
  { name: 'Galaxy S26', gb: 12 },
  { name: 'RTX 5070', gb: 12 },
  { name: 'RTX 5080', gb: 16 },
  { name: 'RTX 4090', gb: 24 },
  { name: 'RTX 5090', gb: 32 },
];

export const LINKS = [
  { name: 'Method', detail: 'GitHub', href: REPO },
  { name: 'CSAT-benchmark', detail: 'the harness', href: HARNESS },
];

export { BOARD, FAMILIES, FULL, OFF, SUBJECTS, UPDATED };

// The axis of each chart: the marks it is out of, and where its lines go.
export const TOTAL_TICKS = [0, 100, 200, 300, 400, 450];
export const ticks = (full) => (full === 50 ? [0, 10, 20, 30, 40, 50] : [0, 25, 50, 75, 100]);

// The table's rows: each model, and under it its scores with thinking off where it has them.
export const ROWS = BOARD.flatMap((entry) => (entry.off ? [{ ...entry, mode: '' }, { ...entry, ...entry.off, mode: OFF }] : [{ ...entry, mode: '' }]));

// What is known of a row's build and its thinking setting, as words.
export const detail = (row) => [row.build, row.mode].filter(Boolean).join(', ');

// A score as it is written: 97, 98.7. A size as it is written: 7.16, 8.6.
export const points = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
export const size = (gb) => String(Number(gb.toFixed(2)));

// The page as plain Markdown, for readers that are not browsers.
export const llmsTxt = () =>
  [
    `# ${MARK}`,
    LEDE,
    [
      `| Model | Build | Weights (GB) | ${SUBJECTS.map((subject) => `${subject.name} (${subject.full})`).join(' | ')} | Total (${FULL}) |`,
      `| --- | --- | ---: | ${SUBJECTS.map(() => '---:').join(' | ')} | ---: |`,
      ...ROWS.map((row) => `| ${row.name} | ${detail(row)} | ${size(row.gb)} | ${row.subjects.map(points).join(' | ')} | ${points(row.total)} |`),
    ].join('\n'),
    `Updated ${UPDATED}.`,
    `Memory, for scale: ${DEVICES.map((device) => `${device.name} ${device.gb} GB`).join(', ')}.`,
    WHY,
    HOW,
    ...LINKS.map((link) => `[${link.name}](${link.href})`),
    `[@mercuriusdream](${HOME})`,
  ].join('\n\n') + '\n';
