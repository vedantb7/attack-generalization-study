import React, { useMemo, useState } from 'react';
import { Sigma, ChevronDown, ChevronUp } from 'lucide-react';
import { STATISTICAL_TESTS, SEED_PAIRS, PROTOCOL, MODEL_NAMES } from '../data/researchData';
import { MODEL_ABBR, fmtP } from './modelStyle';

type Tab = 'bootstrap' | 'mcnemar' | 'seeds';

const SEED_METRIC: Record<string, string> = {
  auc_unseen_vs_normal: 'Δ AUC unseen vs normal',
  'unseen_recall@test_fpr_2pct': 'Δ unseen recall @2% FPR (pp)',
  unseen_recall: 'Δ unseen recall @0.5 (pp)',
};

export const StatisticalAnalysis: React.FC = () => {
  const [tab, setTab] = useState<Tab>('bootstrap');
  const [showMethods, setShowMethods] = useState<boolean>(false);
  const bootstrapMetrics = useMemo(() => Array.from(new Set(STATISTICAL_TESTS.filter(t => t.family === 'Paired bootstrap').map(t => t.metric))), []);
  const [metric, setMetric] = useState<string>(bootstrapMetrics.find(m => m.includes('AUC')) ?? bootstrapMetrics[0]);

  const bootRows = STATISTICAL_TESTS.filter(t => t.family === 'Paired bootstrap' && t.metric === metric);
  const mcRows = STATISTICAL_TESTS.filter(t => t.family.startsWith('McNemar'));
  const pair = (a: string, b: string) => `${MODEL_NAMES[a as keyof typeof MODEL_NAMES]} − ${MODEL_NAMES[b as keyof typeof MODEL_NAMES]}`;
  const sigBadge = (s: boolean) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${s ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-surface-elevated text-content-muted border-surface-border'}`}>
      {s ? 'significant' : 'n.s.'}
    </span>
  );
  const fmtEffect = (m: string, v: number) => (m.includes('AUC') || m.includes('Macro') ? v.toFixed(4) : v.toFixed(2));

  return (
    <section id="statistics" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Sigma className="w-3.5 h-3.5" />
            <span>Statistical significance</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            {PROTOCOL.nSignificant} of {PROTOCOL.nTests} paired tests significant after Holm correction
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Paired bootstrap ({PROTOCOL.bootstraps.toLocaleString()} resamples of test rows) and McNemar tests on the primary seed, corrected together
            for multiple comparisons, plus seed-level differences across {PROTOCOL.seeds.length} end-to-end runs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-5" role="tablist">
          {([['bootstrap', 'Paired bootstrap'], ['mcnemar', 'McNemar'], ['seeds', 'Across seeds']] as [Tab, string][]).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${tab === k ? 'bg-accent-primary text-white border-accent-primary' : 'border-surface-border text-content-muted hover:text-content-primary'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-surface-card border border-surface-border shadow-sm overflow-x-auto">
          {tab === 'bootstrap' && (
            <>
              <div className="flex flex-wrap gap-1.5 px-4 pt-4">
                {bootstrapMetrics.map(m => (
                  <button key={m} type="button" onClick={() => setMetric(m)} aria-pressed={metric === m}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${metric === m ? 'bg-accent-soft text-accent-primary border-accent-border font-semibold' : 'border-surface-border text-content-muted hover:text-content-primary'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <table className="w-full text-xs font-mono mt-2" aria-describedby="bootstrap-table-caption">
                <caption id="bootstrap-table-caption" className="text-left px-4 py-2 text-content-muted">{metric}: A − B on the same resampled rows, seed 42.</caption>
                <thead><tr className="border-b border-surface-border text-content-muted">
                  <th className="text-left px-4 py-2 font-medium">A − B</th><th className="text-right px-3 py-2 font-medium">Δ</th>
                  <th className="text-right px-3 py-2 font-medium">95% CI</th><th className="text-right px-3 py-2 font-medium">p (Holm)</th><th className="text-right px-4 py-2 font-medium" />
                </tr></thead>
                <tbody>
                  {bootRows.map(t => (
                    <tr key={`${t.a}-${t.b}`} className="border-b border-surface-border/50 last:border-0">
                      <td className="px-4 py-2 text-content-primary whitespace-nowrap">{pair(t.a, t.b)}</td>
                      <td className="px-3 py-2 text-right font-num text-content-primary">{t.effect > 0 ? '+' : ''}{fmtEffect(metric, t.effect)}</td>
                      <td className="px-3 py-2 text-right font-num text-content-muted whitespace-nowrap">{t.ci ? `[${fmtEffect(metric, t.ci[0])}, ${fmtEffect(metric, t.ci[1])}]` : ''}</td>
                      <td className="px-3 py-2 text-right font-num text-content-primary">{fmtP(t.pHolm)}</td>
                      <td className="px-4 py-2 text-right">{sigBadge(t.significant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'mcnemar' && (
            <table className="w-full text-xs font-mono" aria-describedby="mcnemar-full-caption">
              <caption id="mcnemar-full-caption" className="text-left px-4 py-3 text-content-muted">
                McNemar (Edwards correction). Two-sided: tests whether two models make different errors, not which is better. "A right / B right" counts the discordant flows.
              </caption>
              <thead><tr className="border-b border-surface-border text-content-muted">
                <th className="text-left px-4 py-2 font-medium">Rows</th><th className="text-left px-3 py-2 font-medium">A vs B</th>
                <th className="text-right px-3 py-2 font-medium">A right / B right</th><th className="text-right px-3 py-2 font-medium">χ²</th>
                <th className="text-right px-3 py-2 font-medium">p (Holm)</th><th className="text-right px-4 py-2 font-medium" />
              </tr></thead>
              <tbody>
                {mcRows.map(t => (
                  <tr key={`${t.family}-${t.a}-${t.b}`} className="border-b border-surface-border/50 last:border-0">
                    <td className="px-4 py-2 text-content-muted whitespace-nowrap">{t.family.includes('unseen') ? 'unseen (3,750)' : 'all (22,543)'}</td>
                    <td className="px-3 py-2 text-content-primary whitespace-nowrap">{MODEL_ABBR[t.a]} vs {MODEL_ABBR[t.b]}</td>
                    <td className="px-3 py-2 text-right font-num text-content-primary">{t.aBetter?.toLocaleString()} / {t.bBetter?.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-num text-content-primary">{t.effect.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right font-num text-content-primary">{fmtP(t.pHolm)}</td>
                    <td className="px-4 py-2 text-right">{sigBadge(t.significant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'seeds' && (
            <table className="w-full text-xs font-mono">
              <caption className="text-left px-4 py-3 text-content-muted">
                Mean ± SD of the per-seed difference A − B over {PROTOCOL.seeds.length} end-to-end runs, and the number of seeds where A is higher.
              </caption>
              <thead><tr className="border-b border-surface-border text-content-muted">
                <th className="text-left px-4 py-2 font-medium">A − B</th><th className="text-left px-3 py-2 font-medium">Metric</th>
                <th className="text-right px-3 py-2 font-medium">Mean ± SD</th><th className="text-right px-4 py-2 font-medium">A higher</th>
              </tr></thead>
              <tbody>
                {SEED_PAIRS.map(p => (
                  <tr key={`${p.a}-${p.b}-${p.metric}`} className="border-b border-surface-border/50 last:border-0">
                    <td className="px-4 py-2 text-content-primary whitespace-nowrap">{MODEL_ABBR[p.a]} − {MODEL_ABBR[p.b]}</td>
                    <td className="px-3 py-2 text-content-muted whitespace-nowrap">{SEED_METRIC[p.metric] ?? p.metric}</td>
                    <td className="px-3 py-2 text-right font-num text-content-primary whitespace-nowrap">
                      {p.meanDiff > 0 ? '+' : ''}{p.metric.startsWith('auc') ? p.meanDiff.toFixed(4) : p.meanDiff.toFixed(1)} ± {p.metric.startsWith('auc') ? p.sdDiff.toFixed(4) : p.sdDiff.toFixed(1)}
                    </td>
                    <td className="px-4 py-2 text-right font-num text-content-primary">{p.aWins}/{p.nSeeds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button type="button" onClick={() => setShowMethods(!showMethods)} aria-expanded={showMethods} className="mt-4 text-xs font-mono text-content-muted hover:text-content-primary inline-flex items-center gap-1">
          {showMethods ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Methods
        </button>
        {showMethods && (
          <div className="mt-3 p-4 rounded-lg bg-surface-elevated border border-surface-border text-xs text-content-muted space-y-1.5 leading-relaxed">
            <p>Paired bootstrap: {PROTOCOL.bootstraps.toLocaleString()} resamples of the 22,543 test rows, the same rows for both models. The matched-FPR metric re-chooses each model's threshold inside every resample. p-values use (count + 1)/(B + 1), so the smallest attainable value is about {(1 / (PROTOCOL.bootstraps + 1)).toFixed(4)}.</p>
            <p>Holm–Bonferroni is applied over all {PROTOCOL.nTests} two-sided tests together (12 McNemar + 24 bootstrap).</p>
            <p>These tests capture test-set sampling on one seed. Seed-to-seed variation is shown separately, and uncertainty over which unseen attack types are in the test set is in the generalization section.</p>
          </div>
        )}
      </div>
    </section>
  );
};
