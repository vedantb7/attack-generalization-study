import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { OVERALL_METRICS, CONFUSION_MATRICES } from '../data/researchData';

export const BenchmarkResults: React.FC = () => {
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('accuracy');
  const [cmModel, setCmModel] = useState<'lr' | 'dt' | 'rf' | 'baseline'>('dt');

  const selectedMetric = OVERALL_METRICS.find(m => m.key === selectedMetricKey) || OVERALL_METRICS[0];
  const cm = CONFUSION_MATRICES[cmModel];

  // Helper to format values for the interactive SVG bar chart
  const chartData = [
    { label: 'Baseline', value: selectedMetric.baseline, display: selectedMetric.baselineDisplay, color: '#827A79' },
    { label: 'Logistic Reg.', value: selectedMetric.lr, display: selectedMetric.lrDisplay, color: '#B77C88' },
    { label: 'Decision Tree', value: selectedMetric.dt, display: selectedMetric.dtDisplay, color: '#541C32' },
    { label: 'Random Forest', value: selectedMetric.rf, display: selectedMetric.rfDisplay, color: '#351321' }
  ];

  const maxValue = selectedMetric.unit === '%' ? 100 : 1.0;

  return (
    <section id="benchmark" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Controlled Benchmark Evidence</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Official Test Benchmark Results (KDDTest+, N=22,543)
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            All models were evaluated strictly once at a fixed decision threshold of 0.50 on the official NSL-KDD test set. Metrics reflect both in-distribution known attacks and novel out-of-distribution attacks.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-8 pb-3 border-b border-surface-border">
          <span className="text-xs font-mono text-content-muted mr-1 hidden sm:inline">Active Metric:</span>
          {OVERALL_METRICS.map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMetricKey(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                selectedMetricKey === m.key
                  ? 'border-accent-primary bg-accent-primary text-white font-semibold shadow-sm'
                  : 'border-surface-border bg-surface-card text-content-muted hover:text-content-primary hover:bg-surface-elevated'
              }`}
            >
              {m.metric}
            </button>
          ))}
        </div>

        {/* Visual Chart & Metric Explainer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
          {/* Left: Responsive Precision SVG Bar Chart */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <span className="font-mono text-xs text-content-muted uppercase tracking-wider block">Comparison Chart</span>
                <h3 className="font-serif font-semibold text-lg text-content-primary">{selectedMetric.metric}</h3>
              </div>
              <span className="text-xs font-mono text-accent-primary font-medium px-2.5 py-1 rounded-full bg-accent-soft border border-accent-border">
                {selectedMetric.higherIsBetter ? 'Higher is better' : 'Lower is better (Error)'}
              </span>
            </div>

            {/* Custom SVG Bar Chart with Theme adaptation */}
            <div className="relative pt-4 pb-2">
              <div className="space-y-4">
                {chartData.map(item => {
                  const pct = Math.max(0, Math.min(100, (item.value / maxValue) * 100));
                  const isTop = (selectedMetric.higherIsBetter && item.label === 'Decision Tree') ||
                                (!selectedMetric.higherIsBetter && item.label === 'Random Forest');

                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className={`font-semibold ${isTop ? 'text-accent-primary' : 'text-content-primary'}`}>
                          {item.label}
                        </span>
                        <span className="font-num font-bold text-content-primary">{item.display}</span>
                      </div>
                      <div className="w-full h-6 rounded-md bg-surface-elevated/70 border border-surface-border/40 p-0.5 overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500 ease-out flex items-center justify-end pr-2 text-[10px] font-mono text-white"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.label === 'Decision Tree' ? 'var(--color-accent-primary)' :
                                             item.label === 'Logistic Reg.' ? 'var(--color-rose)' :
                                             item.label === 'Random Forest' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                          }}
                        >
                          {pct > 15 ? `${pct.toFixed(1)}%` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Baseline Reference Label */}
              <div className="flex items-center justify-between text-[11px] font-mono text-content-muted pt-4 border-t border-surface-border mt-6">
                <span>0.00</span>
                <span>Scaled scale: 0 to {maxValue} {selectedMetric.unit}</span>
                <span>{maxValue} {selectedMetric.unit}</span>
              </div>
            </div>

            <p className="text-xs text-content-muted leading-relaxed font-light">
              {selectedMetric.description}
            </p>
          </div>

          {/* Right: Metric Explanation & Security Trade-Off */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-5">
            <h3 className="font-serif font-semibold text-lg text-content-primary border-b border-surface-border pb-3">
              Why Accuracy Alone is Misleading
            </h3>

            <div className="space-y-3.5 text-xs text-content-muted leading-relaxed">
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                <strong className="text-content-primary font-semibold block text-xs mb-1">
                  1. The Alert Fatigue Trade-off (False Positives)
                </strong>
                Logistic Regression achieves a respectable 62.92% recall, but generates a <strong className="text-rose-600 dark:text-rose-400">7.55% false positive rate (733 false alarms)</strong>. In an enterprise monitoring millions of packets daily, a 7.5% FPR would overwhelm security operations center (SOC) analysts with thousands of false alerts daily.
              </div>

              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                <strong className="text-content-primary font-semibold block text-xs mb-1">
                  2. The Breach Exposure Trade-off (False Negatives)
                </strong>
                Random Forest achieves the lowest FPR (2.71%, 263 alarms) and highest precision (96.72%), but misses <strong className="text-rose-600 dark:text-rose-400">5,066 attack flows (39.48% FNR)</strong>, leaving massive operational blind spots on unfamiliar attack tools.
              </div>

              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                <strong className="text-content-primary font-semibold block text-xs mb-1">
                  3. Decision Tree: The Superior Balance
                </strong>
                Decision Tree achieves <strong className="text-emerald-600 dark:text-emerald-400">83.22% overall accuracy, 73.91% attack recall, and 0.8322 Macro-F1</strong>, while keeping FPR at 4.48% (435 alarms) and reducing missed intrusions by 1,718 relative to Random Forest.
              </div>
            </div>
          </div>
        </div>

        {/* Complete Benchmark Data Table (Semantic, Responsive Modern Web Table) */}
        <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-serif font-semibold text-lg text-content-primary">
                Multi-Model Controlled Benchmark Table
              </h3>
              <p className="text-xs text-content-muted">
                Official NSL-KDD Test Set (KDDTest+, N=22,543 records, decision threshold = 0.50)
              </p>
            </div>
            <span className="text-[11px] font-mono text-content-muted">
              Source: <code className="text-accent-primary">results/metrics/*_controlled.json</code>
            </span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="benchmark-table-caption"
            className="table-wrapper border border-surface-border rounded-lg"
          >
            <table className="w-full text-left text-xs border-collapse">
              <caption id="benchmark-table-caption" className="sr-only">
                Complete comparative performance metrics for Majority Baseline, Logistic Regression, Decision Tree, and Random Forest
              </caption>
              <thead className="bg-surface-elevated font-mono text-content-secondary border-b border-surface-border">
                <tr>
                  <th scope="col" className="py-3 px-4 font-semibold">Evaluation Metric</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right">Majority Baseline</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right">Logistic Regression</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right text-accent-primary">Decision Tree (CART)</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right">Random Forest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60 font-num">
                {OVERALL_METRICS.map((row, idx) => (
                  <tr
                    key={row.key}
                    onClick={() => setSelectedMetricKey(row.key)}
                    className={`cursor-pointer transition-colors ${
                      selectedMetricKey === row.key
                        ? 'bg-accent-soft font-semibold'
                        : idx % 2 === 0 ? 'bg-surface-card hover:bg-surface-elevated/40' : 'bg-surface-elevated/20 hover:bg-surface-elevated/40'
                    }`}
                  >
                    <th scope="row" className="py-2.5 px-4 font-sans font-medium text-content-primary">
                      {row.metric}
                    </th>
                    <td className="py-2.5 px-4 text-right text-content-muted">{row.baselineDisplay}</td>
                    <td className="py-2.5 px-4 text-right text-content-primary">{row.lrDisplay}</td>
                    <td className="py-2.5 px-4 text-right text-accent-primary font-bold">{row.dtDisplay}</td>
                    <td className="py-2.5 px-4 text-right text-content-primary">{row.rfDisplay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Confusion Matrix Section */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4 mb-6">
            <div>
              <h3 className="font-serif font-semibold text-lg text-content-primary">
                Interactive Confusion Matrix & Error Triage
              </h3>
              <p className="text-xs text-content-muted">
                Inspect raw sample counts across the 22,543 test connections (Normal: 9,710 | Attack: 12,833)
              </p>
            </div>

            {/* Model Selector Tabs for Confusion Matrix */}
            <div className="inline-flex rounded-lg border border-surface-border bg-surface-elevated/50 p-1">
              {(['baseline', 'lr', 'dt', 'rf'] as const).map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCmModel(k)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    cmModel === k
                      ? 'bg-surface-card text-accent-primary font-bold shadow-sm'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  {k === 'baseline' ? 'Baseline' : k === 'lr' ? 'Logistic' : k === 'dt' ? 'Decision Tree' : 'Random Forest'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* The 2x2 Matrix Visual */}
            <div className="md:col-span-7">
              <div className="grid grid-cols-2 gap-3 text-center">
                {/* True Negatives (TN) */}
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="font-mono text-[11px] text-emerald-800 dark:text-emerald-300 block mb-1">
                    True Negative (TN) — Normal Pass
                  </span>
                  <span className="font-num text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {cm.tn.toLocaleString()}
                  </span>
                  <span className="block text-[10px] font-mono text-content-muted mt-1">
                    {((cm.tn / 9710) * 100).toFixed(1)}% of Benign
                  </span>
                </div>

                {/* False Positives (FP) */}
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                  <span className="font-mono text-[11px] text-amber-800 dark:text-amber-300 block mb-1">
                    False Positive (FP) — Alert Fatigue
                  </span>
                  <span className="font-num text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {cm.fp.toLocaleString()}
                  </span>
                  <span className="block text-[10px] font-mono text-content-muted mt-1">
                    FPR: {cm.fpr.toFixed(2)}%
                  </span>
                </div>

                {/* False Negatives (FN) */}
                <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
                  <span className="font-mono text-[11px] text-rose-800 dark:text-rose-300 block mb-1">
                    False Negative (FN) — Missed Breach
                  </span>
                  <span className="font-num text-2xl font-bold text-rose-700 dark:text-rose-400">
                    {cm.fn.toLocaleString()}
                  </span>
                  <span className="block text-[10px] font-mono text-content-muted mt-1">
                    FNR: {cm.fnr.toFixed(2)}%
                  </span>
                </div>

                {/* True Positives (TP) */}
                <div className="p-4 rounded-lg bg-accent-soft border border-accent-border">
                  <span className="font-mono text-[11px] text-accent-primary block mb-1">
                    True Positive (TP) — Caught Attack
                  </span>
                  <span className="font-num text-2xl font-bold text-accent-primary">
                    {cm.tp.toLocaleString()}
                  </span>
                  <span className="block text-[10px] font-mono text-content-muted mt-1">
                    Recall: {cm.recall.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Derived Operational Telemetry */}
            <div className="md:col-span-5 p-4 rounded-lg bg-surface-elevated/40 border border-surface-border text-xs font-mono space-y-2.5">
              <span className="font-bold text-content-primary block border-b border-surface-border pb-1.5 uppercase tracking-wider text-[11px]">
                Operational Defense Summary
              </span>
              <div className="flex justify-between">
                <span className="text-content-muted">Total Test Samples:</span>
                <span className="font-semibold text-content-primary">22,543</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Attack Detection Precision:</span>
                <span className="font-semibold text-content-primary">{cm.precision.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Attack Detection Recall:</span>
                <span className="font-semibold text-accent-primary">{cm.recall.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Benign Specificity:</span>
                <span className="font-semibold text-content-primary">{cm.specificity.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">False Alarm Count:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">{cm.fp.toLocaleString()} flows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-content-muted">Undetected Breach Count:</span>
                <span className="font-semibold text-rose-700 dark:text-rose-400">{cm.fn.toLocaleString()} flows</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
