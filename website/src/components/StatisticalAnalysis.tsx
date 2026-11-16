import React, { useState } from 'react';
import { Scale, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { STATISTICAL_COMPARISON } from '../data/researchData';

export const StatisticalAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bootstrap' | 'mcnemar'>('bootstrap');
  const [showMethods, setShowMethods] = useState<boolean>(false);

  return (
    <section id="statistics" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Statistical Significance & Uncertainty</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Rigorous Hypothesis Testing & Paired Bootstrap Analysis
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            To confirm that performance differences are statistically meaningful rather than sampling artifacts, we evaluate non-parametric paired McNemar tests with Edwards continuity correction and 1,000-replicate percentile bootstrap confidence intervals.
          </p>
        </div>

        {/* View Selector Tabs */}
        <div className="flex items-center gap-2 mb-8 pb-3 border-b border-surface-border">
          <button
            type="button"
            onClick={() => setActiveTab('bootstrap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              activeTab === 'bootstrap'
                ? 'border-accent-primary bg-accent-soft text-accent-primary font-bold shadow-sm'
                : 'border-surface-border bg-surface-card text-content-muted hover:text-content-primary'
            }`}
          >
            Paired Bootstrap (1,000 Resamples)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mcnemar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              activeTab === 'mcnemar'
                ? 'border-accent-primary bg-accent-soft text-accent-primary font-bold shadow-sm'
                : 'border-surface-border bg-surface-card text-content-muted hover:text-content-primary'
            }`}
          >
            McNemar Contingency Tests (χ²)
          </button>
        </div>

        {/* Tab 1: Bootstrap Differences & Forest Plot */}
        {activeTab === 'bootstrap' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-content-primary">
                    1,000-Replicate Paired Bootstrap Differences
                  </h3>
                  <p className="text-xs text-content-muted">
                    Percentile 95% Confidence Intervals & Empirical Non-Superiority Probabilities $P(\Delta \le 0)$
                  </p>
                </div>
                <span className="text-xs font-mono text-accent-primary font-bold px-2 py-0.5 rounded bg-accent-soft border border-accent-border">
                  Efron & Tibshirani (1993)
                </span>
              </div>

              {/* Table of Bootstrap Differences */}
              <div
                tabIndex={0}
                role="region"
                aria-labelledby="bootstrap-table-caption"
                className="table-wrapper border border-surface-border rounded-lg"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <caption id="bootstrap-table-caption" className="sr-only">
                    Paired bootstrap difference estimates and 95% confidence intervals
                  </caption>
                  <thead className="bg-surface-elevated font-mono text-content-secondary border-b border-surface-border">
                    <tr>
                      <th scope="col" className="py-3 px-4 font-semibold">Model Pair Comparison</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Evaluated Metric</th>
                      <th scope="col" className="py-3 px-4 font-semibold text-right">Mean Paired Difference ($\Delta$)</th>
                      <th scope="col" className="py-3 px-4 font-semibold text-right">95% Bootstrap Confidence Interval</th>
                      <th scope="col" className="py-3 px-4 font-semibold text-right">$P(\Delta \le 0)$</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/60 font-num">
                    {STATISTICAL_COMPARISON.pairedBootstrap.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-elevated/20'}>
                        <th scope="row" className="py-3 px-4 font-mono font-medium text-content-primary">
                          {row.comparison}
                        </th>
                        <td className="py-3 px-4 text-content-muted font-sans font-medium">
                          {row.metric}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-accent-primary">
                          {row.diff}
                        </td>
                        <td className="py-3 px-4 text-right text-content-primary font-mono">
                          {row.ci95}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                          {row.probLessOrEqualZero.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bootstrap Visual Interpretation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2 text-xs">
                  <span className="font-mono font-semibold text-accent-primary block uppercase tracking-wider text-[11px]">
                    1. Decision Tree vs. Random Forest
                  </span>
                  <p className="text-content-muted leading-relaxed font-light">
                    Decision Tree's unseen attack recall advantage is <strong className="text-content-primary font-semibold">+30.13 percentage points [95% CI: +28.62, +31.75 pp]</strong>. Across all 1,000 paired bootstrap resamples, Decision Tree never once scored lower than Random Forest ($P \le 0.0000$).
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2 text-xs">
                  <span className="font-mono font-semibold text-accent-primary block uppercase tracking-wider text-[11px]">
                    2. Logistic Regression vs. Random Forest
                  </span>
                  <p className="text-content-muted leading-relaxed font-light">
                    Even regularized Logistic Regression outperforms Random Forest on unseen attack recall by <strong className="text-content-primary font-semibold">+18.79 percentage points [95% CI: +17.31, +20.25 pp]</strong>, corroborating the hypothesis that linear boundaries generalize more broadly than bagged subtrees on this data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: McNemar Contingency Tests */}
        {activeTab === 'mcnemar' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Table 1: Full Test Set */}
            <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-content-primary">
                    A. Full Test Set Classification Concordance (N=22,543)
                  </h3>
                  <p className="text-xs text-content-muted">
                    Contingency testing of paired prediction correctness (Edwards continuity correction)
                  </p>
                </div>
                <span className="text-xs font-mono text-content-muted">df = 1</span>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-labelledby="mcnemar-full-caption"
                className="table-wrapper border border-surface-border rounded-lg"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <caption id="mcnemar-full-caption" className="sr-only">
                    McNemar test results on full test set
                  </caption>
                  <thead className="bg-surface-elevated font-mono text-content-secondary border-b border-surface-border">
                    <tr>
                      <th scope="col" className="py-2.5 px-4 font-semibold">Model Comparison Pair</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right">Disagreements ($b + c$)</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right">McNemar $\chi^2$</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right">$p$-value</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right">Empirical Winner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/60 font-num">
                    {STATISTICAL_COMPARISON.mcnemarFullTestSet.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-elevated/20'}>
                        <th scope="row" className="py-2.5 px-4 font-mono font-medium text-content-primary">
                          {row.pair}
                        </th>
                        <td className="py-2.5 px-4 text-right text-content-muted">{row.disagreements.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-accent-primary">{row.chi2.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">{row.pVal}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-content-primary">{row.winner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Unseen Subset */}
            <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-content-primary">
                    B. Unseen Attack Subset Concordance (N=3,750 novel attacks)
                  </h3>
                  <p className="text-xs text-content-muted">
                    Significance testing on the novel 17 unseen attack flows only
                  </p>
                </div>
                <span className="text-xs font-mono text-content-muted">df = 1</span>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-labelledby="mcnemar-unseen-caption"
                className="table-wrapper border border-surface-border rounded-lg"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <caption id="mcnemar-unseen-caption" className="sr-only">
                    McNemar test results on the unseen attack subset
                  </caption>
                  <thead className="bg-surface-elevated font-mono text-content-secondary border-b border-surface-border">
                    <tr>
                      <th scope="col" className="py-2.5 px-4 font-semibold">Model Comparison Pair</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right">Disagreements</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right">McNemar $\chi^2$</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right">$p$-value</th>
                      <th scope="col" className="py-2.5 px-4 font-semibold text-right text-accent-primary font-bold">Unseen Winner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/60 font-num">
                    {STATISTICAL_COMPARISON.mcnemarUnseenSubset.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-elevated/20'}>
                        <th scope="row" className="py-2.5 px-4 font-mono font-medium text-content-primary">
                          {row.pair}
                        </th>
                        <td className="py-2.5 px-4 text-right text-content-muted">{row.disagreements.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-accent-primary">{row.chi2.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">{row.pVal}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-accent-primary">{row.winner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Statistical Methods Explanation */}
        <div className="mt-8 p-4 rounded-xl bg-surface-card border border-surface-border text-xs">
          <button
            type="button"
            onClick={() => setShowMethods(!showMethods)}
            className="w-full flex items-center justify-between text-left font-mono font-semibold text-content-primary focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent-primary" />
              <span>Statistical Methodology & Edwards Continuity Correction Justification</span>
            </span>
            {showMethods ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMethods && (
            <div className="mt-4 pt-3 border-t border-surface-border space-y-2 text-content-muted leading-relaxed font-light animate-in fade-in duration-150">
              <p>
                <strong>McNemar's Test:</strong> Evaluates paired classification discordance where $b$ is the number of samples model 1 classified correctly while model 2 misclassified, and $c$ is the reverse. The Edwards continuity corrected test statistic is defined as:
              </p>
              <div className="p-2 rounded bg-surface-elevated/60 font-mono text-center text-xs text-content-primary">
                χ² = (|b - c| - 1)² / (b + c)
              </div>
              <p>
                <strong>Bootstrap Uncertainty:</strong> 1,000 paired replicates were drawn with replacement using identical sample indices across models to preserve dependency structures. Percentile 95% intervals are reported directly without normality assumptions.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
