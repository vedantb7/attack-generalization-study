import React from 'react';
import { Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  SEED_SUMMARY, SEED_PAIRS, STATISTICAL_TESTS, CAPACITY_SWEEPS, DEPLOYABLE, PROTOCOL, GENERALIZATION_DATA as G,
  UNSEEN_ATTACKS, COMPUTE_COST, MODEL_NAMES, LEARNED_IDS, LearnedId,
} from '../data/researchData';

const ENSEMBLES: LearnedId[] = ['rf', 'xgb'];
const SINGLES: LearnedId[] = ['lr', 'dt'];

/** Seeds in which model a has the higher unseen-vs-normal AUC than model b. */
function aucSeedWins(a: LearnedId, b: LearnedId): { wins: number; n: number } {
  const d = SEED_PAIRS.find(p => p.a === a && p.b === b && p.metric === 'auc_unseen_vs_normal');
  if (d) return { wins: d.aWins, n: d.nSeeds };
  const r = SEED_PAIRS.find(p => p.a === b && p.b === a && p.metric === 'auc_unseen_vs_normal');
  return r ? { wins: r.nSeeds - r.aWins, n: r.nSeeds } : { wins: 0, n: 0 };
}

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

export const LimitationsConclusions: React.FC = () => {
  const s = SEED_SUMMARY;
  const auc = (id: LearnedId) => s[id].aucUnseen.mean;
  const nSeeds = PROTOCOL.seeds.length;

  // Ensembles vs single models: seed wins and paired AUC tests.
  const crossPairs = ENSEMBLES.flatMap(e => SINGLES.map(m => [e, m] as const));
  const allSeedWins = crossPairs.every(([e, m]) => aucSeedWins(e, m).wins === nSeeds);
  const aucTests = STATISTICAL_TESTS.filter(t => t.family === 'Paired bootstrap' && t.metric.includes('AUC'));
  const crossSig = crossPairs.every(([e, m]) => aucTests.some(t => ((t.a === e && t.b === m) || (t.a === m && t.b === e)) && t.significant));
  const rfXgb = aucTests.find(t => t.a === 'rf' && t.b === 'xgb');
  const xgbOverRf = aucSeedWins('xgb', 'rf');

  // Capacity sweeps.
  const lrSweep = CAPACITY_SWEEPS.find(x => x.model === 'lr');
  const dtSweep = CAPACITY_SWEEPS.find(x => x.model === 'dt');
  const dtBest = dtSweep ? dtSweep.points.reduce((a, b) => (b.testAucUnseen > a.testAucUnseen ? b : a)) : null;
  const dtFull = dtSweep ? dtSweep.points[dtSweep.points.length - 1] : null;

  // Operating points.
  const bestAt2 = [...LEARNED_IDS].sort((a, b) => s[b].unseenAt2.mean - s[a].unseenAt2.mean)[0];
  const lowestAuc = [...LEARNED_IDS].sort((a, b) => auc(a) - auc(b))[0];
  const rfOvershoot = DEPLOYABLE.rf.find(p => p.budget === 'fpr_1pct');

  // Generalization gap and uncertainty.
  const rw = Object.values(G.reweightedDropPp as Record<LearnedId, number>);
  const mostVariable = [...LEARNED_IDS].sort((a, b) => s[b].unseenRecall.std - s[a].unseenRecall.std)[0];
  const top3 = UNSEEN_ATTACKS.slice(0, 3);
  const top3Share = (top3.reduce((t, a) => t + a.count, 0) / UNSEEN_ATTACKS.reduce((t, a) => t + a.count, 0)) * 100;

  // Cost (repeated-run medians from notebook 10).
  const c = COMPUTE_COST;
  const ms = (id: LearnedId) => c[id].singleFlowMs;
  const xRange = (id: LearnedId) => `${(c[id].singleFlowMsIqr[0] / ms('lr')).toFixed(1)}–${(c[id].singleFlowMsIqr[1] / ms('lr')).toFixed(1)}×`;

  const supported = [
    `Across model families, the ensembles rank unseen attacks best: unseen-vs-normal AUC is ${auc('xgb').toFixed(3)} (XGBoost) and ${auc('rf').toFixed(3)} (Random Forest) against ${auc('lr').toFixed(3)} (Logistic Regression) and ${auc('dt').toFixed(3)} (Decision Tree)${allSeedWins ? `, higher in all ${nSeeds} seeds` : ''}${crossSig ? ' and significant in every paired test after Holm correction' : ''}.`,
    `The two ensembles are practically tied: the paired AUC difference RF − XGBoost is ${rfXgb ? rfXgb.effect.toFixed(4) : 'n/a'}, and XGBoost is higher in ${xgbOverRf.wins} of ${xgbOverRf.n} seeds.`,
    `Within the single-model families, more regularisation helps: LR's unseen AUC rises from ${lrSweep?.points[lrSweep.points.length - 1].testAucUnseen.toFixed(3)} (C=${lrSweep?.points[lrSweep.points.length - 1].value}) to ${lrSweep?.points[0].testAucUnseen.toFixed(3)} (C=${lrSweep?.points[0].value}), and the tree peaks at depth ${dtBest?.value} (${dtBest?.testAucUnseen.toFixed(3)}) versus ${dtFull?.testAucUnseen.toFixed(3)} when fully grown. The ensembles barely change with depth.`,
    `Every model detects fewer unseen than seen attacks, and the drop grows (to ${Math.min(...rw).toFixed(1)}–${Math.max(...rw).toFixed(1)} pp at threshold 0.5) after reweighting seen attacks to the unseen category mix, so it is not a category-mix artefact.`,
    `The best model depends on the false-alarm budget: at 2% FPR the ${MODEL_NAMES[bestAt2]} detects the most unseen attacks (${s[bestAt2].unseenAt2.mean.toFixed(1)}% on average) despite ${bestAt2 === lowestAuc ? 'having the lowest AUC' : 'a lower AUC'}, while the ensembles pull ahead at 5%. At strict budgets every model misses most unseen attacks.`,
    `Thresholds calibrated on training data do not transfer: a 1% FPR target set on out-of-fold training normals gives ${rfOvershoot?.fpr.toFixed(1)}% FPR on the test set for Random Forest.`,
    `Better unseen-attack detection costs compute: scoring one flow takes ${ms('lr').toFixed(1)} ms (LR) and ${ms('dt').toFixed(1)} ms (Decision Tree) against ${ms('xgb').toFixed(1)} ms (XGBoost, ${xRange('xgb')} LR across runs) and ${ms('rf').toFixed(1)} ms (Random Forest, ${xRange('rf')}), and the models take ${c.lr.modelSizeKb.toFixed(0)} KB, ${c.dt.modelSizeKb.toFixed(0)} KB, ${c.xgb.modelSizeKb.toFixed(0)} KB and ${(c.rf.modelSizeKb / 1024).toFixed(1)} MB. Tuning the ensembles also took longest (${c.rf.tuningMinutesAllSeeds.toFixed(0)} min for RF and ${c.xgb.tuningMinutesAllSeeds.toFixed(0)} min for XGBoost vs ${c.lr.tuningMinutesAllSeeds.toFixed(0)} min for LR over 5 seeds).`,
  ];
  const limits = [
    'No deep-learning model (e.g. recurrent or convolutional networks) was trained, because of compute restrictions. Published deep-learning results on NSL-KDD use different protocols, so they are not directly comparable with these numbers.',
    `One benchmark (NSL-KDD), binary normal-vs-attack task only, ${PROTOCOL.nTrials} tuning trials per model and seed.`,
    `${nSeeds} seeds per model. The ${MODEL_NAMES[mostVariable]} is the least stable (unseen recall at 0.5 varies by ±${s[mostVariable].unseenRecall.std.toFixed(1)} pp across seeds).`,
    `${top3.map(a => a.name).join(', ')} make up ${top3Share.toFixed(0)}% of unseen flows, so pooled unseen recall mostly reflects these three types.`,
    'The novelty-aware CV objective varies a lot across folds (fold 0 holds out neptune, about 70% of training attacks) and only partly predicts test behaviour.',
    'KDDTest+ was scored in earlier iterations of the study before the protocol was fixed, so it is not a blind holdout (docs/methodology.md §10).',
  ];

  return (
    <section id="limitations" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Conclusions & limitations</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">What the evidence supports</h2>
        </div>

        <div id="answer" className="p-6 rounded-xl bg-surface-card border border-accent-border shadow-sm panel-hover mb-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-accent-primary mb-2">Answer to the research question</div>
          <p className="font-serif text-lg sm:text-xl text-content-primary leading-snug">
            Not always. Simpler models are not better at detecting unseen attacks: across model families the ensembles generalise best. But
            simpler models are the right choice when inference cost decides, as in live, latency- or memory-constrained detection.
          </p>
          <p className="mt-3 text-sm text-content-muted leading-relaxed">
            We set out to map the trade-off between simpler and more complex models in compute and in detection quality. Logistic Regression and
            the Decision Tree score a flow in about {Math.max(ms('lr'), ms('dt')).toFixed(1)} ms and fit in a few kilobytes, but reach an unseen-attack AUC of only{' '}
            {SEED_SUMMARY.dt.aucUnseen.mean.toFixed(2)}–{SEED_SUMMARY.lr.aucUnseen.mean.toFixed(2)}. XGBoost reaches {SEED_SUMMARY.xgb.aucUnseen.mean.toFixed(3)} at{' '}
            {xRange('xgb')} the latency, and Random Forest matches it at {xRange('rf')} the latency and{' '}
            {(c.rf.modelSizeKb / 1024).toFixed(1)} MB. Within a family, regularisation helps the simpler models, and at strict false-alarm budgets
            every model misses most unseen attacks. Deep models (NN, RNN) were outside our compute budget, so their position on this trade-off
            was not measured.
          </p>
          <a href="#tradeoffs" className="group mt-3 inline-flex items-center gap-1 text-xs font-mono text-accent-primary hover:underline">
            See the compute vs performance trade-off <span className="nudge">→</span>
          </a>
        </div>

        <div className="mb-6">
          <div id="supported" className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover space-y-4">
            <h3 className="font-serif font-semibold text-lg text-content-primary">Supported by the evidence</h3>
            <List items={supported} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />} />
          </div>
        </div>

        <div id="limitations-list" className="p-6 rounded-xl bg-surface-elevated/50 border border-surface-border panel-hover">
          <h3 className="font-serif font-semibold text-base text-content-primary mb-3">Limitations</h3>
          <List items={limits} icon={<AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />} />
        </div>
      </div>
    </section>
  );
};
