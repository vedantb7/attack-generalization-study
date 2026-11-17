import React from 'react';
import { Gauge } from 'lucide-react';
import { THRESHOLD_FREE, DEPLOYABLE, LEARNED_IDS, MODEL_NAMES, SEED_SUMMARY } from '../data/researchData';
import { MODEL_COLOR, budgetLabel } from './modelStyle';
import { RocExplorer } from './RocExplorer';

export const OperatingPoints: React.FC = () => {
  const budgets = Object.keys(THRESHOLD_FREE.lr.unseenAtFpr);
  const W = 420;
  const H = 240;
  const px = (k: number) => 60 + (k / (budgets.length - 1)) * (W - 100);
  const py = (v: number) => H - 30 - (v / 100) * (H - 50);

  return (
    <section id="operating" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Gauge className="w-3.5 h-3.5" />
            <span>Operating points</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Unseen-attack detection at a fixed false-alarm budget
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            A detector is deployed at a false-positive budget, not at "threshold 0.5". Comparing models at the same FPR removes the
            operating-point confound. At strict budgets, every model misses most unseen attacks.
          </p>
        </div>

        <RocExplorer />

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          <div id="matched-fpr" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
            <h3 className="font-serif font-semibold text-lg text-content-primary">Matched test FPR (ROC reading)</h3>
            <p className="text-xs text-content-muted mt-1 mb-4">
              Unseen-attack recall when each model's threshold is set so that at most 1, 2 or 5% of test normals are flagged. Used for comparison
              only, since the threshold is read off the test ROC curve.
            </p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl h-auto" role="img" aria-label="Unseen recall at 1, 2 and 5 percent test FPR per model">
              {[0, 25, 50, 75, 100].map(t => (
                <g key={t}>
                  <line x1="60" x2={W - 40} y1={py(t)} y2={py(t)} stroke="var(--chart-grid)" />
                  <text x="52" y={py(t) + 3} textAnchor="end" className="text-[10px] font-mono fill-content-muted">{t}%</text>
                </g>
              ))}
              {budgets.map((b, k) => (
                <text key={b} x={px(k)} y={H - 10} textAnchor="middle" className="text-[10px] font-mono fill-content-muted">FPR ≤ {budgetLabel(b)}</text>
              ))}
              {LEARNED_IDS.map(id => {
                const pts = budgets.map((b, k) => [px(k), py(THRESHOLD_FREE[id].unseenAtFpr[b])] as const);
                return (
                  <g key={id}>
                    <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={MODEL_COLOR[id]} strokeWidth="2.2" />
                    {pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.5" fill={MODEL_COLOR[id]} />)}
                    <text x={pts[pts.length - 1][0] + 6} y={pts[pts.length - 1][1] + 3} className="text-[10px] font-mono" fill={MODEL_COLOR[id]}>
                      {THRESHOLD_FREE[id].unseenAtFpr[budgets[budgets.length - 1]].toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-mono">
              {LEARNED_IDS.map(id => (
                <span key={id} className="inline-flex items-center gap-1.5 text-content-primary">
                  <span className="w-3 h-1.5 rounded" style={{ background: MODEL_COLOR[id] }} />
                  {MODEL_NAMES[id]}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-content-muted mt-3">
              Across {SEED_SUMMARY.lr.unseenAt2.values.length} seeds, mean unseen recall at 2% FPR: {LEARNED_IDS.map(id => `${MODEL_NAMES[id]} ${SEED_SUMMARY[id].unseenAt2.mean.toFixed(1)}% ± ${SEED_SUMMARY[id].unseenAt2.std.toFixed(1)}`).join(' · ')}.
              The Decision Tree outputs only a few distinct scores, so it cannot hit every budget exactly.
            </p>
          </div>

          <div id="deployable-thresholds" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
            <h3 className="font-serif font-semibold text-lg text-content-primary">Deployable thresholds (training data only)</h3>
            <p className="text-xs text-content-muted mt-1 mb-4">
              Thresholds chosen so that 1, 2 or 5% of <em>out-of-fold training</em> normals exceed them, then applied to the test set. This is
              what a practitioner could actually do. Test normals score higher than training normals, so the realised FPR overshoots the target.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-border text-content-muted">
                    <th className="text-left py-2 pr-2 font-medium">Model</th>
                    {DEPLOYABLE.lr.map(p => (
                      <th key={p.budget} className="text-right py-2 px-2 font-medium whitespace-nowrap">target {budgetLabel(p.budget)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LEARNED_IDS.map(id => (
                    <tr key={id} className="border-b border-surface-border/50 last:border-0 align-top hover:bg-surface-elevated/50 transition-colors">
                      <td className="py-2 pr-2 text-content-primary whitespace-nowrap">
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: MODEL_COLOR[id] }} />
                        {MODEL_NAMES[id]}
                      </td>
                      {DEPLOYABLE[id].map(p => (
                        <td key={p.budget} className="py-2 px-2 text-right whitespace-nowrap">
                          <div className="font-num text-content-primary">FPR {p.fpr.toFixed(1)}%</div>
                          <div className="text-[10px] text-content-muted">unseen {p.unseenRecall.toFixed(1)}%</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-content-muted mt-3">
              Random Forest is the worst calibrated: a 1% target gives {DEPLOYABLE.rf[0].fpr.toFixed(1)}% realised FPR. Its high unseen recall here is
              bought with that FPR, which is why matched-FPR comparisons (left) are the fairer view.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
