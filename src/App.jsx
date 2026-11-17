import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  BOARD, DEVICES, FAMILIES, FRONTIER, FULL, HOME, HOW, LEDE, LINKS, MARK, OFF, ROWS, SCALE, SIZE_AXIS, SIZE_TICKS, SUBJECTS, TOTAL_TICKS,
  UPDATED, WHY, detail, points, size, sizeAt, ticks,
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

// A mark's colour: its family's, and the family's darker step for scores made with thinking off.
const series = (family, off) => ({ '--series': `var(--series-${family}${off ? '-off' : ''})` });

// The legend: each family, and after it its darker step where the board has such scores.
const KEYS = FAMILIES.flatMap((family) => {
  const key = { ...family, off: false };
  return BOARD.some((entry) => entry.family === family.key && entry.off) ? [key, { ...family, off: true }] : [key];
});
const DARKER = KEYS.find((key) => key.off);

// What the chart can show: the total, then each subject.
const VIEWS = [
  { id: 'total', name: 'Total', full: FULL, lines: TOTAL_TICKS, pick: (scores) => scores.total },
  ...SUBJECTS.map((subject, index) => ({
    id: subject.name.toLowerCase(),
    name: subject.name,
    full: subject.full,
    lines: ticks(subject.full),
    pick: (scores) => scores.subjects[index],
  })),
];

// A model's name as one plain word. The parts of its bar carry it from one view to the next, so
// the browser knows each bar for the same bar and moves it instead of drawing another.
const word = (entry) => entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// The board's models with one view's scores, highest first. Models level on a score keep the
// order of their totals.
const ranked = (view) =>
  BOARD.map((entry) => ({ ...entry, value: view.pick(entry), front: entry.off ? view.pick(entry.off) : null })).sort((a, b) => b.value - a.value);

