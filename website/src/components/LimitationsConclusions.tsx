import React from 'react';
import { Scale, CheckCircle2, XCircle } from 'lucide-react';
import { SEED_SUMMARY, CAPACITY_SWEEPS, DEPLOYABLE, PROTOCOL } from '../data/researchData';

export const LimitationsConclusions: React.FC = () => {
  const s = SEED_SUMMARY;
  const lr = CAPACITY_SWEEPS.find(x => x.model === 'lr');
  const bestLowFpr = Math.max(s.lr.unseenAt2.mean, s.dt.unseenAt2.mean, s.rf.unseenAt2.mean, s.xgb.unseenAt2.mean);

  const supported = [
    `Across families, the ensembles rank unseen attacks best (unseen-vs-normal AUC: XGBoost ${s.xgb.aucUnseen.mean.toFixed(3)}, Random Forest ${s.rf.aucUnseen.mean.toFixed(3)}, LR ${s.lr.aucUnseen.mean.toFixed(3)}, Decision Tree ${s.dt.aucUnseen.mean.toFixed(3)}), in every seed and every paired test.`,
    `Within single-model families, regularisation helps: LR's unseen AUC rises from ${lr?.points[lr.points.length - 1].testAucUnseen.toFixed(2)} to ${lr?.points[0].testAucUnseen.toFixed(2)} as C falls, and a moderately deep tree beats a fully grown one.`,
    `Every model loses detection on unseen attack types, and the loss persists after reweighting for category mix.`,
    `At strict false-positive budgets unseen-attack detection is poor for all models (at most ${bestLowFpr.toFixed(1)}% on average at 2% FPR), and thresholds calibrated on training data overshoot on test (RF: ${DEPLOYABLE.rf[0].fpr.toFixed(1)}% for a 1% target).`,
  ];
  const notSupported = [
    'That simpler models generalize better than ensembles. The original single-seed, threshold-0.5 comparison suggested this, but it reflected different operating points.',
    'Any mechanism such as "memorization" for why a model misses an attack type: no feature-attribution analysis was done.',
    'Generalization to other unseen attack types: attack-type cluster CIs for unseen recall span roughly 1–67% and overlap for every model.',
    'Real-world zero-day detection: NSL-KDD unseen types are benchmark-level novel signatures.',
  ];
  const limits = [
    `${PROTOCOL.seeds.length} seeds per model; the Decision Tree is the least stable model.`,
    'Three attack types (mscan, apache2, processtable) make up 64% of unseen flows.',
    'The novelty CV objective varies a lot across folds (fold 0 holds out neptune, 70% of training attacks) and only partly predicts test behaviour.',
    'KDDTest+ was scored in earlier iterations of the study before the protocol was fixed, so it is not a blind holdout (see docs/methodology.md §10).',
  ];

  const List: React.FC<{ items: string[]; icon: React.ReactNode }> = ({ items, icon }) => (
    <ul className="space-y-2.5">
      {items.map(t => (
        <li key={t} className="flex gap-2.5 text-sm text-content-muted leading-relaxed">
          <span className="mt-0.5 shrink-0">{icon}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section id="limitations" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Conclusions & limitations</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">What the evidence supports, and what it does not</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <h3 className="font-serif font-semibold text-lg text-content-primary">Supported</h3>
            <List items={supported} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />} />
          </div>
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <h3 className="font-serif font-semibold text-lg text-content-primary">Not supported</h3>
            <List items={notSupported} icon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />} />
          </div>
        </div>
        <div className="p-6 rounded-xl bg-surface-elevated/50 border border-surface-border">
          <h3 className="font-serif font-semibold text-base text-content-primary mb-3">Limitations</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-disc pl-5 text-sm text-content-muted leading-relaxed">
            {limits.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
};
