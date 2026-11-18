import { ADMISSION_ENTRIES, ADMISSION_MODELS } from './admissions.js';
import { points } from './content.js';

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

const keyOf = (entry, off) => (entry.off && !off ? entry.name + ' (high)' : names[entry.name] ?? entry.name);

// The basis every score on the page is counted on, chosen once for every model.
//   metric   raw (CSAT-benchmark's 450-point scale), standard, mean (percentile), cumulative (top %)
//   profile  natural: 미적분 or 기하 and two 과탐 subjects; humanities: any 수학 and two 탐구
//            subjects, at least one of them 사탐
//   korean   mean (of both electives, as the 450-point scale counts it), an elective, or best
//   math     mean (of all three), an elective, or best
//   inquiry  four (twice the mean of 물리학Ⅰ, 화학Ⅰ, 생명과학Ⅰ and 사회·문화, as the 450-point
//            scale counts it), best (the two highest), or pick (the two in `pick`)
// "best" is each model's own: its highest raw score on the 450-point scale, its highest
// percentile in the converted scores.
export const KOREAN = ['korean-speech', 'korean-language'];
export const MATH = ['math-probability', 'math-calculus', 'math-geometry'];
export const SCIENCE = ['physics1', 'chemistry1', 'biology1', 'earth1', 'physics2', 'chemistry2', 'biology2', 'earth2'];
export const SOCIAL = ['ethics-life', 'ethics-thought', 'geography-korea', 'geography-world', 'history-eastasia',
  'history-world', 'economics', 'politics-law', 'socioculture'];
export const PICKS = { natural: ['chemistry1', 'biology1'], humanities: ['socioculture', 'ethics-life'] };
export const BASIS = { metric: 'raw', profile: 'natural', korean: 'mean', math: 'mean', inquiry: 'four', pick: PICKS.natural };
export const METRICS = ['raw', 'standard', 'mean', 'cumulative'];

export const mathsFor = (profile) => (profile === 'natural' ? MATH.slice(1) : MATH);
export const firstsFor = (profile) => (profile === 'natural' ? SCIENCE : SOCIAL);
export const secondsFor = (profile) => (profile === 'natural' ? SCIENCE : [...SCIENCE, ...SOCIAL]);
const pairsFor = (profile, has) => {
  const pool = secondsFor(profile).filter(has);
  const pairs = [];
  pool.forEach((a, i) => pool.slice(i + 1).forEach((b) => {
    if (profile === 'natural' || SOCIAL.includes(a) || SOCIAL.includes(b)) pairs.push([a, b]);
  }));
  return pairs;
};

// A basis after a change: 누백 exists for the science profile only, an elective or a subject the
// profile does not allow gives way, and the two chosen subjects stay two different allowed ones.
export function fit(before, after) {
  const b = { ...after };
  if (b.metric === 'cumulative' && b.profile !== 'natural') {
    if (before.profile !== b.profile) b.metric = 'mean';
    else b.profile = 'natural';
  }
  if (!mathsFor(b.profile).includes(b.math) && b.math !== 'mean' && b.math !== 'best') b.math = 'best';
  const [first, second] = b.pick;
  if (!firstsFor(b.profile).includes(first)) b.pick = PICKS[b.profile];
  else if (first === second || !secondsFor(b.profile).includes(second)) {
    b.pick = [first, secondsFor(b.profile).find((id) => id !== first)];
  }
  return b;
}

// The basis as one metric counts it. Converted scores are made of one elective and two subjects,
// so the averages, which only the 450-point scale has, are each model's best there.
export function effectiveFor(basis, metric) {
  if (metric === 'raw') return basis;
  return {
    ...basis,
    korean: basis.korean === 'mean' ? 'best' : basis.korean,
    math: basis.math === 'mean' ? 'best' : basis.math,
    inquiry: basis.inquiry === 'four' ? 'best' : basis.inquiry,
  };
}

const round = (value) => Math.round(value * 10) / 10;
const scoresOf = (entry, off) => (off ? entry.off : entry);
const highest = (ids, value) => ids.reduce((best, id) => (best === null || value(id) > value(best) ? id : best), null);

// One run's 450-point total on a basis, with its five parts and the papers it was made of; null
// where the run has not sat a paper the basis needs. The averages are the board's own numbers.
export function rawOf(scores, basis) {
  if (!scores) return null;
  const papers = scores.papers || {};
  const has = (id) => Number.isFinite(papers[id]);
  const part = (index, common, electives, choice) => {
    if (choice === 'mean') return [scores.subjects[index], 'mean'];
    const id = choice === 'best' ? highest(electives.filter(has), (each) => papers[each]) : choice;
    return id && has(id) && has(common) ? [papers[common] + papers[id], id] : [null, id];
  };
  const [korean, k] = part(0, 'korean-common', KOREAN, basis.korean);
  const [math, m] = part(1, 'math-common', mathsFor(basis.profile), basis.math);
  let inquiry; let pair;
  if (basis.inquiry === 'four') {
    inquiry = scores.subjects[4]; pair = 'four';
  } else {
    pair = basis.inquiry === 'pick' ? basis.pick
      : pairsFor(basis.profile, has).reduce((best, each) => (!best || papers[each[0]] + papers[each[1]] > papers[best[0]] + papers[best[1]] ? each : best), null);
    inquiry = pair && pair.every(has) ? papers[pair[0]] + papers[pair[1]] : null;
  }
  const parts = [korean, math, scores.subjects[2], scores.subjects[3], inquiry];
  if (parts.some((p) => !Number.isFinite(p))) return null;
  const plain = basis.korean === 'mean' && basis.math === 'mean' && basis.inquiry === 'four';
  return { parts: parts.map(round), total: plain ? scores.total : round(parts.reduce((a, b) => a + b, 0)), used: { korean: k, math: m, inquiry: pair } };
}

