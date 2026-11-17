import React, { useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { GENERALIZATION_DATA as G, KNOWN_CV, LEARNED_IDS, MODEL_NAMES, LearnedId } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

export const GeneralizationGap: React.FC = () => {
  const lo = 0.65;
  const hi = 1.0;
  const x = (v: number) => 150 + ((v - lo) / (hi - lo)) * 232;
  const aucSeen = G.aucSeen as Record<LearnedId, number>;
  const aucUnseen = G.aucUnseen as Record<LearnedId, number>;
  const [hover, setHover] = useState<LearnedId | null>(null);
  const [mode, setMode] = useState<'cv' | 'seen'>('cv');
  const knownAuc = (id: LearnedId) => (mode === 'cv' ? KNOWN_CV[id].rocAuc : aucSeen[id]);
  const knownLabel = mode === 'cv' ? 'known (CV on KDDTrain+)' : 'seen types in KDDTest+';

  return (
    <section id="generalization" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Generalization gap</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            From seen to unseen attack types ({G.totalSeen.toLocaleString()} vs {G.totalUnseen.toLocaleString()} test flows)
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Every model gets worse on unseen attack types, but how much depends on the measure. A small drop is not the same as good
            generalization: a model that already separates seen attacks poorly has little to lose.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="auc-gap" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-serif font-semibold text-lg text-content-primary">Known vs unseen: ROC-AUC</h3>
              <div className="flex gap-1" role="radiogroup" aria-label="Definition of known performance">
                {([['cv', 'Known: CV on KDDTrain+'], ['seen', 'Known: seen types in test']] as const).map(([k, label]) => (
                  <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${mode === k ? 'bg-accent-primary text-[color:var(--color-on-accent)] border-accent-primary hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-content-muted mt-2 mb-4">
              Hollow = {knownLabel}, filled = unseen attack types vs test normals (seed 42). {mode === 'cv'
                ? 'This is the gap as the proposal defined it: stratified 5-fold CV on KDDTrain+ (every attack type seen in training) against the 17 test-only types.'
                : 'Here "known" means the attack types that also occur in training, scored on the test set.'}
            </p>
            <div className="relative" onMouseLeave={() => setHover(null)}>
            <svg viewBox="0 0 400 210" className="w-full h-auto" role="img" aria-label="Seen and unseen AUC per model">
              {[0.7, 0.8, 0.9, 1.0].map(t => (
                <g key={t}>
                  <line x1={x(t)} x2={x(t)} y1="10" y2="180" stroke="var(--chart-grid)" />
                  <text x={x(t)} y="196" textAnchor="middle" className="text-[10px] font-mono fill-content-muted">{t.toFixed(1)}</text>
                </g>
              ))}
              {LEARNED_IDS.map((id, k) => {
                const y = 30 + k * 42;
                return (
                  <g key={id} opacity={hover && hover !== id ? 0.3 : 1} style={{ transition: 'opacity 150ms' }}>
                    <rect x="0" y={y - 18} width="400" height="38" fill="transparent" onMouseEnter={() => setHover(id)} />
                    <text x="142" y={y + 4} textAnchor="end" className="text-[11px] font-mono fill-content-primary">{MODEL_NAMES[id]}</text>
                    <line x1={x(aucUnseen[id])} x2={x(knownAuc(id))} y1={y} y2={y} stroke={MODEL_COLOR[id]} strokeWidth="2" style={{ transition: 'all 250ms' }} />
                    <circle cx={x(knownAuc(id))} cy={y} r="5" fill="var(--color-surface)" stroke={MODEL_COLOR[id]} strokeWidth="2" style={{ transition: 'cx 250ms' }} />
                    <circle cx={x(aucUnseen[id])} cy={y} r="5" fill={MODEL_COLOR[id]} />
                    <text x={x(aucUnseen[id])} y={y + 17} textAnchor="middle" className="text-[9px] font-mono fill-content-muted">
                      −{(knownAuc(id) - aucUnseen[id]).toFixed(3)}
                    </text>
                  </g>
                );
              })}
            </svg>
            {hover && (
              <div className="chart-tip" style={{ left: '40%', top: `${((30 + LEARNED_IDS.indexOf(hover) * 42 + 22) / 210) * 100}%` }}>
                <div className="font-semibold text-content-primary">{MODEL_NAMES[hover]}</div>
                <div>{knownLabel} {knownAuc(hover).toFixed(4)}</div>
                <div>unseen vs normal {aucUnseen[hover].toFixed(4)}</div>
                <div className="text-content-muted">gap {(knownAuc(hover) - aucUnseen[hover]).toFixed(4)}</div>
                {mode === 'cv' && <div className="text-content-muted">CV fold SD {KNOWN_CV[hover].rocAucFoldStd.toFixed(4)}</div>}
              </div>
            )}
            </div>
            <p className="text-[11px] text-content-muted mt-2">
              {mode === 'cv'
                ? `Every model is near-perfect on known attacks (CV AUC ${Math.min(...LEARNED_IDS.map(i => KNOWN_CV[i].rocAuc)).toFixed(3)}–${Math.max(...LEARNED_IDS.map(i => KNOWN_CV[i].rocAuc)).toFixed(3)}) and loses ranking quality on unseen types. The ensembles lose least in absolute terms and stay highest; the Decision Tree loses most.`
                : `LR barely drops (${aucSeen.lr.toFixed(3)} → ${aucUnseen.lr.toFixed(3)}) because its seen-attack AUC is already the lowest. The ensembles drop more but stay highest on unseen attacks. The Decision Tree drops most.`}
            </p>
          </div>

          <div id="recall-gap" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
            <h3 className="font-serif font-semibold text-lg text-content-primary">Detection rate at threshold 0.5</h3>
            <p className="text-xs text-content-muted mt-1 mb-4">
              Thin bar = row-bootstrap 95% CI (test sampling). Wide band = attack-type cluster CI, which resamples the 17 unseen types.
            </p>
            <div className="space-y-4">
              {LEARNED_IDS.map(id => {
                const row = (G.unseenRowCI as Record<LearnedId, [number, number]>)[id];
                const cl = (G.unseenClusterCI as Record<LearnedId, [number, number]>)[id];
                return (
                  <div key={id} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-content-primary">{MODEL_NAMES[id]}</span>
                      <span className="text-content-muted">
                        drop {G.dropPp[id].toFixed(1)} pp · reweighted {(G.reweightedDropPp as Record<LearnedId, number>)[id].toFixed(1)} pp
                      </span>
                    </div>
                    {(['seen', 'unseen'] as const).map(part => {
                      const v = part === 'seen' ? G.seenRecall[id] : G.unseenRecall[id];
                      return (
                        <div key={part} className="grid grid-cols-[52px_1fr_48px] items-center gap-2 text-[11px] font-mono">
                          <span className="text-content-muted">{part}</span>
                          <div className="relative h-3.5 rounded bg-surface-elevated/60">
                            {part === 'unseen' && (
                              <div className="absolute top-0 h-full rounded opacity-25" style={{ left: `${cl[0]}%`, width: `${cl[1] - cl[0]}%`, background: MODEL_COLOR[id] }} />
                            )}
                            <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded" style={{ width: `${v}%`, background: MODEL_COLOR[id] }} />
                            {part === 'unseen' && (
                              <div className="absolute top-0 h-full border-x border-content-primary" style={{ left: `${row[0]}%`, width: `${Math.max(row[1] - row[0], 0.4)}%` }} />
                            )}
                          </div>
                          <span className="text-right font-num text-content-primary">{v.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-content-muted mt-4">
              The cluster CIs span roughly 1–67% and overlap for every model, so the unseen-recall ranking depends on which attack types are in the
              test set. "Reweighted" uses seen recall reweighted to the unseen category mix (DoS {G.unseenCategoryMix.DoS}%, Probe {G.unseenCategoryMix.Probe}%,
              R2L {G.unseenCategoryMix.R2L}%, U2R {G.unseenCategoryMix.U2R}%). The drop grows, so it is not a category-mix artefact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
