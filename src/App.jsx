import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Admissions from './Admissions.jsx';
import {
  BOARD, DEVICES, FAMILIES, FULL, HOME, LINKS, LOCALES, MARK, ROWS, SIZE_TICKS, STARRED, SUBJECTS, TEXT, TREE, UPDATED,
  points, size, sizeAt, ticks,
} from './content.js';
import { place, steps } from './field.js';
import { leaveTo } from './veil.js';

// A piece of the page's words, in every language the page has. All of them are in the markup, and
// the stylesheet shows the one the page is set to. So the first frame is in the reader's language
// before any script of the page has run, and changing language redraws nothing.
function T({ k, a }) {
  return LOCALES.map((locale) => {
    const words = TEXT[locale][k];
    return (
      <span className={locale} lang={locale} key={locale}>
        {typeof words === 'function' ? words(a) : words}
      </span>
    );
  });
}

// The same for one of a list of words, such as a subject's name.
function Ti({ k, i }) {
  return LOCALES.map((locale) => (
    <span className={locale} lang={locale} key={locale}>{TEXT[locale][k][i]}</span>
  ));
}

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

// The name of one of the chart's views, in every language the page has.
function Tv({ id }) {
  return LOCALES.map((locale) => (
    <span className={locale} lang={locale} key={locale}>{TEXT[locale].views[id]}</span>
  ));
}

// The chart's views are a tree (see content.js), and the choice is a path down it: ['inquiry',
// 'science', 'physics1']. Each step of the path has a row of tabs: the first row the subjects, and
// under a subject that has papers a row for them, with "All" for the subject itself. A row
// unfolds when the step above it is chosen. The view shown is the last step of the path.
function levels(path) {
  const rows = [];
  let nodes = TREE;
  let parent = null;
  for (let depth = 0; nodes; depth += 1) {
    const chosen = nodes.find((node) => node.id === path[depth]) ?? null;
    rows.push({ depth, parent, nodes, chosen });
    if (!chosen) break;
    parent = chosen;
    nodes = chosen.children;
  }
  return rows;
}

// A model's name as one plain word. The parts of its bar carry it from one view to the next, so
// the browser knows each bar for the same bar and moves it instead of drawing another.
const word = (entry) => entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// The board's models with one view's scores, highest first. Models level on a score keep the
// order of their totals.
const ranked = (view) =>
  BOARD.map((entry) => {
    const front = entry.off ? view.pick(entry.off) : null;
    return { ...entry, value: view.pick(entry), front: Number.isFinite(front) ? front : null };
  })
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value);

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
  const props = (label) => (sideways ? { tabIndex: 0, role: 'group', 'aria-label': label } : {});
  return [region, props];
}

// The tabs over the chart. The plane under the chosen tab is one object: it is moved to the tab,
// never drawn again. Before the script has measured anything, the chosen tab wears the plane itself.
function Tabs({ label, views, value, onChange, controls, depth }) {
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
          style={{ width: at.w, height: at.h, transform: `translate(${at.x}px, ${at.y}px)`, viewTransitionName: `tabs-plane-${depth}` }}
        />
      )}
      {views.map((view, index) => (
        <button
          type="button"
          role="tab"
          className="tab"
          key={view.id}
          id={`tab-${depth}-${view.id}`}
          aria-selected={view.id === value}
          aria-controls={controls}
          tabIndex={view.id === value ? 0 : -1}
          onClick={() => onChange(view.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          <Tv id={view.id} />
        </button>
      ))}
    </div>
  );
}

