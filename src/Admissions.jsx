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
const PAPER_ORDER = [
  ['korean', 'korean-speech'], ['korean', 'korean-language'],
  ['math', 'math-probability'], ['math', 'math-calculus'], ['math', 'math-geometry'],
  ['absolute', 'english'], ['absolute', 'history'],
  ['inquiry', 'physics1'], ['inquiry', 'chemistry1'], ['inquiry', 'biology1'], ['inquiry', 'socioculture'],
];
const fmt = (value, digits = 0) => Number(value).toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
const range = (values, digits = 0) => !values ? '—' : values[0] === values[1] ? fmt(values[0], digits) : `${fmt(values[0], digits)}–${fmt(values[1], digits)}`;
const rhu = (value) => Math.floor(value + 0.5);
const verdictFor = (profile, entry) => {
  if (rhu(profile.percentile[0]) >= entry.value) return 'above';
  if (rhu(profile.percentile[1]) < entry.value) return 'below';
  return 'undetermined';
};

export default function Admissions({ locale }) {
  const [modelName, setModelName] = useState(MODEL_NAMES[0]);
  const [profileName, setProfileName] = useState('natural');
  const [verdict, setVerdict] = useState('above');
  const [query, setQuery] = useState('');
  const words = ADMISSION_TEXT[locale];
  const model = ADMISSION_MODELS[modelName];
  const profile = model.profiles[profileName];
  const papers = profile.combination.map((id) => TEXT[locale].views[id]).join(', ');
  const pRange = range(profile.percentile, 2);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return ADMISSION_ENTRIES
      .filter((entry) => entry[profileName])
      .map((entry) => ({ ...entry, verdict: verdictFor(profile, entry) }))
      .filter((entry) => verdict === 'all' || entry.verdict === verdict)
      .filter((entry) => !needle || `${entry.universityFull} ${entry.university} ${entry.unit}`.toLocaleLowerCase().includes(needle))
      .sort((a, b) => b.value - a.value || a.university.localeCompare(b.university) || a.unit.localeCompare(b.unit));
  }, [profile, profileName, query, verdict]);

  return (
    <section className="detail admissions" aria-labelledby="admissions-title">
      <h2 id="admissions-title"><W k="title" /></h2>
      <div className="admission-controls">
        <label className="admission-model">
          <span><W k="chooseModel" /></span>
          <select value={modelName} onChange={(event) => setModelName(event.target.value)}>
            {MODEL_NAMES.map((name) => <option value={name} key={name}>{name}</option>)}
          </select>
        </label>
        <div className="admission-profiles" role="group" aria-label={words.natural}>
          {['natural', 'humanities'].map((name) => (
            <button type="button" className="chip" key={name} aria-pressed={profileName === name} onClick={() => setProfileName(name)}>
              <W k={name} />
            </button>
          ))}
        </div>
      </div>

      <h3><W k="conversionTitle" /></h3>
      <div className="admission-table-wrap">
        <table className="admission-table conversion-table">
          <thead><tr><th><W k="unit" /></th><th><W k="raw" /></th><th><W k="standard" /></th><th><W k="percentile" /></th><th><W k="grade" /></th></tr></thead>
          <tbody>
            {PAPER_ORDER.map(([group, id]) => {
              const row = model[group][id];
              return (
                <tr key={id} data-basis={row.basis}>
                  <th scope="row"><Paper id={id} /></th>
                  <td>{row.raw}</td><td>{range(row.standard)}</td><td>{range(row.percentile)}</td><td>{row.grades.join(' / ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="aside"><W k="conversionNote" /></p>
      <p className="aside"><W k="inquiryNote" /></p>

      <h3><W k="comparisonTitle" /></h3>
      <div className="admission-summary">
        <p><W k="chosen" a={papers} /></p>
        <p><W k="meanP" a={pRange} /></p>
        <ul>
          {['above', 'undetermined', 'below'].map((name) => (
            <li key={name}><W k={name} /> <strong>{profile.counts[name]}</strong></li>
          ))}
          <li><W k="highestCleared" a={profile.highestCleared} /></li>
        </ul>
      </div>
      <p className="aside"><W k="postChosen" /></p>

      <div className="admission-controls admission-filters">
        <label>
          <span><W k="search" /></span>
          <input type="search" value={query} placeholder={words.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span><W k="verdict" /></span>
          <select value={verdict} onChange={(event) => setVerdict(event.target.value)}>
            {['above', 'undetermined', 'below', 'all'].map((name) => (
              <option value={name} key={name}>{name === 'all' ? words.allVerdicts : words[name]}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="aside"><W k="showing" a={{ shown: Math.min(100, matches.length), total: matches.length }} /></p>
      <div className="admission-table-wrap">
        <table className="admission-table ladder-table">
          <thead><tr><th><W k="university" /></th><th><W k="unit" /></th><th><W k="line70" /></th><th><W k="verdict" /></th><th><W k="englishHistory" /></th></tr></thead>
          <tbody>
            {matches.slice(0, 100).map((entry) => (
              <tr key={entry.id} data-verdict={entry.verdict}>
                <td>{entry.university}</td><th scope="row">{entry.unit}<span className="admission-unit-note"> {entry.note}</span></th>
                <td>{entry.value}</td><td><W k={entry.verdict} /></td>
                <td>{model.absolute.english.grades[0]} · {entry.englishGrade ?? '—'} / {model.absolute.history.grades[0]} · {entry.historyGrade ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!matches.length && <p className="aside"><W k="noEntries" /></p>}
      </div>
      <p className="aside"><W k="lineNote" /></p>
      <p className="aside"><W k="exclusions" /></p>
      <p className="aside">
        <a href={ADMISSION_META.source} target="_blank" rel="noopener noreferrer"><W k="source" /></a>
        {' · '}{ADMISSION_META.entries} / {ADMISSION_META.universities}
      </p>
    </section>
  );
}
