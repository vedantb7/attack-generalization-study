import React from 'react';
import { HelpCircle } from 'lucide-react';
import { SEED_SUMMARY, THRESHOLD_FREE, CAPACITY_SWEEPS, DEPLOYABLE } from '../data/researchData';

type Outcome = 'Supported' | 'Partly supported' | 'Not supported across families';

const OUTCOME_STYLE: Record<Outcome, string> = {
  Supported: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  'Partly supported': 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  'Not supported across families': 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
};

export const ResearchQuestion: React.FC = () => {
  const lrSweep = CAPACITY_SWEEPS.find(s => s.model === 'lr');
  const lrFirst = lrSweep?.points[0];
  const lrLast = lrSweep?.points[lrSweep.points.length - 1];
  const rfOvershoot = DEPLOYABLE.rf.find(p => p.budget === 'fpr_1pct');
  const tf = THRESHOLD_FREE;

  const hypotheses: { id: string; title: string; claim: string; outcome: Outcome; evidence: string }[] = [
    {
      id: 'H1',
      title: 'Memorization penalty',
      claim: 'Ensembles are strongest on seen attacks but decline more steeply on unseen ones than simpler models.',
      outcome: 'Partly supported',
      evidence: `Ensembles are best on seen attacks (seen-vs-normal AUC: RF ${tf.rf.aucSeen.toFixed(3)}, XGBoost ${tf.xgb.aucSeen.toFixed(3)}, LR ${tf.lr.aucSeen.toFixed(3)}) and lose more ranking quality on unseen attacks than LR. But they still rank unseen attacks best in absolute terms (RF ${SEED_SUMMARY.rf.aucUnseen.mean.toFixed(3)}, XGBoost ${SEED_SUMMARY.xgb.aucUnseen.mean.toFixed(3)} vs LR ${SEED_SUMMARY.lr.aucUnseen.mean.toFixed(3)}, DT ${SEED_SUMMARY.dt.aucUnseen.mean.toFixed(3)}; mean of 5 seeds). The drop is not a collapse.`,
    },
    {
      id: 'H2',
      title: 'Regularization benefit',
      claim: 'Simpler, regularized models generalize better to novel attack signatures.',
      outcome: 'Not supported across families',
      evidence: `Within LR it holds: unseen AUC rises from ${lrLast?.testAucUnseen.toFixed(3)} (C=${lrLast?.value}) to ${lrFirst?.testAucUnseen.toFixed(3)} (C=${lrFirst?.value}), and a depth-4–6 tree beats a fully grown one. Across families it fails: the regularised LR and the shallow tree rank unseen attacks worse than either ensemble in every seed.`,
    },
    {
      id: 'H3',
      title: 'Distribution-inversion sensitivity',
      claim: 'With the train/test class inversion, accuracy is misleading and threshold-free metrics are needed.',
      outcome: 'Supported',
      evidence: `The majority baseline scores 43% accuracy with zero attack recall. Rankings at threshold 0.5 differ from rankings by AUC, and thresholds calibrated on training normals overshoot on test (RF: ${rfOvershoot?.fpr.toFixed(1)}% realised FPR for a 1% target).`,
    },
  ];

  return (
    <section id="question" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>The research question</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Do simpler models generalize better to novel attacks than complex ensembles?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Intrusion detectors are usually scored on familiar attack traffic, where accuracy above 98% is routine. The question here is what
            happens on attack types the model never saw, and whether lower capacity is an advantage there.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover space-y-3">
            <div className="flex items-center gap-2.5 text-accent-primary font-serif font-semibold text-lg">
              <span>Signature memorization</span>
            </div>
            <p className="text-sm text-content-muted leading-relaxed">
              A model that fits narrowly around artefacts of the training attacks (specific services, byte counts, short-window counters)
              recognises those attacks but not new ones. High-capacity models are the usual suspects.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover space-y-3">
            <div className="flex items-center gap-2.5 text-accent-primary font-serif font-semibold text-lg">
              <span>Unseen-attack generalization</span>
            </div>
            <p className="text-sm text-content-muted leading-relaxed">
              The ability to flag traffic from <strong className="text-content-primary">attack types absent from training</strong>. NSL-KDD's
              official test set contains 17 such types (3,750 flows). We measure it threshold-free (ROC-AUC against normal traffic), at matched
              false-positive rates, and at the conventional 0.5 threshold.
            </p>
          </div>
        </div>

        <div id="hypotheses" className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
          <h3 className="font-serif font-semibold text-base sm:text-lg text-content-primary mb-2">Hypotheses and what the evidence says</h3>
          <p className="text-xs sm:text-sm text-content-muted mb-6 max-w-3xl">
            The three pre-registered hypotheses from the project proposal, with the outcome of the controlled study.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {hypotheses.map(h => (
              <div key={h.id} className="card-lift p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-3 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-content-primary">{h.id} · {h.title}</span>
                </div>
                <p className="text-xs text-content-primary leading-relaxed italic">{h.claim}</p>
                <span className={`self-start text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${OUTCOME_STYLE[h.outcome]}`}>{h.outcome}</span>
                <p className="text-xs text-content-muted leading-relaxed">{h.evidence}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <div>
              <strong className="font-semibold block mb-0.5">Scope:</strong>
              The 17 unseen attack types are absent from training within the NSL-KDD benchmark. They are benchmark-level novel signatures, not
              real-world zero-day exploits, and we make no zero-day claims.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