// The chart: models along the bottom, marks up the side, one bar for each model with its score
// over it. A model also run with thinking off carries that score on the same bar, in the darker
// colour: the two scores are two heights of one bar.
// `longest` is the longest name, in letters: the room the slanted names need under the bars.
// `lead` is the room the names need to the left of the first bar when the sheet moves sideways and
// nothing may reach outside it: a name runs 0.4em to the left for each letter, from the middle of
// its column, and a column is then 3.25rem wide. Both in rem, at the chart's text size of 0.875rem.
function Chart({ view, entries, t }) {
  const [region, sideways] = useSideways();
  const longest = Math.max(0, ...entries.map((entry) => entry.name.length));
  const lead = Math.max(0, ...entries.map((entry, index) => entry.name.length * 0.4 * 0.875 - (index + 0.5) * 3.25));
  return (
    <figure className="chart" aria-label={`${t.views[view.id]}, ${t.outOf(view.full)}`}>
      <div className="plot">
        <div className="axis" aria-hidden="true">
          {ticks(view.full).map((line) => (
            <span className="axis-label" key={line} style={{ '--at': line / view.full }}>{line}</span>
          ))}
        </div>
        <div className="scroller" ref={region} {...sideways(t.sideways(t.views[view.id]))}>
          <div className="sheet" style={{ '--count': entries.length, '--longest': longest, '--lead': `${lead.toFixed(3)}rem` }}>
            <div className="scale" aria-hidden="true">
              {ticks(view.full).map((line) => (
                <span className="tick" key={line} style={{ '--at': line / view.full }} />
              ))}
            </div>
            <ol className="bars">
              {entries.map((entry) => {
                const name = word(entry);
                const both = entry.front !== null;
                // The higher of the two scores stands behind with its number over it. The lower
                // stands in front, on the same bar, with its number on it.
                const offInFront = both && entry.front <= entry.value;
                const ownInFront = both && !offInFront;
                return (
                  <li
                    className="bar"
                    key={name}
                    data-front={both ? (offInFront ? 'off' : 'own') : undefined}
                    style={{ ...series(entry.family), '--share': entry.value / view.full, '--front': both ? entry.front / view.full : 0 }}
                  >
                    <span className="bar-model" style={{ viewTransitionName: `name-${name}` }}>{entry.name}</span>
                    <span className={ownInFront ? 'bar-value inside' : 'bar-value'} style={{ viewTransitionName: `value-${name}` }}>
                      {points(entry.value)}
                    </span>
                    {both && (
                      <span className={offInFront ? 'bar-value off inside' : 'bar-value off'} style={{ viewTransitionName: `off-${name}` }}>
                        <span className="visually-hidden"><T k="off" /> </span>
                        {points(entry.front)}
                      </span>
                    )}
                    <span className="bar-fill" aria-hidden="true" style={{ viewTransitionName: `fill-${name}` }} />
                    {both && (
                      <span className="bar-fill bar-off" aria-hidden="true" style={{ ...series(entry.family, true), viewTransitionName: `front-${name}` }} />
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
function Field({ t }) {
  const [region, sideways] = useSideways();
  return (
    <div className="field">
      <div className="axis" aria-hidden="true">
        {FIELD_TICKS.map((line) => (
          <span className="axis-label" key={line} style={{ '--at': up(line) }}>{line}</span>
        ))}
      </div>
      <div className="scroller" ref={region} {...sideways(t.sideways(t.byGb))}>
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
                <li className="dot" key={`${twin.name} off`} style={{ ...series(twin.family, true), '--x': twin.x, '--y': twin.y }}>
                  <span className="visually-hidden">{twin.name} <T k="off" />, {size(twin.gb)} GB, {points(twin.off.total)}</span>
                </li>
              ))}
            </ol>
          </div>
          <ol className="sizes" aria-label={t.sizes}>
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
      <p className="field-axis"><T k="sizeAxis" /></p>
    </div>
  );
}

// One row of the table of all scores. A subject's name is said again in each cell: the heads are
// out of sight on narrow screens. A model's scores with thinking off are a row of their own under
// the model's, set back: no plane under it, quieter ink, and in place of the name only what differs.
function Entry({ row }) {
  return (
    <li className={row.off ? 'entry entry-off' : 'entry'} role="row">
      <span className="entry-model" role="rowheader">
        <span className="swatch" style={series(row.family, row.off)} aria-hidden="true" />
        {row.off ? (
          <span>
            <span className="visually-hidden">{row.name} </span>
            <T k="off" />
          </span>
        ) : (
          <span>
            <span className="entry-name">{row.name}</span>
            {row.build === STARRED ? '*' : row.build && <span className="entry-detail"> {row.build}</span>}
          </span>
        )}
      </span>
      <span className="entry-subject" role="cell">
        <span className="entry-label">GB </span>
        {size(row.gb)}
      </span>
      {SUBJECTS.map((subject, index) => (
        <span className="entry-subject" role="cell" key={subject.name}>
          <span className="entry-label"><Ti k="subjects" i={index} /> </span>
          {points(row.subjects[index])}
        </span>
      ))}
      <span className="entry-total" role="cell">
        <span className="visually-hidden"><T k="total" /> </span>
        {points(row.total)}
      </span>
    </li>
  );
}

// The language the page is set to: the one chosen here before, else Korean for a reader whose
// browser asks for Korean, else English. A script in the page's head has already set it on the
// document, before the first frame; this reads it back and changes it.
function useLocale() {
  const [locale, setLocale] = useState('en');
  useLayoutEffect(() => {
    const set = document.documentElement.lang;
    if (LOCALES.includes(set)) setLocale(set);
  }, []);
  useLayoutEffect(() => {
    document.title = TEXT[locale].title;
  }, [locale]);

  function change(next) {
    const apply = () => {
      document.documentElement.lang = next;
      flushSync(() => setLocale(next));
    };
    try {
      localStorage.setItem('locale', next);
    } catch {}
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !document.startViewTransition) return apply();
    const morph = document.startViewTransition(apply);
    morph.ready.catch(() => {});
    morph.finished.catch(() => {});
  }
  return [locale, change];
}

export default function App() {
  const [path, setPath] = useState(['total']);
  const [locale, changeLocale] = useLocale();
  const t = TEXT[locale];
  const rows = levels(path);
  const last = rows[rows.length - 1];
  const view = last.chosen ?? last.parent;
  const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  // Changing the view keeps every bar. Where the browser can, each one travels to its new place
  // and size; under reduced motion, and where it cannot, the chart changes in place.
  function show(next) {
    if (next.join('/') === path.join('/')) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !document.startViewTransition) return setPath(next);
    const morph = document.startViewTransition(() => flushSync(() => setPath(next)));
    // A second choice made while the first is still travelling ends the first. That is not a fault.
    morph.ready.catch(() => {});
    morph.finished.catch(() => {});
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main"><T k="skip" /></a>

      <div className="stage">
        <header className="top">
          <a className="chip icon" href={HOME} aria-label={t.back} onClick={goHome}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H3M7 4 3 8l4 4" />
            </svg>
          </a>
          {/* The other language, named in itself. */}
          <button type="button" className="chip" lang={next} aria-label={t.switchTo} onClick={() => changeLocale(next)}>
            {t.other}
          </button>
        </header>

        <main className="column" id="main">
          <h1>{MARK}</h1>
          <p className="lede"><T k="lede" /></p>

          {/* The scores come first: one chart, for the total and for each subject. */}
          <section className="totals" aria-labelledby="scores-title">
            <h2 className="visually-hidden" id="scores-title"><T k="scores" /></h2>
            <div className="chart-head">
              <div className="tab-rows">
                {rows.map(({ depth, parent, nodes, chosen }) => (
                  <Tabs
                    key={depth}
                    depth={depth}
                    label={parent ? t.partsOf(t.views[parent.id]) : t.scoreShown}
                    views={parent ? [{ id: 'all' }, ...nodes] : nodes}
                    value={chosen ? chosen.id : 'all'}
                    onChange={(id) => show(id === 'all' ? path.slice(0, depth) : [...path.slice(0, depth), id])}
                    controls="scores-panel"
                  />
                ))}
              </div>
              <p className="chart-note">
                {DARKER && (
                  <span className="chart-key">
                    <span className="swatch" style={series(DARKER.key, true)} aria-hidden="true" />
                    <span><T k="off" /></span>
                  </span>
                )}
                <span><T k="outOf" a={view.full} /></span>
              </p>
            </div>
            <div role="tabpanel" id="scores-panel" aria-labelledby={`tab-${last.depth}-${last.chosen ? last.chosen.id : 'all'}`}>
              <Chart view={view} entries={ranked(view)} t={t} />
            </div>
          </section>

          <section className="detail" aria-labelledby="size-title">
            <figure className="chart" aria-labelledby="size-title">
              <figcaption className="chart-title">
                <h2 id="size-title"><T k="byGb" /></h2> <span className="chart-full"><T k="frontier" /></span>
              </figcaption>
              <ul className="legend" aria-label={t.families}>
                {KEYS.map((key) => (
                  <li key={`${key.key} ${key.off}`}>
                    <span className="swatch" style={series(key.key, key.off)} aria-hidden="true" />
                    {key.off ? <span><T k="off" /></span> : key.name}
                  </li>
                ))}
              </ul>
              <Field t={t} />
            </figure>
          </section>

          <section className="detail" aria-labelledby="all-title">
            <h2 id="all-title"><T k="allScores" /></h2>
            <div className="board" role="table" aria-labelledby="all-title">
              <div className="board-head" role="row">
                <span role="columnheader"><T k="model" /></span>
                <span className="head-subject" role="columnheader">GB</span>
                {SUBJECTS.map((subject, index) => (
                  <span className="head-subject" role="columnheader" key={subject.name}>
                    <Ti k="subjects" i={index} />
                    <span className="visually-hidden"> <T k="outOf" a={subject.full} /></span>
                  </span>
                ))}
                <span className="head-total" role="columnheader"><T k="total" /></span>
              </div>
              <ol className="entries" role="rowgroup">
                {ROWS.map((row) => (
                  <Entry key={`${row.name} ${row.off}`} row={row} />
                ))}
              </ol>
            </div>
            <p className="aside">
              {ROWS.some((row) => row.build === STARRED) && <><T k="starred" /> </>}
              <T k="scale" /> <time dateTime={UPDATED}><T k="updated" a={UPDATED} /></time>
            </p>
          </section>

          <Admissions locale={locale} />

          {/* Why and how stand side by side across the page's width. */}
          <div className="words">
            <section aria-labelledby="why-title">
              <h2 id="why-title"><T k="whyTitle" /></h2>
              <p><T k="why" /></p>
            </section>

            <section aria-labelledby="how-title">
              <h2 id="how-title"><T k="howTitle" /></h2>
              <p><T k="how" /></p>
              <ul className="rows">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <a className="row" href={link.href} target="_blank" rel="noopener noreferrer">
                      <span className="row-text">
                        <span className="row-name"><Ti k={link.key} i={0} /></span> <span className="row-detail"><Ti k={link.key} i={1} /></span>
                      </span>
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
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
