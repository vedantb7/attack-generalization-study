import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { LEARNED_IDS, MODEL_NAMES, THRESHOLD_FREE, OVERALL_METRICS, SEED_SUMMARY, STATISTICAL_TESTS, SEED_PAIRS, LearnedId } from '../data/researchData';
import { MODEL_COLOR, fmtP } from './modelStyle';

type Row = { label: string; a: number; b: number; unit: 'auc' | 'pct' | 'score'; higher: boolean; note?: string };

const ORDER: LearnedId[] = ['lr', 'dt', 'rf', 'xgb'];

/** Tests are stored for one pair order (lr<dt<rf<xgb); flip sign when the user picks the reverse. */
function pairTests(a: LearnedId, b: LearnedId) {
  const flipped = ORDER.indexOf(a) > ORDER.indexOf(b);
  const [x, y] = flipped ? [b, a] : [a, b];
  const rows = STATISTICAL_TESTS.filter(t => t.a === x && t.b === y);
  return rows.map(t => {
    if (!flipped || t.family.startsWith('McNemar')) return { ...t, effectAB: t.effect, ciAB: t.ci };
    return { ...t, effectAB: -t.effect, ciAB: t.ci ? ([-t.ci[1], -t.ci[0]] as [number, number]) : null };
  });
}

function seedWins(a: LearnedId, b: LearnedId, metric: string) {
  const direct = SEED_PAIRS.find(p => p.a === a && p.b === b && p.metric === metric);
  if (direct) return { wins: direct.aWins, n: direct.nSeeds };
  const rev = SEED_PAIRS.find(p => p.a === b && p.b === a && p.metric === metric);
  return rev ? { wins: rev.nSeeds - rev.aWins, n: rev.nSeeds } : null;
}

