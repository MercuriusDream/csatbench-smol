import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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

// A row's colour: its family's, and the family's darker step for a row run with thinking off.
const series = (family, mode) => ({ '--series': `var(--series-${family}${mode ? '-off' : ''})` });

// The legend: each family, and after it its darker step where the board has such a row.
const KEYS = FAMILIES.flatMap((family) => {
  const off = BOARD.find((entry) => entry.family === family.key && entry.mode);
  return off ? [{ ...family, mode: '' }, { ...family, mode: off.mode }] : [{ ...family, mode: '' }];
});

// What the chart can show: the total, then each subject.
const VIEWS = [
  { id: 'total', name: 'Total', full: FULL, lines: TOTAL_TICKS, score: (entry) => entry.total },
  ...SUBJECTS.map((subject, index) => ({
    id: subject.name.toLowerCase(),
    name: subject.name,
    full: subject.full,
    lines: ticks(subject.full),
    score: (entry) => entry.subjects[index],
  })),
];

// A model's name as one plain word. The parts of its bar carry it from one view to the next, so
// the browser knows each bar for the same bar and moves it instead of drawing another.
const word = (entry) => `${entry.name} ${entry.mode}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

// The tabs over the chart. The plane under the chosen tab is one object: it is moved to the tab,
// never drawn again. Before the script has measured anything, the chosen tab wears the plane itself.
function Tabs({ label, views, value, onChange, controls }) {
  const track = useRef(null);
  const [at, setAt] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const tab = track.current?.querySelector('[aria-selected="true"]');
      if (tab) setAt({ x: tab.offsetLeft, y: tab.offsetTop, w: tab.offsetWidth, h: tab.offsetHeight });
    };
    measure();
    // A font arriving or a change of text size moves the tabs without a new choice.
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(track.current);
    return () => observer.disconnect();
  }, [value]);

  // Arrow keys move the choice along the row, and round its ends.
  function onKeyDown(event, index) {
    const last = views.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    track.current.querySelectorAll('[role="tab"]')[next].focus();
    onChange(views[next].id);
  }

  return (
    <div className="tabs" role="tablist" aria-label={label} ref={track} data-placed={at ? '' : undefined}>
      {at && (
        <span
          className="tabs-plane"
          aria-hidden="true"
          style={{ width: at.w, height: at.h, transform: `translate(${at.x}px, ${at.y}px)` }}
        />
      )}
      {views.map((view, index) => (
        <button
          type="button"
          role="tab"
          className="tab"
          key={view.id}
          id={`tab-${view.id}`}
          aria-selected={view.id === value}
          aria-controls={controls}
          tabIndex={view.id === value ? 0 : -1}
          onClick={() => onChange(view.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {view.name}
        </button>
      ))}
    </div>
  );
}

// The chart: models along the bottom, marks up the side, a bar for each model with its score on
// top. On a narrow screen the same list is set as rows, each bar under its name.
// `longest` is the longest label, in letters: the room the slanted names need under the bars.
function Chart({ view, entries }) {
  const longest = Math.max(...entries.map((entry) => Math.max(entry.name.length, entry.mode.length)));
  return (
    <figure className="chart" aria-label={`${view.name}, out of ${view.full}`}>
      <div className="plot" style={{ '--count': entries.length, '--longest': longest }}>
        <div className="scale" aria-hidden="true">
          {view.lines.map((line) => (
            <span className="tick" key={line} style={{ '--at': line / view.full }}>
              <span className="tick-label">{line}</span>
            </span>
          ))}
        </div>
        <ol className="bars">
          {entries.map((entry) => {
            const name = word(entry);
            return (
              <li className="bar" key={name} style={{ ...series(entry.family, entry.mode), '--share': entry.value / view.full }}>
                <span className="bar-model" style={{ viewTransitionName: `name-${name}` }}>
                  <span className="bar-name">{entry.name}</span>
                  {entry.mode && ' '}
                  {entry.mode && <span className="bar-mode">{entry.mode}</span>}
                </span>
                <span className="bar-value" style={{ viewTransitionName: `value-${name}` }}>{points(entry.value)}</span>
                <span className="bar-track" aria-hidden="true">
                  <span className="bar-fill" style={{ viewTransitionName: `fill-${name}` }} />
                </span>
              </li>
            );
          })}
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
            <li className="dot" key={`${mark.name} ${mark.mode}`} data-spot={spots[index]} style={{ ...series(mark.family, mark.mode), '--x': mark.x, '--y': mark.y }}>
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
        <span className="swatch" style={series(entry.family, entry.mode)} aria-hidden="true" />
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
  const [shown, setShown] = useState('total');
  const view = VIEWS.find((candidate) => candidate.id === shown);

  // Changing the view keeps every bar. Where the browser can, each one travels to its new place
  // and size; under reduced motion, and where it cannot, the chart changes in place.
  function show(id) {
    if (id === shown) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !document.startViewTransition) return setShown(id);
    document.startViewTransition(() => flushSync(() => setShown(id)));
  }

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

          {/* The scores come first: one chart, for the total and for each subject. */}
          <section className="totals" aria-labelledby="scores-title">
            <h2 className="visually-hidden" id="scores-title">Scores</h2>
            <div className="chart-head">
              <Tabs label="Score shown" views={VIEWS} value={shown} onChange={show} controls="scores-panel" />
              <p className="chart-full">out of {view.full}</p>
            </div>
            <ul className="legend" aria-label="Model families">
              {KEYS.map((key) => (
                <li key={`${key.key} ${key.mode}`}>
                  <span className="swatch" style={series(key.key, key.mode)} aria-hidden="true" />
                  {key.mode ? `${key.name}, ${key.mode}` : key.name}
                </li>
              ))}
            </ul>
            <div role="tabpanel" id="scores-panel" aria-labelledby={`tab-${view.id}`}>
              <Chart view={view} entries={ranked(view.score)} />
            </div>
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

          <section className="detail" aria-labelledby="all-title">
            <h2 id="all-title">All scores</h2>
            <div className="board" role="table" aria-labelledby="all-title">
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
