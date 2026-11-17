import React, { useMemo, useState } from 'react';
import { Search, Telescope, ArrowUpDown } from 'lucide-react';
import { UNSEEN_ATTACKS, UnseenAttackRecord, LEARNED_IDS, MODEL_NAMES, LearnedId, MISSED_RECORDS } from '../data/researchData';
import { MODEL_COLOR, MODEL_ABBR } from './modelStyle';

type SortField = 'count' | 'name' | 'recall';

const SHOW_FEATURES: { key: string; label: string }[] = [
  { key: 'protocol_type', label: 'proto' }, { key: 'service', label: 'service' }, { key: 'flag', label: 'flag' },
  { key: 'duration', label: 'duration' }, { key: 'src_bytes', label: 'src_bytes' }, { key: 'dst_bytes', label: 'dst_bytes' },
  { key: 'count', label: 'count' }, { key: 'srv_count', label: 'srv_count' }, { key: 'serror_rate', label: 'serror' },
  { key: 'same_srv_rate', label: 'same_srv' }, { key: 'dst_host_count', label: 'dh_count' }, { key: 'dst_host_srv_count', label: 'dh_srv_count' },
];

const fmtFeature = (v: string | number | undefined): string => {
  if (v === undefined) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
  return v;
};

const MissedRecords: React.FC<{ attack: string }> = ({ attack }) => {
  const rows = MISSED_RECORDS.records.filter(r => r.attack === attack);
  const ref = MISSED_RECORDS.normalReference;
  return (
    <div id="missed-records" className="mt-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover overflow-x-auto">
      <div className="px-4 pt-4 pb-2">
        <h3 className="font-serif font-semibold text-base text-content-primary">Missed-record inspector · {attack}</h3>
        <p className="text-xs text-content-muted mt-1">
          Representative test flows of this type, preferring those missed by the most models (threshold 0.5), next to typical normal traffic
          (median / most common value). P(attack) above 0.5 counts as detected.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 pb-4 text-xs text-content-muted">No sample stored for this attack type.</p>
      ) : (
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-y border-surface-border text-content-muted">
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">flow</th>
              {LEARNED_IDS.map(id => (
                <th key={id} className="text-right px-2 py-2 font-medium whitespace-nowrap" title={`P(attack) from ${MODEL_NAMES[id]}`}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: MODEL_COLOR[id] }} />P({MODEL_ABBR[id]})
                </th>
              ))}
              {SHOW_FEATURES.map(f => <th key={f.key} className="text-right px-2 py-2 font-medium whitespace-nowrap border-l-0">{f.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-surface-border/50 bg-surface-elevated/40 text-content-muted italic">
              <td className="px-3 py-2 whitespace-nowrap">typical normal</td>
              {LEARNED_IDS.map(id => <td key={id} className="px-2 py-2 text-right">—</td>)}
              {SHOW_FEATURES.map(f => <td key={f.key} className="px-2 py-2 text-right whitespace-nowrap">{fmtFeature(ref[f.key])}</td>)}
            </tr>
            {rows.map(r => (
              <tr key={r.testRow} className="border-b border-surface-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap text-content-primary">
                  #{r.testRow} <span className="text-content-muted">· missed by {r.missedBy}/{LEARNED_IDS.length}</span>
                </td>
                {LEARNED_IDS.map(id => {
                  const pr = r.prob[id];
                  const hit = pr > 0.5;
                  return (
                    <td key={id} className="px-2 py-2 text-right whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded ${hit ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 font-semibold' : 'text-content-muted'}`}>
                        {pr.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
                {SHOW_FEATURES.map(f => <td key={f.key} className="px-2 py-2 text-right whitespace-nowrap text-content-primary">{fmtFeature(r.features[f.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export const UnseenAttackExplorer: React.FC = () => {
  const [category, setCategory] = useState<string>('All');
  const [sortModel, setSortModel] = useState<LearnedId>('xgb');
  const [query, setQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [active, setActive] = useState<UnseenAttackRecord>(UNSEEN_ATTACKS[0]);

  const rows = useMemo(() => {
    const filtered = UNSEEN_ATTACKS.filter(a => (category === 'All' || a.category === category) && a.name.toLowerCase().includes(query.trim().toLowerCase()));
    const key = (a: UnseenAttackRecord) => (sortField === 'count' ? a.count : sortField === 'recall' ? a.results[sortModel].recall : a.name);
    return [...filtered].sort((a, b) => {
      const va = key(a);
      const vb = key(b);
      const c = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortAsc ? c : -c;
    });
  }, [category, query, sortField, sortAsc, sortModel]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortAsc(!sortAsc);
    else {
      setSortField(f);
      setSortAsc(f === 'name');
    }
  };

  const missedByAll = UNSEEN_ATTACKS.filter(a => LEARNED_IDS.every(id => a.results[id].recall === 0));
  const top3 = UNSEEN_ATTACKS.slice(0, 3);
  const top3Share = (top3.reduce((s, a) => s + a.count, 0) / UNSEEN_ATTACKS.reduce((s, a) => s + a.count, 0)) * 100;

  return (
    <section id="explorer" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Telescope className="w-3.5 h-3.5" />
            <span>Unseen attack explorer</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            All 17 unseen attack types, model by model
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Detection rate per unseen attack type at threshold 0.5 (seed 42). {top3.map(a => a.name).join(', ')} make up {top3Share.toFixed(0)}% of
            unseen flows, so they dominate any pooled unseen-recall number. {missedByAll.length} types are missed by every model:{' '}
            {missedByAll.map(a => a.name).join(', ')}.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <label className="relative flex-1">
            <span className="sr-only">Search attack type</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input id="unseen-attack-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search attack type…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-card border border-surface-border text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent-primary" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['All', 'DoS', 'Probe', 'R2L', 'U2R'].map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${category === c ? 'bg-accent-primary text-[color:var(--color-on-accent)] hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary border-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                {c}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-mono text-content-muted">
            sort recall by
            <select id="unseen-sort-model" value={sortModel} onChange={e => setSortModel(e.target.value as LearnedId)}
              className="px-2 py-1.5 rounded-lg bg-surface-card border border-surface-border text-content-primary">
              {LEARNED_IDS.map(id => <option key={id} value={id}>{MODEL_NAMES[id]}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div id="explorer-table" className="lg:col-span-8 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover overflow-x-auto">
            <table className="w-full text-xs font-mono" aria-describedby="unseen-attacks-caption">
              <caption id="unseen-attacks-caption" className="sr-only">Unseen attack types with per-model detection rates</caption>
              <thead>
                <tr className="border-b border-surface-border text-content-muted">
                  <th className="text-left px-3 py-2 font-medium"><button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1">Attack <ArrowUpDown className="w-3 h-3" /></button></th>
                  <th className="text-left px-2 py-2 font-medium">Cat.</th>
                  <th className="text-right px-2 py-2 font-medium"><button type="button" onClick={() => toggleSort('count')} className="inline-flex items-center gap-1">Flows <ArrowUpDown className="w-3 h-3" /></button></th>
                  {LEARNED_IDS.map(id => (
                    <th key={id} className="text-right px-2 py-2 font-medium">
                      {id === sortModel ? <button type="button" onClick={() => toggleSort('recall')} className="inline-flex items-center gap-1">{MODEL_ABBR[id]} <ArrowUpDown className="w-3 h-3" /></button> : MODEL_ABBR[id]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.name} onClick={() => setActive(a)} tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setActive(a)}
                    className={`border-b border-surface-border/50 last:border-0 cursor-pointer ${active.name === a.name ? 'bg-accent-soft' : 'hover:bg-surface-elevated/50'}`}>
                    <td className="px-3 py-2 text-content-primary font-semibold">{a.name}</td>
                    <td className="px-2 py-2 text-content-muted">{a.category}</td>
                    <td className="px-2 py-2 text-right font-num text-content-primary">{a.count.toLocaleString()}</td>
                    {LEARNED_IDS.map(id => {
                      const r = a.results[id].recall;
                      return (
                        <td key={id} className="px-2 py-2 text-right">
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            <span className="hidden sm:inline-block h-1.5 rounded" style={{ width: `${Math.max(r * 0.4, 1)}px`, background: MODEL_COLOR[id] }} />
                            <span className={`font-num ${r === 0 ? 'text-content-muted' : 'text-content-primary'}`}>{r.toFixed(0)}%</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3 + LEARNED_IDS.length} className="px-3 py-6 text-center text-content-muted">No attack type matches that search.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-4 p-5 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover h-fit">
            <div className="text-[10px] font-mono uppercase tracking-wider text-accent-primary">{active.category} · {active.count.toLocaleString()} test flows</div>
            <h3 className="font-serif font-semibold text-xl text-content-primary mt-1">{active.name}</h3>
            <div className="mt-4 space-y-3">
              {LEARNED_IDS.map(id => {
                const r = active.results[id];
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-content-primary">{MODEL_NAMES[id]}</span>
                      <span className="text-content-muted">{r.detected.toLocaleString()} / {active.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 rounded bg-surface-elevated/60 mt-1 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${r.recall}%`, background: MODEL_COLOR[id] }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-content-muted mt-4">
              {active.count < 20 ? 'Fewer than 20 flows: treat these rates as anecdotal.' : 'Rates at threshold 0.5; matched-FPR results are in the Operating points section.'}
            </p>
            <a href="#missed-records" className="group mt-2 inline-flex items-center gap-1 text-[11px] font-mono text-accent-primary hover:underline">
              Inspect missed flows <span className="nudge">→</span>
            </a>
          </div>
        </div>

        <MissedRecords attack={active.name} />
      </div>
    </section>
  );
};