const Picker: React.FC<{ value: LearnedId; onChange: (v: LearnedId) => void; label: string }> = ({ value, onChange, label }) => (
  <div className="flex-1 min-w-0">
    <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted mb-1.5">{label}</div>
    <div className="grid grid-cols-2 gap-1.5">
      {LEARNED_IDS.map(id => (
        <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={value === id}
          className={`btn-press flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-mono border text-left ${value === id ? 'bg-accent-primary text-[color:var(--color-on-accent)] border-accent-primary hover:bg-surface-elevated hover:text-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-surface-card" style={{ background: MODEL_COLOR[id] }} />
          <span className="truncate">{MODEL_NAMES[id]}</span>
        </button>
      ))}
    </div>
  </div>
);


export const HeadToHead: React.FC = () => {
  const [a, setA] = useState<LearnedId>('xgb');
  const [b, setB] = useState<LearnedId>('dt');
  const metric = (key: string) => OVERALL_METRICS.find(m => m.key === key);

  const rows: Row[] = [
    { label: 'AUC unseen vs normal (5-seed mean)', a: SEED_SUMMARY[a].aucUnseen.mean, b: SEED_SUMMARY[b].aucUnseen.mean, unit: 'auc', higher: true },
    { label: 'AUC seen vs normal', a: THRESHOLD_FREE[a].aucSeen, b: THRESHOLD_FREE[b].aucSeen, unit: 'auc', higher: true },
    { label: 'Unseen recall @2% FPR (5-seed mean)', a: SEED_SUMMARY[a].unseenAt2.mean, b: SEED_SUMMARY[b].unseenAt2.mean, unit: 'pct', higher: true },
    { label: 'ROC-AUC (all test rows)', a: THRESHOLD_FREE[a].rocAuc, b: THRESHOLD_FREE[b].rocAuc, unit: 'auc', higher: true },
    { label: 'Macro-F1 @0.5', a: metric('macro_f1')!.values[a], b: metric('macro_f1')!.values[b], unit: 'score', higher: true },
    { label: 'False-positive rate @0.5', a: metric('fpr')!.values[a], b: metric('fpr')!.values[b], unit: 'pct', higher: false },
    { label: 'Unseen recall @0.5 (5-seed mean)', a: SEED_SUMMARY[a].unseenRecall.mean, b: SEED_SUMMARY[b].unseenRecall.mean, unit: 'pct', higher: true },
  ];
  const fmt = (v: number, u: Row['unit']) => (u === 'pct' ? `${v.toFixed(1)}%` : v.toFixed(u === 'auc' ? 3 : 4));
  const aWinsRows = rows.filter(r => (r.higher ? r.a > r.b : r.a < r.b)).length;
  const tests = a === b ? [] : pairTests(a, b);
  const aucWins = a === b ? null : seedWins(a, b, 'auc_unseen_vs_normal');

  return (
    <section id="compare" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Head-to-head</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">Compare any two models</h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Pick two models to see where each one wins, whether the difference is statistically significant, and how often it holds across seeds.
          </p>
        </div>

        <div id="compare-picker" className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <Picker value={a} onChange={setA} label="Model A" />
            <button type="button" onClick={() => { setA(b); setB(a); }} aria-label="Swap models"
              className="btn-press self-center md:mb-1 p-2 rounded-full border border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary hover:rotate-180 transition-transform duration-300">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <Picker value={b} onChange={setB} label="Model B" />
          </div>
        </div>

        {a === b ? (
          <p className="p-5 rounded-xl border border-dashed border-surface-border text-sm text-content-muted text-center">Pick two different models to compare.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div id="compare-metrics" className="lg:col-span-3 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover overflow-x-auto">
              <div className="px-4 pt-4 pb-2 text-xs text-content-muted">
                <strong className="text-content-primary">{MODEL_NAMES[a]}</strong> is better on {aWinsRows} of {rows.length} measures;{' '}
                <strong className="text-content-primary">{MODEL_NAMES[b]}</strong> on {rows.length - aWinsRows}.
              </div>
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-border text-content-muted">
                    <th className="text-left px-4 py-2 font-medium">Measure</th>
                    <th className="text-right px-3 py-2 font-medium whitespace-nowrap"><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: MODEL_COLOR[a] }} />A</th>
                    <th className="text-right px-3 py-2 font-medium whitespace-nowrap"><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: MODEL_COLOR[b] }} />B</th>
                    <th className="text-left px-3 py-2 font-medium w-[34%]">Which is better</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const aBetter = r.higher ? r.a > r.b : r.a < r.b;
                    const tie = r.a === r.b;
                    const span = Math.abs(r.a - r.b);
                    const scale = r.unit === 'pct' ? span / 30 : span / 0.25;
                    return (
                      <tr key={r.label} className="border-b border-surface-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                        <td className="px-4 py-2.5 text-content-primary">{r.label}</td>
                        <td className={`px-3 py-2.5 text-right font-num whitespace-nowrap ${aBetter && !tie ? 'font-bold text-content-primary' : 'text-content-muted'}`}>{fmt(r.a, r.unit)}</td>
                        <td className={`px-3 py-2.5 text-right font-num whitespace-nowrap ${!aBetter && !tie ? 'font-bold text-content-primary' : 'text-content-muted'}`}>{fmt(r.b, r.unit)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="relative h-1.5 flex-1 rounded bg-surface-elevated">
                              <div className="absolute top-0 h-full rounded transition-all duration-300"
                                style={{ width: `${Math.min(50, scale * 50)}%`, left: aBetter ? `${50 - Math.min(50, scale * 50)}%` : '50%', background: MODEL_COLOR[aBetter ? a : b] }} />
                              <div className="absolute left-1/2 -top-1 h-3.5 w-px bg-content-muted" />
                            </div>
                            <span className="w-6 text-[10px] text-content-muted">{tie ? '=' : aBetter ? 'A' : 'B'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-4 pb-3 pt-1 text-[10px] text-content-muted">Bars point toward the better model; length shows the size of the gap. Single-seed rows use seed 42.</p>
            </div>

            <div id="compare-tests" className="lg:col-span-2 space-y-3">
              {aucWins && (
                <div className="card-lift p-4 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted">Across seeds</div>
                  <div className="mt-1 text-sm text-content-primary">
                    <strong>{MODEL_NAMES[a]}</strong> has the higher unseen-vs-normal AUC in{' '}
                    <strong className="font-num">{aucWins.wins} of {aucWins.n}</strong> seeds.
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: aucWins.n }).map((_, i) => (
                      <span key={i} className="h-2 flex-1 rounded" style={{ background: MODEL_COLOR[i < aucWins.wins ? a : b] }} />
                    ))}
                  </div>
                </div>
              )}
              <div className="card-lift p-4 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
                <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted mb-2">Paired tests, seed 42 (Holm-corrected)</div>
                <ul className="space-y-1.5">
                  {tests.map(t => (
                    <li key={`${t.family}-${t.metric}`} className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-content-primary truncate" title={t.family}>
                        {t.family.startsWith('McNemar') ? `McNemar · ${t.family.includes('unseen') ? 'unseen rows' : 'all rows'}` : t.metric.replace('Δ ', 'Δ(A−B) ')}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {!t.family.startsWith('McNemar') && (
                          <span className="font-num text-content-muted">{t.effectAB > 0 ? '+' : ''}{Math.abs(t.effectAB) < 1 ? t.effectAB.toFixed(3) : t.effectAB.toFixed(1)}</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded border ${t.significant ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-surface-elevated text-content-muted border-surface-border'}`}>
                          p {fmtP(t.pHolm)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
