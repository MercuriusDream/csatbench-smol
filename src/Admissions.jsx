import { useMemo, useState } from 'react';
import { ADMISSION_ENTRIES, ADMISSION_META, ADMISSION_MODELS } from './admissions.js';
import { ADMISSION_TEXT, LOCALES, TEXT } from './content.js';

function W({ k, a }) {
  return LOCALES.map((locale) => {
    const words = ADMISSION_TEXT[locale][k];
    return <span className={locale} lang={locale} key={locale}>{typeof words === 'function' ? words(a) : words}</span>;
  });
}

function Paper({ id }) {
  return LOCALES.map((locale) => <span className={locale} lang={locale} key={locale}>{TEXT[locale].views[id]}</span>);
}

const MODEL_NAMES = Object.keys(ADMISSION_MODELS);
// The papers in exam order; a 탐구 subject is listed when the model has a conversion for it.
const ORDER = [
  ['korean', 'korean-speech'], ['korean', 'korean-language'],
  ['math', 'math-probability'], ['math', 'math-calculus'], ['math', 'math-geometry'],
  ['absolute', 'english'], ['absolute', 'history'],
];
const INQUIRY = ['physics1', 'chemistry1', 'biology1', 'earth1', 'physics2', 'chemistry2', 'biology2', 'earth2',
  'ethics-life', 'ethics-thought', 'geography-korea', 'geography-world', 'history-eastasia', 'history-world',
  'economics', 'politics-law', 'socioculture'];
const fmt = (value, digits = 0) => Number(value).toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
const range = (values, digits = 0) => !values ? '—' : values[0] === values[1] ? fmt(values[0], digits) : `${fmt(values[0], digits)}–${fmt(values[1], digits)}`;
const rhu = (value) => Math.floor(value + 0.5);
const verdictFor = (profile, entry) => {
  if (rhu(profile.percentile[0]) >= entry.value) return 'above';
  if (rhu(profile.percentile[1]) < entry.value) return 'below';
  return 'undetermined';
};

// One model at a time. The section starts folded: its heading, the model and the profile stand on
// one line, and the tables open under them.
export default function Admissions({ locale }) {
  const [modelName, setModelName] = useState(MODEL_NAMES[0]);
  const [profileName, setProfileName] = useState('natural');
  const [verdict, setVerdict] = useState('similar');
  const [query, setQuery] = useState('');
  const words = ADMISSION_TEXT[locale];
  const model = ADMISSION_MODELS[modelName];
  const profile = model.profiles[profileName];
  const rows = [...ORDER, ...INQUIRY.filter((id) => model.inquiry[id]).map((id) => ['inquiry', id])];
  const mid = (profile.percentile[0] + profile.percentile[1]) / 2;

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return ADMISSION_ENTRIES
      .filter((entry) => entry[profileName])
      .map((entry) => ({ ...entry, verdict: verdictFor(profile, entry) }))
      .filter((entry) => verdict === 'all'
        || (verdict === 'similar' ? entry.value >= rhu(profile.percentile[0]) - 2 && entry.value <= rhu(profile.percentile[1]) + 2 : entry.verdict === verdict))
      .filter((entry) => !needle || `${entry.universityFull} ${entry.university} ${entry.unit}`.toLocaleLowerCase().includes(needle))
      .sort((a, b) => (verdict === 'similar' ? Math.abs(a.value - mid) - Math.abs(b.value - mid) : 0)
        || b.value - a.value || a.university.localeCompare(b.university) || a.unit.localeCompare(b.unit));
  }, [profile, profileName, query, verdict, mid]);

  return (
    <details className="detail admissions">
      <summary className="admission-head">
        <h2 id="admissions-title"><W k="title" /></h2>
      </summary>
      <div className="admission-controls">
        <select aria-label={words.chooseModel} value={modelName} onChange={(event) => setModelName(event.target.value)}>
          {MODEL_NAMES.map((name) => <option value={name} key={name}>{name}</option>)}
        </select>
        <div className="admission-profiles" role="group">
          {['natural', 'humanities'].map((name) => (
            <button type="button" className="chip" key={name} aria-pressed={profileName === name} onClick={() => setProfileName(name)}>
              <W k={name} />
            </button>
          ))}
        </div>
        <span className="admission-p">{range(profile.percentile, 1)}</span>
      </div>

      <div className="admission-table-wrap">
        <table className="admission-table conversion-table">
          <thead><tr><th /><th><W k="raw" /></th><th><W k="standard" /></th><th><W k="percentile" /></th><th><W k="grade" /></th></tr></thead>
          <tbody>
            {rows.map(([group, id]) => {
              const row = model[group][id];
              const used = profile.combination.includes(id);
              return (
                <tr key={id} data-used={used || undefined}>
                  <th scope="row"><Paper id={id} /></th>
                  <td>{row.raw}</td><td>{range(row.standard)}</td><td>{range(row.percentile)}</td><td>{row.grades.join(' / ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="admission-controls admission-filters">
        <input type="search" aria-label={words.search} value={query} placeholder={words.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label={words.verdict} value={verdict} onChange={(event) => setVerdict(event.target.value)}>
          {['similar', 'above', 'undetermined', 'below', 'all'].map((name) => (
            <option value={name} key={name}>{name === 'all' ? words.allVerdicts : words[name]}{name === 'all' ? '' : name === 'similar' ? '' : ` ${profile.counts[name]}`}</option>
          ))}
        </select>
      </div>
      <div className="admission-table-wrap">
        <table className="admission-table ladder-table">
          <thead><tr><th><W k="university" /></th><th><W k="unit" /></th><th><W k="line70" /></th></tr></thead>
          <tbody>
            {matches.slice(0, 100).map((entry) => (
              <tr key={entry.id} data-verdict={entry.verdict}>
                <td>{entry.university}</td><th scope="row">{entry.unit}</th><td>{entry.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!matches.length && <p className="aside"><W k="noEntries" /></p>}
      </div>
      <p className="aside">
        <W k={verdict === 'similar' ? 'similarNote' : 'lineNote'} />{' '}
        <a href={ADMISSION_META.source} target="_blank" rel="noopener noreferrer"><W k="source" /></a>
      </p>
    </details>
  );
}
