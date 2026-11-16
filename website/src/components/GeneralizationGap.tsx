import React, { useState } from 'react';
import { GitCompare, ShieldAlert } from 'lucide-react';
import { GENERALIZATION_DATA } from '../data/researchData';

export const GeneralizationGap: React.FC = () => {
  const [activeModel, setActiveModel] = useState<'all' | 'dt' | 'rf' | 'lr'>('all');

  const models = [
    {
      id: 'dt',
      name: 'Decision Tree (CART)',
      short: 'Decision Tree',
      seen: GENERALIZATION_DATA.seenRecall.dt,
      seenCI: GENERALIZATION_DATA.seenRecall.dtCI,
      unseen: GENERALIZATION_DATA.unseenRecall.dt,
      unseenCI: GENERALIZATION_DATA.unseenRecall.dtCI,
      drop: GENERALIZATION_DATA.generalizationDropPp.dt,
      dropCI: GENERALIZATION_DATA.generalizationDropPp.dtCI,
      color: '#541C32',
      badge: 'Highest Unseen Recall (53.36%)',
      isHero: true
    },
    {
      id: 'lr',
      name: 'Logistic Regression',
      short: 'Logistic Reg.',
      seen: GENERALIZATION_DATA.seenRecall.lr,
      seenCI: GENERALIZATION_DATA.seenRecall.lrCI,
      unseen: GENERALIZATION_DATA.unseenRecall.lr,
      unseenCI: GENERALIZATION_DATA.unseenRecall.lrCI,
      drop: GENERALIZATION_DATA.generalizationDropPp.lr,
      dropCI: GENERALIZATION_DATA.generalizationDropPp.lrCI,
      color: '#B77C88',
      badge: 'Moderate Drop (29.44 pp)',
      isHero: false
    },
    {
      id: 'rf',
      name: 'Random Forest',
      short: 'Random Forest',
      seen: GENERALIZATION_DATA.seenRecall.rf,
      seenCI: GENERALIZATION_DATA.seenRecall.rfCI,
      unseen: GENERALIZATION_DATA.unseenRecall.rf,
      unseenCI: GENERALIZATION_DATA.unseenRecall.rfCI,
      drop: GENERALIZATION_DATA.generalizationDropPp.rf,
      dropCI: GENERALIZATION_DATA.generalizationDropPp.rfCI,
      color: '#351321',
      badge: 'Severe Collapse (52.66 pp drop)',
      isHero: false
    }
  ];

  return (
    <section id="generalization" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Central Research Finding</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Seen vs. Unseen Generalization: The 52.66 pp Ensemble Drop
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            We isolate the 9,083 test flows belonging to the 22 training attack types from the 3,750 test flows belonging to the 17 test-only attack types. The divergence reveals a dramatic breakdown in ensemble generalization.
          </p>
        </div>

        {/* Model Filter Pills */}
        <div className="flex items-center gap-2 mb-8 pb-3 border-b border-surface-border">
          <span className="text-xs font-mono text-content-muted mr-1">Filter View:</span>
          {(['all', 'dt', 'lr', 'rf'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setActiveModel(k)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors border ${
                activeModel === k
                  ? 'border-accent-primary bg-accent-soft text-accent-primary font-bold shadow-sm'
                  : 'border-surface-border bg-surface-card text-content-muted hover:text-content-primary'
              }`}
            >
              {k === 'all' ? 'All Models' : k === 'dt' ? 'Decision Tree' : k === 'lr' ? 'Logistic Regression' : 'Random Forest'}
            </button>
          ))}
        </div>

        {/* Interactive Paired Slope Chart (SVG) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-center">
          {/* Slope Chart */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <span className="font-mono text-xs text-content-muted uppercase tracking-wider block">Slope Chart</span>
                <h3 className="font-serif font-semibold text-lg text-content-primary">
                  The Seen &rarr; Unseen Slope Divergence
                </h3>
              </div>
              <span className="text-xs font-mono text-content-muted">
                95% Percentile Bootstrap CIs
              </span>
            </div>

            {/* Custom Slope Chart SVG */}
            <div className="relative aspect-[16/10] w-full pt-4">
              <svg viewBox="0 0 500 300" className="w-full h-full" aria-label="Paired slope chart showing seen vs unseen recall drop for all models">
                {/* Horizontal reference grid lines */}
                {[0, 20, 40, 60, 80, 100].map(val => {
                  const y = 260 - (val / 100) * 220;
                  return (
                    <g key={val}>
                      <line x1="80" y1={y} x2="420" y2={y} stroke="currentColor" strokeWidth="0.5" className="text-surface-border" />
                      <text x="70" y={y + 4} textAnchor="end" className="text-[10px] font-mono fill-content-muted">{val}%</text>
                    </g>
                  );
                })}

                {/* Vertical Axis Columns */}
                <line x1="120" y1="40" x2="120" y2="260" stroke="currentColor" strokeWidth="1.5" className="text-surface-border" />
                <line x1="380" y1="40" x2="380" y2="260" stroke="currentColor" strokeWidth="1.5" className="text-surface-border" />

                <text x="120" y="25" textAnchor="middle" className="text-xs font-mono font-bold fill-content-primary">
                  Seen Attacks (n=9,083)
                </text>
                <text x="380" y="25" textAnchor="middle" className="text-xs font-mono font-bold fill-content-primary">
                  Unseen Attacks (n=3,750)
                </text>

                {/* Decision Tree Slope Line */}
                {(activeModel === 'all' || activeModel === 'dt') && (
                  <g className="transition-opacity duration-300">
                    <line
                      x1="120"
                      y1={260 - (82.40 / 100) * 220}
                      x2="380"
                      y2={260 - (53.36 / 100) * 220}
                      stroke="#541C32"
                      strokeWidth="3.5"
                    />
                    <circle cx="120" cy={260 - (82.40 / 100) * 220} r="5" fill="#541C32" />
                    <circle cx="380" cy={260 - (53.36 / 100) * 220} r="5" fill="#541C32" />
                    <text x="130" y={260 - (82.40 / 100) * 220 - 6} className="text-xs font-mono font-bold fill-accent-primary">
                      DT 82.40%
                    </text>
                    <text x="390" y={260 - (53.36 / 100) * 220 + 4} className="text-xs font-mono font-bold fill-accent-primary">
                      DT 53.36% (-29.04 pp)
                    </text>
                  </g>
                )}

                {/* Logistic Regression Slope Line */}
                {(activeModel === 'all' || activeModel === 'lr') && (
                  <g className="transition-opacity duration-300">
                    <line
                      x1="120"
                      y1={260 - (71.52 / 100) * 220}
                      x2="380"
                      y2={260 - (42.08 / 100) * 220}
                      stroke="#B77C88"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx="120" cy={260 - (71.52 / 100) * 220} r="4.5" fill="#B77C88" />
                    <circle cx="380" cy={260 - (42.08 / 100) * 220} r="4.5" fill="#B77C88" />
                    <text x="130" y={260 - (71.52 / 100) * 220 + 12} className="text-[11px] font-mono fill-content-secondary">
                      LR 71.52%
                    </text>
                    <text x="390" y={260 - (42.08 / 100) * 220 + 4} className="text-[11px] font-mono fill-content-secondary">
                      LR 42.08% (-29.44 pp)
                    </text>
                  </g>
                )}

                {/* Random Forest Slope Line (Steep collapse) */}
                {(activeModel === 'all' || activeModel === 'rf') && (
                  <g className="transition-opacity duration-300">
                    <line
                      x1="120"
                      y1={260 - (75.91 / 100) * 220}
                      x2="380"
                      y2={260 - (23.25 / 100) * 220}
                      stroke="#282326"
                      strokeWidth="3"
                    />
                    <circle cx="120" cy={260 - (75.91 / 100) * 220} r="5" fill="#282326" />
                    <circle cx="380" cy={260 - (23.25 / 100) * 220} r="5" fill="#282326" />
                    <text x="130" y={260 - (75.91 / 100) * 220 - 4} className="text-xs font-mono font-bold fill-content-primary">
                      RF 75.91%
                    </text>
                    <text x="390" y={260 - (23.25 / 100) * 220 + 4} className="text-xs font-mono font-bold fill-rose-600 dark:text-rose-400">
                      RF 23.25% (-52.66 pp!)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-content-muted pt-3 border-t border-surface-border">
              <span>Steeper negative slope = more severe generalization degradation</span>
              <span>1,000 Bootstrap Resamples</span>
            </div>
          </div>

          {/* Right: Key Deductions & Confidence Intervals */}
          <div className="lg:col-span-5 space-y-4">
            {models.map(m => (
              <div
                key={m.id}
                className={`p-5 rounded-xl border transition-all ${
                  m.isHero
                    ? 'border-accent-primary bg-surface-card shadow-md ring-1 ring-accent-primary'
                    : 'border-surface-border bg-surface-card'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold text-base text-content-primary">{m.short}</span>
                    {m.isHero && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-soft text-accent-primary border border-accent-border">
                        Benchmark Winner
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-content-muted">{m.badge}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 text-center font-num text-xs">
                  <div className="p-2 rounded bg-surface-elevated/50">
                    <span className="text-[10px] font-mono text-content-muted block">Seen Recall</span>
                    <span className="font-bold text-content-primary">{m.seen.toFixed(2)}%</span>
                    <span className="text-[9px] text-content-muted block">[{m.seenCI[0]}, {m.seenCI[1]}]</span>
                  </div>
                  <div className="p-2 rounded bg-surface-elevated/50">
                    <span className="text-[10px] font-mono text-content-muted block">Unseen Recall</span>
                    <span className={`font-bold ${m.isHero ? 'text-accent-primary' : 'text-content-primary'}`}>
                      {m.unseen.toFixed(2)}%
                    </span>
                    <span className="text-[9px] text-content-muted block">[{m.unseenCI[0]}, {m.unseenCI[1]}]</span>
                  </div>
                  <div className="p-2 rounded bg-surface-elevated/50">
                    <span className="text-[10px] font-mono text-content-muted block">Drop (pp)</span>
                    <span className={`font-bold ${m.id === 'rf' ? 'text-rose-600 dark:text-rose-400' : 'text-content-primary'}`}>
                      {m.drop.toFixed(2)} pp
                    </span>
                    <span className="text-[9px] text-content-muted block">[{m.dropCI[0]}, {m.dropCI[1]}]</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative Conclusion on Research Hypothesis */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-serif font-semibold text-base sm:text-lg text-content-primary">
            <ShieldAlert className="w-5 h-5 text-accent-primary" />
            <span>Does Model Complexity Cause Generalization Failure?</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-content-muted leading-relaxed font-light">
            <p>
              <strong className="text-content-primary font-semibold">1. Empirical Evidence for Memorization:</strong> Random Forest experiences a massive 52.66 percentage point collapse on novel attacks. Its randomized feature projection creates narrow, localized decision envelopes around training clusters. When an attack shifts into adjacent subspace dimensions, the ensemble fails to trigger.
            </p>
            <p>
              <strong className="text-content-primary font-semibold">2. The Complexity Nuance:</strong> Decision Tree is also non-linear and parameterized with depth up to 30, yet it achieved the best generalization (53.36% unseen recall). Therefore, <strong className="text-content-primary font-semibold">expressive capacity alone does not cause failure</strong>. Rather, how the model partitions the global continuous traffic space (global axis splits vs. randomized local subspace averaging) determines whether novel traffic is captured.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