// A chart keeps its form on every screen. Where the screen is too narrow for it, the chart is
// moved sideways inside its own region, and that region can then be reached and named.
function useSideways() {
  const region = useRef(null);
  const [sideways, setSideways] = useState(false);
  useLayoutEffect(() => {
    const measure = () => setSideways(region.current.scrollWidth > region.current.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(region.current);
    return () => observer.disconnect();
  }, []);
  const props = (label) => (sideways ? { tabIndex: 0, role: 'group', 'aria-label': `${label}. It moves sideways.` } : {});
  return [region, props];
}

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

// The chart: models along the bottom, marks up the side, one bar for each model with its score
// over it. A model also run with thinking off carries that score as a darker, narrower bar in
// front of its own, and as a second number under the first.
// `longest` is the longest name, in letters: the room the slanted names need under the bars.
// `lead` is the room the names need to the left of the first bar when the sheet moves sideways and
// nothing may reach outside it: a name runs 0.4em to the left for each letter, from the middle of
// its column, and a column is then 2.75rem wide. Both in rem, at the chart's text size of 0.875rem.
function Chart({ view, entries }) {
  const [region, sideways] = useSideways();
  const longest = Math.max(...entries.map((entry) => entry.name.length));
  const lead = Math.max(0, ...entries.map((entry, index) => entry.name.length * 0.4 * 0.875 - (index + 0.5) * 2.75));
  return (
    <figure className="chart" aria-label={`${view.name}, out of ${view.full}`}>
      <div className="plot">
        <div className="axis" aria-hidden="true">
          {view.lines.map((line) => (
            <span className="axis-label" key={line} style={{ '--at': line / view.full }}>{line}</span>
          ))}
        </div>
        <div className="scroller" ref={region} {...sideways(`${view.name} chart`)}>
          <div className="sheet" style={{ '--count': entries.length, '--longest': longest, '--lead': `${lead.toFixed(3)}rem` }}>
            <div className="scale" aria-hidden="true">
              {view.lines.map((line) => (
                <span className="tick" key={line} style={{ '--at': line / view.full }} />
              ))}
            </div>
            <ol className="bars">
              {entries.map((entry) => {
                const name = word(entry);
                const both = entry.front !== null;
                return (
                  <li
                    className="bar"
                    key={name}
                    style={{ ...series(entry.family), '--share': entry.value / view.full, '--front': both ? entry.front / view.full : 0 }}
                  >
                    <span className="bar-model" style={{ viewTransitionName: `name-${name}` }}>{entry.name}</span>
                    <span className="bar-value" style={{ viewTransitionName: `value-${name}` }}>
                      <span>{points(entry.value)}</span>
                      {both && (
                        <span className="bar-value-off">
                          <span className="visually-hidden">{OFF} </span>
                          {points(entry.front)}
                        </span>
                      )}
                    </span>
                    <span className="bar-fill" aria-hidden="true" style={{ viewTransitionName: `fill-${name}` }} />
                    {both && (
                      <span className="bar-fill bar-front" aria-hidden="true" style={{ ...series(entry.family, true), viewTransitionName: `front-${name}` }} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </figure>
  );
}

// The dots' own scale for the total. A dot shows a place, not a length, so its scale need not
// start at nothing: it starts a little under the lowest total, on a round number, and the dots
// get the room to stand apart.
const LOWEST = Math.min(...BOARD.flatMap((entry) => (entry.off ? [entry.total, entry.off.total] : [entry.total])));
const LOW = Math.floor((LOWEST - 10) / 50) * 50;
const FIELD_TICKS = Array.from({ length: (FULL - LOW) / 50 + 1 }, (_, index) => LOW + index * 50);
const up = (total) => (total - LOW) / (FULL - LOW);

// Each model as a mark: the size of its weights across, its total up. A model also run with
// thinking off has a second, darker mark straight under or over the first, joined to it.
const MARKS = BOARD.map((entry) => ({ ...entry, x: sizeAt(entry.gb), y: up(entry.total), label: entry.name }));
const TWINS = MARKS.filter((mark) => mark.off).map((mark) => ({ ...mark, y: up(mark.off.total), main: mark.y }));
// Where each name goes, found for the plot at its narrowest: 40rem across, 22rem high.
const SPOTS = place(MARKS, { width: 640, height: 352, also: TWINS });
const LINE = steps([...MARKS, ...TWINS]);
const LONGEST_DEVICE = Math.max(...DEVICES.map((device) => device.name.length));

// Totals against the size of the weights, as dots, with the devices that have that much memory
// named under the sizes.
function Field() {
  const [region, sideways] = useSideways();
  return (
    <div className="field">
      <div className="axis" aria-hidden="true">
        {FIELD_TICKS.map((line) => (
          <span className="axis-label" key={line} style={{ '--at': up(line) }}>{line}</span>
        ))}
      </div>
      <div className="scroller" ref={region} {...sideways('Total by GB chart')}>
        <div className="sheet" style={{ '--longest': LONGEST_DEVICE }}>
          <div className="field-plot">
            <div aria-hidden="true">
              {FIELD_TICKS.map((line) => (
                <span className="tick" key={line} style={{ '--at': up(line) }} />
              ))}
              {SIZE_TICKS.map((gb) => (
                <span className="tick-size" key={gb} style={{ '--at': sizeAt(gb) }} />
              ))}
              <svg className="frontier" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points={LINE} />
              </svg>
              {TWINS.map((twin) => (
                <span
                  className="twin-link"
                  key={twin.name}
                  style={{ ...series(twin.family), '--x': twin.x, '--from': Math.min(twin.y, twin.main), '--to': Math.max(twin.y, twin.main) }}
                />
              ))}
            </div>
            <ol className="dots">
              {MARKS.map((mark, index) => (
                <li className="dot" key={mark.name} data-spot={SPOTS[index]} style={{ ...series(mark.family), '--x': mark.x, '--y': mark.y }}>
                  <span className="dot-name">
                    {mark.name}
                    <span className="visually-hidden">, {size(mark.gb)} GB, {points(mark.total)}</span>
                  </span>
                </li>
              ))}
              {TWINS.map((twin) => (
                <li className="dot" key={`${twin.name} ${OFF}`} style={{ ...series(twin.family, true), '--x': twin.x, '--y': twin.y }}>
                  <span className="visually-hidden">{twin.name}, {OFF}, {size(twin.gb)} GB, {points(twin.off.total)}</span>
                </li>
              ))}
            </ol>
          </div>
          <ol className="sizes" aria-label="Sizes in GB, and devices with that much memory">
            {SIZE_TICKS.map((gb) => (
              <li className="size" key={gb} style={{ '--at': sizeAt(gb) }}>
                <span className="size-gb">
                  {gb}
                  <span className="visually-hidden"> GB</span>
                </span>
                <span className="size-devices">
                  {DEVICES.filter((device) => device.gb === gb).map((device) => (
                    <span key={device.name}>{device.name}</span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="field-axis">{SIZE_AXIS}</p>
    </div>
  );
}

// One row of the table of all scores. A subject's name is said again in each cell: the heads are
// out of sight on narrow screens.
function Entry({ row }) {
  return (
    <li className="entry" role="row">
      <span className="entry-model" role="rowheader">
        <span className="swatch" style={series(row.family, row.mode)} aria-hidden="true" />
        <span>
          <span className="entry-name">{row.name}</span> <span className="entry-detail">{detail(row)}</span>
        </span>
      </span>
      <span className="entry-subject" role="cell">
        <span className="entry-label">GB </span>
        {size(row.gb)}
      </span>
      {SUBJECTS.map((subject, index) => (
        <span className="entry-subject" role="cell" key={subject.name}>
          <span className="entry-label">{subject.name} </span>
          {points(row.subjects[index])}
        </span>
      ))}
      <span className="entry-total" role="cell">
        <span className="visually-hidden">Total </span>
        {points(row.total)}
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
    const morph = document.startViewTransition(() => flushSync(() => setShown(id)));
    // A second choice made while the first is still travelling ends the first. That is not a fault.
    morph.ready.catch(() => {});
    morph.finished.catch(() => {});
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
              <p className="chart-note">
                {DARKER && (
                  <span className="chart-key">
                    <span className="swatch" style={series(DARKER.key, true)} aria-hidden="true" />
                    {OFF}
                  </span>
                )}
                <span>out of {view.full}</span>
              </p>
            </div>
            <div role="tabpanel" id="scores-panel" aria-labelledby={`tab-${view.id}`}>
              <Chart view={view} entries={ranked(view)} />
            </div>
          </section>

          <section className="detail" aria-labelledby="size-title">
            <figure className="chart" aria-labelledby="size-title">
              <figcaption className="chart-title">
                <h2 id="size-title">Total by GB</h2> <span className="chart-full">{FRONTIER}</span>
              </figcaption>
              <ul className="legend" aria-label="Model families">
                {KEYS.map((key) => (
                  <li key={`${key.key} ${key.off}`}>
                    <span className="swatch" style={series(key.key, key.off)} aria-hidden="true" />
                    {key.off ? `${key.name}, ${OFF}` : key.name}
                  </li>
                ))}
              </ul>
              <Field />
            </figure>
          </section>

          <section className="detail" aria-labelledby="all-title">
            <h2 id="all-title">All scores</h2>
            <div className="board" role="table" aria-labelledby="all-title">
              <div className="board-head" role="row">
                <span role="columnheader">Model</span>
                <span className="head-subject" role="columnheader">GB</span>
                {SUBJECTS.map((subject) => (
                  <span className="head-subject" role="columnheader" key={subject.name}>
                    {subject.name}
                    <span className="visually-hidden"> out of {subject.full}</span>
                  </span>
                ))}
                <span className="head-total" role="columnheader">Total</span>
              </div>
              <ol className="entries" role="rowgroup">
                {ROWS.map((row) => (
                  <Entry key={`${row.name} ${row.mode}`} row={row} />
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
