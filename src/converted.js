import { ADMISSION_MODELS } from './admissions.js';
import { BOARD, points } from './content.js';

// Admission records distinguish runs by build and thinking mode.
const names = {
  'LFM3 1.7B': 'LFM3 1.7B (MLX 8bit)',
  'LFM3-VL 2B': 'LFM3 VL 2B',
  'Nanbeige4.2 3B': 'Nanbeige4.2 3B (FP8)',
  'Qwen3.5 2B': 'Qwen3.5 2B (Thinking)',
};

// Megastudy, 2026 정시 최종지원전략 설명회, p. 17, 국수탐(2).
// Each pair is a standard-score sum and its estimated upper-tail percentage.
const cutoffs = [
  [410, 0.1], [406, 0.2], [398, 0.6], [393, 1], [389, 1.7], [387, 2.1],
  [382, 3.1], [378, 4.3], [376, 5], [373, 6.3], [372, 7], [369, 8.5],
  [367, 9.4], [366, 10], [364, 11], [362, 12], [360, 13.5], [358, 15],
  [356, 16.5], [355, 17.2], [353, 18.7], [351, 19.8], [349, 22.1],
  [345, 25.3], [342, 27.2], [339, 30.2], [336, 33.1], [332, 36.5],
  [329, 40.1], [325, 44],
];

function rankBand(score) {
  const i = cutoffs.findIndex(([cut]) => score >= cut);
  if (i < 0) return [44, 100];
  const [cut, percent] = cutoffs[i];
  if (score === cut) return [percent, percent];
  return [i ? cutoffs[i - 1][1] : 0, percent];
}

function converted(entry, off, metric) {
  const key = entry.off && !off ? entry.name + ' (high)' : names[entry.name] ?? entry.name;
  const model = ADMISSION_MODELS[key];
  if (!model) return [];
  const profile = model.profiles.natural;
  const subjects = { ...model.korean, ...model.math, ...model.inquiry };
  const total = [0, 1].map(i => profile.combination.reduce((sum, id) => sum + subjects[id].standard[i], 0));
  let [low, high] = metric === 'mean' ? profile.percentile : total;
  if (metric === 'cumulative') {
    low = rankBand(total[1])[0];
    high = rankBand(total[0])[1];
  }
  let label = low === high ? points(low) : `${points(low)}–${points(high)}`;
  if (metric === 'cumulative') {
    if (low === 44 && total[1] < 325) label = '>44';
    if (high === 0.1 && total[0] > 410) label = '<0.1';
    label += '%';
  }
  return [{ name: entry.name, family: entry.family, off, low, high, label }];
}

export function convertedRows(metric) {
  const rows = BOARD.flatMap(entry => [
    ...converted(entry, false, metric),
    ...(entry.off ? converted(entry, true, metric) : []),
  ]);
  return rows.sort((a, b) => metric === 'cumulative'
    ? a.low - b.low || a.high - b.high
    : b.low - a.low || b.high - a.high);
}

// One run's converted score for a metric: { low, high, label }, or null where the run has none.
// A range means the published conversions do not pin the value down; it is never averaged.
export function metricOf(entry, off, metric) {
  if (metric === 'raw') {
    const total = off ? entry.off?.total : entry.total;
    return Number.isFinite(total) ? { low: total, high: total, label: points(total) } : null;
  }
  return converted(entry, off, metric)[0] ?? null;
}

// Every metric for one model, its own run and its thinking-off run, for the hover card.
export const METRICS = ['raw', 'standard', 'mean', 'cumulative'];
export function card(entry) {
  return METRICS.map((metric) => ({ metric, own: metricOf(entry, false, metric), off: entry.off ? metricOf(entry, true, metric) : null }));
}
