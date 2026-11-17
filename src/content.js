// Everything the page says, in each language it says it in. The page and llms.txt are written from here.
// The scores are in board.js, which the board generator writes from the graded results.
import { BOARD, FAMILIES, FULL, PAPERS, SUBJECTS, UPDATED } from './board.js';

export const MARK = 'CSAT-benchmark-smol';
export const HOME = 'https://mercuriusdream.com/';
export const REPO = 'https://github.com/MercuriusDream/csatbench-smol';
export const HARNESS = 'https://github.com/hehee9/CSAT-benchmark';

// The build that many rows share is written once, under the table, and marked on its rows.
export const STARRED = 'QAT 4-bit';

// Every sentence here holds for every row of the board. The two languages say the same things.
export const TEXT = {
  en: {
    title: MARK,
    lede: `Small open-weight language models take the 2026 Korean college entrance exam, the 수능. Totals out of ${FULL}.`,
    total: 'Total',
    subjects: ['Korean', 'Math', 'English', 'History', 'Inquiry'],
    views: {
      total: 'Total', korean: 'Korean', math: 'Math', english: 'English', history: 'History', inquiry: 'Inquiry', all: 'All',
      'korean-common': 'Common', 'korean-speech': 'Speech and Writing', 'korean-language': 'Language and Media',
      'math-common': 'Common', 'math-probability': 'Probability and Statistics', 'math-calculus': 'Calculus', 'math-geometry': 'Geometry',
      science: 'Science', humanities: 'Humanities',
      physics1: 'Physics I', chemistry1: 'Chemistry I', biology1: 'Life Science I', socioculture: 'Society and Culture',
    },
    partsOf: (name) => `Part of ${name} shown`,
    outOf: (full) => `out of ${full}`,
    off: '(w/o Thinking)',
    byGb: 'Total by GB',
    frontier: 'The line is the best total at each size or under.',
    sizeAxis: 'Size of the weights, GB. Under a size: devices with that much memory.',
    allScores: 'All scores',
    model: 'Model',
    scale: 'Korean, Math, English and Inquiry are out of 100, History out of 50. GB is the size of the weights.',
    starred: `* ${STARRED}.`,
    updated: (date) => `Updated ${date}.`,
    whyTitle: 'Why',
    why: 'The defences proposed against AI in the exam hall work on the network: jamming, Wi-Fi shut off, radio detectors. A model of this size needs no network. Each one here fits in the memory of a laptop, and the smallest fit in a phone.',
    howTitle: 'How',
    how: `Each model answers every question in its own request. The answers are graded and totalled out of ${FULL} the way CSAT-benchmark does it.`,
    method: ['Method', 'GitHub'],
    harness: ['CSAT-benchmark', 'the harness'],
    other: '한국어',
    // Said, not shown.
    skip: 'Skip to content',
    back: 'Back to home',
    scores: 'Scores',
    scoreShown: 'Score shown',
    families: 'Model families',
    sideways: (name) => `${name} chart. It moves sideways.`,
    sizes: 'Sizes in GB, and devices with that much memory',
    switchTo: 'Read this page in Korean',
  },
  ko: {
    title: `${MARK}: 작은 모델의 수능 점수`,
    lede: `작은 오픈 웨이트 언어 모델이 2026학년도 수능을 풉니다. 총점은 ${FULL}점 만점입니다.`,
    total: '총점',
    subjects: ['국어', '수학', '영어', '한국사', '탐구'],
    views: {
      total: '총점', korean: '국어', math: '수학', english: '영어', history: '한국사', inquiry: '탐구', all: '전체',
      'korean-common': '공통', 'korean-speech': '화법과 작문', 'korean-language': '언어와 매체',
      'math-common': '공통', 'math-probability': '확률과 통계', 'math-calculus': '미적분', 'math-geometry': '기하',
      science: '과학탐구', humanities: '사회탐구',
      physics1: '물리학Ⅰ', chemistry1: '화학Ⅰ', biology1: '생명과학Ⅰ', socioculture: '사회·문화',
    },
    partsOf: (name) => `${name}에서 표시할 부분`,
    outOf: (full) => `${full}점 만점`,
    off: '(Thinking 끔)',
    byGb: '용량별 총점',
    frontier: '선은 각 용량 이하에서 가장 높은 총점입니다.',
    sizeAxis: '가중치 크기(GB). 크기 아래에는 그만큼의 메모리를 가진 기기를 적었습니다.',
    allScores: '전체 점수',
    model: '모델',
    scale: '국어·수학·영어·탐구는 100점, 한국사는 50점 만점입니다. GB는 가중치 크기입니다.',
    starred: `* ${STARRED}.`,
    updated: (date) => `${date} 갱신.`,
    whyTitle: '이유',
    why: '시험장의 AI 부정행위 대책으로 나온 것들은 네트워크를 막습니다. 전파 방해, 와이파이 차단, 전파탐지기가 그렇습니다. 이 크기의 모델은 네트워크가 필요 없습니다. 여기 있는 모델은 모두 노트북 메모리에 들어가고, 가장 작은 것들은 휴대전화에 들어갑니다.',
    howTitle: '방법',
    how: `모델은 문항마다 따로 요청을 받아 답합니다. 채점과 ${FULL}점 만점 합산은 CSAT-benchmark의 방식 그대로입니다.`,
    method: ['방법', 'GitHub'],
    harness: ['CSAT-benchmark', '평가 도구'],
    other: 'English',
    skip: '본문으로 건너뛰기',
    back: '홈으로',
    scores: '점수',
    scoreShown: '표시할 점수',
    families: '모델 계열',
    sideways: (name) => `${name} 그래프. 옆으로 움직입니다.`,
    sizes: 'GB 단위 크기와 그만큼의 메모리를 가진 기기',
    switchTo: '이 페이지를 영어로 읽기',
  },
};
export const LOCALES = Object.keys(TEXT);

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
  { key: 'method', href: REPO },
  { key: 'harness', href: HARNESS },
];