// One run's converted scores on a basis: the four papers they are made of (국어 elective, 수학
// elective, two 탐구 subjects), the standard-score sum and the mean percentile, each as a range
// where the published conversions do not pin it down. Null where a paper has no conversion.
function convertedOf(entry, off, basis) {
  const model = ADMISSION_MODELS[keyOf(entry, off)];
  if (!model) return null;
  const subjects = { ...model.korean, ...model.math, ...model.inquiry };
  const has = (id) => Boolean(subjects[id]);
  const above = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
  let combination;
  const profile = model.profiles[basis.profile];
  if (basis.korean === 'best' && basis.math === 'best' && basis.inquiry === 'best' && profile) {
    combination = profile.combination;
  } else {
    const best = (ids) => ids.filter(has).reduce((top, id) => (!top || above(subjects[id].percentile, subjects[top].percentile) ? id : top), null);
    const pairMean = ([a, b]) => [0, 1].map((i) => (subjects[a].percentile[i] + subjects[b].percentile[i]) / 2);
    const k = basis.korean === 'best' ? best(KOREAN) : basis.korean;
    const m = basis.math === 'best' ? best(mathsFor(basis.profile)) : basis.math;
    const pair = basis.inquiry === 'pick' ? basis.pick
      : pairsFor(basis.profile, has).reduce((top, each) => (!top || above(pairMean(each), pairMean(top)) ? each : top), null);
    if (!pair) return null;
    combination = [k, m, ...pair];
  }
  if (combination.some((id) => !id || !has(id))) return null;
  const [k, m, a, b] = combination;
  const standard = [0, 1].map((i) => combination.reduce((sum, id) => sum + subjects[id].standard[i], 0));
  const per = (id, i) => subjects[id].percentile[i];
  const mean = [0, 1].map((i) => (per(k, i) + per(m, i) + (per(a, i) + per(b, i)) / 2) / 3);
  return { combination, standard, mean };
}

// One run's score in a metric on a basis: { low, high, label }, or null where the run has none.
// A range means the published conversions do not pin the value down; it is never averaged. The
// rank table is for the science profile (국수탐(2) with two 과탐 subjects); the humanities
// profile has no 누백 here rather than one borrowed from it.
export function metricOf(entry, off, metric, basis = BASIS) {
  const b = effectiveFor(basis, metric);
  if (metric === 'raw') {
    const raw = rawOf(scoresOf(entry, off), b);
    return raw ? { low: raw.total, high: raw.total, label: points(raw.total) } : null;
  }
  if (metric === 'cumulative' && b.profile !== 'natural') return null;
  const c = convertedOf(entry, off, b);
  if (!c) return null;
  let [low, high] = metric === 'mean' ? c.mean : c.standard;
  if (metric === 'cumulative') {
    low = rankBand(c.standard[1])[0];
    high = rankBand(c.standard[0])[1];
  }
  let label = low === high ? points(low) : `${points(low)}–${points(high)}`;
  if (metric === 'cumulative') {
    if (low === 44 && c.standard[1] < 325) label = '>44';
    if (high === 0.1 && c.standard[0] > 410) label = '<0.1';
    label += '%';
  }
  return { low, high, label };
}

// The papers a run's score in the basis's own metric is made of: { korean, math, inquiry }, where
// korean and math are an elective or 'mean' and inquiry is two subjects or 'four'.
export function usedOf(entry, off, basis) {
  const b = effectiveFor(basis, basis.metric);
  if (basis.metric === 'raw') return rawOf(scoresOf(entry, off), b)?.used ?? null;
  const c = convertedOf(entry, off, b);
  return c ? { korean: c.combination[0], math: c.combination[1], inquiry: c.combination.slice(2) } : null;
}

// A view of the 450-point chart that the basis changes: the total and the subjects it is made of.
const PART = { korean: 0, math: 1, english: 2, history: 3, inquiry: 4 };
export function rawPick(id, basis) {
  if (id !== 'total' && !(id in PART)) return null;
  return (scores) => {
    const raw = rawOf(scores, basis);
    return raw ? (id === 'total' ? raw.total : raw.parts[PART[id]]) : null;
  };
}

// Every metric for one run, on the basis, for the hover card.
export function card(entry, basis = BASIS) {
  return METRICS.map((metric) => ({ metric, own: metricOf(entry, false, metric, basis), off: entry.off ? metricOf(entry, true, metric, basis) : null }));
}

// The highest 2026 어디가 70% lines a run's mean percentile on the basis is at or above, for its
// profile: one unit per university, highest first. A comparison of means, not an admission.
const rhu = (value) => Math.floor(value + 0.5);
export function feasible(entry, off, basis = BASIS, n = 3) {
  const c = convertedOf(entry, off, effectiveFor(basis, 'mean'));
  if (!c) return [];
  const seen = new Set();
  return ADMISSION_ENTRIES
    .filter((line) => line[basis.profile] && rhu(c.mean[0]) >= line.value)
    .sort((a, b) => b.value - a.value || a.university.localeCompare(b.university))
    .filter((line) => !seen.has(line.university) && seen.add(line.university))
    .slice(0, n);
}
