import {
  BOARD, FAMILIES, FRONTIER, FULL, HOME, HOW, LEDE, LINKS, MARK, SCALE, SIZE_AXIS, SIZE_TICKS, SUBJECTS, TOTAL_TICKS, UPDATED, WHY,
  detail, points, sizeAt, ticks,
} from './content.js';
import { place, steps } from './field.js';
import { leaveTo } from './veil.js';

// The home page's arrow, as on its project rows.
function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 12 12 4M5 4h7v7" />
    </svg>
  );
}

// A plain press on the way home fades this page onto the home page's plane first.
function goHome(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  leaveTo(HOME);
}

// A family's colour. The name beside each mark says which model it is; the colour says its family.
const series = (family) => ({ '--series': `var(--series-${family})` });

// One chart: models along the bottom, marks up the side, a bar for each model with its score on
// top. On a narrow screen the same list is set as rows, each bar under its name.
// `longest` is the longest label, in letters: the room the slanted names need under the bars.
function Chart({ id, heading: Heading, title, full, lines, entries, tall }) {
  const longest = Math.max(...entries.map((entry) => Math.max(entry.name.length, entry.mode.length)));
  return (
    <figure className={tall ? 'chart tall' : 'chart'} aria-labelledby={id}>
      <figcaption className="chart-title">
        <Heading id={id}>{title}</Heading> <span className="chart-full">out of {full}</span>
      </figcaption>
      <div className="plot" style={{ '--count': entries.length, '--longest': longest }}>
        <div className="scale" aria-hidden="true">
          {lines.map((line) => (
            <span className="tick" key={line} style={{ '--at': line / full }}>
              <span className="tick-label">{line}</span>
            </span>
          ))}
        </div>
        <ol className="bars">
          {entries.map((entry) => (
            <li className={entry.mode ? 'bar off' : 'bar'} key={`${entry.name} ${entry.mode}`} style={{ ...series(entry.family), '--share': entry.value / full }}>
              <span className="bar-model">
                <span className="bar-name">{entry.name}</span>
                {entry.mode && ' '}
                {entry.mode && <span className="bar-mode">{entry.mode}</span>}
              </span>
              <span className="bar-value">{points(entry.value)}</span>
              <span className="bar-track" aria-hidden="true">
                <span className="bar-fill" />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

// The dots' own scale for the total. A dot shows a place, not a length, so its scale need not
// start at nothing: it starts a little under the lowest total, on a round number, and the dots
// get the room to stand apart.
const SIZED = BOARD.filter((entry) => entry.size);
const LOW = Math.floor((Math.min(...SIZED.map((entry) => entry.total)) - 10) / 50) * 50;
const FIELD_TICKS = Array.from({ length: (FULL - LOW) / 50 + 1 }, (_, index) => LOW + index * 50);
const up = (total) => (total - LOW) / (FULL - LOW);

// The models whose names give a size, each as a mark: its size across, its total up.
const MARKS = SIZED.map((entry) => ({ ...entry, x: sizeAt(entry.size), y: up(entry.total), label: entry.name }));

// Totals against size, as dots. It is set twice, for a narrow plot and for a wide one, because
// where a name can go round its dot depends on the room; the stylesheet shows one of the two.
// `width` and `height` are the plot at its smallest in that setting, in pixels.
function Field({ setting, width, height }) {
  const spots = place(MARKS, { width, height });
  return (
    <div className={`field ${setting}`} style={{ '--field-height': `${height / 16}rem` }}>
      <div className="field-plot">
        <div aria-hidden="true">
          {FIELD_TICKS.map((line) => (
            <span className="tick" key={line} style={{ '--at': up(line) }}>
              <span className="tick-label">{line}</span>
            </span>
          ))}
          {SIZE_TICKS.map((line) => (
            <span className="tick-size" key={line} style={{ '--at': sizeAt(line) }}>
              <span className="tick-size-label">{line}</span>
            </span>
          ))}
          <svg className="frontier" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points={steps(MARKS)} />
          </svg>
        </div>
        <ol className="dots">
          {MARKS.map((mark, index) => (
            <li className={mark.mode ? 'dot off' : 'dot'} key={`${mark.name} ${mark.mode}`} data-spot={spots[index]} style={{ ...series(mark.family), '--x': mark.x, '--y': mark.y }}>
              <span className="dot-name">
                {mark.name}
                <span className="visually-hidden">
                  {mark.mode && `, ${mark.mode}`}, {points(mark.total)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="field-axis" aria-hidden="true">{SIZE_AXIS}</p>
    </div>
  );
}

// The board's models with one score each, highest first. Models level on a score keep the order
// of their totals.
const ranked = (score) => BOARD.map((entry) => ({ ...entry, value: score(entry) })).sort((a, b) => b.value - a.value);

// One model's row in the table of all scores. A subject's name is said again in each cell: the
// heads are out of sight on narrow screens.
function Entry({ entry }) {
  return (
    <li className="entry" role="row">
      <span className="entry-model" role="rowheader">
        <span className={entry.mode ? 'swatch off' : 'swatch'} style={series(entry.family)} aria-hidden="true" />
        <span>
          <span className="entry-name">{entry.name}</span> <span className="entry-detail">{detail(entry)}</span>
        </span>
      </span>
      {SUBJECTS.map((subject, index) => (
        <span className="entry-subject" role="cell" key={subject.name}>
          <span className="entry-label">{subject.name} </span>
          {points(entry.subjects[index])}
        </span>
      ))}
      <span className="entry-total" role="cell">
        <span className="visually-hidden">Total </span>
        {points(entry.total)}
      </span>
    </li>
  );
}

export default function App() {
  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="stage">
        <header className="top">
          <a className="chip icon" href={HOME} aria-label="Back to home" onClick={goHome}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H3M7 4 3 8l4 4" />
            </svg>
          </a>
        </header>

        <main className="column" id="main">
          <h1>{MARK}</h1>
          <p className="lede">{LEDE}</p>

          {/* The totals come first. What is behind them comes after. */}
          <section className="totals">
            <ul className="legend" aria-label="Model families">
              {FAMILIES.map((family) => (
                <li key={family.key}>
                  <span className="swatch" style={series(family.key)} aria-hidden="true" />
                  {family.name}
                </li>
              ))}
              <li>
                <span className="swatch off" aria-hidden="true" />
                no thinking
              </li>
            </ul>
            <Chart id="total-title" heading="h2" title="Total" full={FULL} lines={TOTAL_TICKS} entries={ranked((entry) => entry.total)} tall />
          </section>

          <section className="detail" aria-labelledby="size-title">
            <figure className="chart" aria-labelledby="size-title">
              <figcaption className="chart-title">
                <h2 id="size-title">Total by size</h2> <span className="chart-full">{FRONTIER}</span>
              </figcaption>
              <Field setting="narrow" width={236} height={480} />
              <Field setting="wide" width={760} height={352} />
            </figure>
          </section>

          <section className="detail" aria-labelledby="subjects-title">
            <h2 id="subjects-title">By subject</h2>
            <div className="charts">
              {SUBJECTS.map((subject, index) => (
                <Chart
                  key={subject.name}
                  id={`subject-${index}`}
                  heading="h3"
                  title={subject.name}
                  full={subject.full}
                  lines={ticks(subject.full)}
                  entries={ranked((entry) => entry.subjects[index])}
                />
              ))}
            </div>
          </section>

          <section className="detail" aria-labelledby="scores-title">
            <h2 id="scores-title">All scores</h2>
            <div className="board" role="table" aria-labelledby="scores-title">
              <div className="board-head" role="row">
                <span role="columnheader">Model</span>
                {SUBJECTS.map((subject) => (
                  <span className="head-subject" role="columnheader" key={subject.name}>
                    {subject.name}
                    <span className="visually-hidden"> out of {subject.full}</span>
                  </span>
                ))}
                <span className="head-total" role="columnheader">Total</span>
              </div>
              <ol className="entries" role="rowgroup">
                {BOARD.map((entry) => (
                  <Entry key={`${entry.name} ${entry.mode}`} entry={entry} />
                ))}
              </ol>
            </div>
            <p className="aside">
              {SCALE} Updated <time dateTime={UPDATED}>{UPDATED}</time>.
            </p>
          </section>

          <section className="detail words" aria-labelledby="why-title">
            <h2 id="why-title">Why</h2>
            <p>{WHY}</p>
          </section>

          <section className="detail words" aria-labelledby="how-title">
            <h2 id="how-title">How</h2>
            <p>{HOW}</p>
            <ul className="rows">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a className="row" href={link.href} target="_blank" rel="noopener noreferrer">
                    <span className="row-text">
                      <span className="row-name">{link.name}</span> <span className="row-detail">{link.detail}</span>
                    </span>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      {/* The same footer as the home page. */}
      <footer className="site-footer">
        <span className="chip handle">@mercuriusdream</span>
        <a className="chip icp" href="https://icp.gov.moe/?keyword=20260535" target="_blank" rel="noopener noreferrer">
          <span lang="zh-CN">萌ICP备20260535号</span>
        </a>
        <a className="chip egg" href="https://mizukiakiyama.com" target="_blank" rel="noopener noreferrer" aria-label="Smirnova Oyama is cute">
          <span className="emoji">🍥</span>
        </a>
      </footer>
    </div>
  );
}