export { BOARD, FAMILIES, FULL, PAPERS, SUBJECTS, UPDATED };

// The lines across a chart: round marks up to the full marks, and the full marks themselves.
export function ticks(full) {
  const step = [5, 10, 20, 25, 50, 100].find((size) => full / size <= 5);
  const lines = [];
  for (let mark = 0; mark < full - step * 0.4; mark += step) lines.push(mark);
  return [...lines, full];
}

// What the chart can show, as a tree. A subject unfolds into its papers: 국어 and 수학 into the
// common part and each elective, 탐구 into science and humanities and each of those into its
// papers. A view's score is picked out of a model's scores: `subjects` holds the five the total is
// made of, `papers` every paper's own. A group of papers shows their mean, out of one paper's marks.
const paper = (id) => ({ id, full: PAPERS[id], pick: (scores) => scores.papers[id] });
const group = (id, ids) => {
  const sat = ids.filter((each) => each in PAPERS);
  return {
    id,
    full: PAPERS[sat[0]],
    pick: (scores) => Math.round((sat.reduce((sum, each) => sum + scores.papers[each], 0) / sat.length) * 10) / 10,
    children: sat.map(paper),
  };
};
export const TREE = [
  { id: 'total', full: FULL, pick: (scores) => scores.total },
  { id: 'korean', full: SUBJECTS[0].full, pick: (scores) => scores.subjects[0], children: ['korean-common', 'korean-speech', 'korean-language'].map(paper) },
  { id: 'math', full: SUBJECTS[1].full, pick: (scores) => scores.subjects[1], children: ['math-common', 'math-probability', 'math-calculus', 'math-geometry'].map(paper) },
  { id: 'english', full: SUBJECTS[2].full, pick: (scores) => scores.subjects[2] },
  { id: 'history', full: SUBJECTS[3].full, pick: (scores) => scores.subjects[3] },
  {
    id: 'inquiry',
    full: SUBJECTS[4].full,
    pick: (scores) => scores.subjects[4],
    children: [group('science', ['physics1', 'chemistry1', 'biology1']), group('humanities', ['socioculture'])],
  },
];

// The table's rows: each model, and under it its scores with thinking off where it has them.
export const ROWS = BOARD.flatMap((entry) => (entry.off ? [{ ...entry, off: false }, { ...entry, ...entry.off, off: true }] : [{ ...entry, off: false }]));

// A score as it is written: 97, 98.7. A size as it is written: 7.16, 8.6.
export const points = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
export const size = (gb) => String(Number(gb.toFixed(2)));

// The page as plain Markdown, for readers that are not browsers.
export const llmsTxt = () => {
  const t = TEXT.en;
  return (
    [
      `# ${MARK}`,
      t.lede,
      [
        `| Model | Build | Weights (GB) | ${SUBJECTS.map((subject, index) => `${t.subjects[index]} (${subject.full})`).join(' | ')} | Total (${FULL}) |`,
        `| --- | --- | ---: | ${SUBJECTS.map(() => '---:').join(' | ')} | ---: |`,
        ...ROWS.map(
          (row) =>
            `| ${row.name}${row.off ? ` ${t.off}` : ''} | ${row.build} | ${size(row.gb)} | ${row.subjects.map(points).join(' | ')} | ${points(row.total)} |`,
        ),
      ].join('\n'),
      t.updated(UPDATED),
      `Memory, for scale: ${DEVICES.map((device) => `${device.name} ${device.gb} GB`).join(', ')}.`,
      t.why,
      t.how,
      ...LINKS.map((link) => `[${t[link.key][0]}](${link.href})`),
      `[@mercuriusdream](${HOME})`,
    ].join('\n\n') + '\n'
  );
};
