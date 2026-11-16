import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { OVERALL_METRICS, CONFUSION_MATRICES, MODEL_IDS, MODEL_NAMES, ModelId } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

export const BenchmarkResults: React.FC = () => {
  const [metricKey, setMetricKey] = useState<string>('auc_unseen');
  const [cmModel, setCmModel] = useState<ModelId>('xgb');

  const metric = OVERALL_METRICS.find(m => m.key === metricKey) ?? OVERALL_METRICS[0];
  const cm = CONFUSION_MATRICES[cmModel];
  const isAuc = metric.unit === 'score' && metric.key !== 'macro_f1';
  const lo = isAuc ? 0.5 : 0;
  const hi = metric.unit === '%' ? 100 : 1;
  const scale = (v: number) => Math.max(0, (v - lo) / (hi - lo));
  const best = metric.higherIsBetter
    ? Math.max(...MODEL_IDS.filter(i => i !== 'baseline').map(i => metric.values[i]))
    : Math.min(...MODEL_IDS.filter(i => i !== 'baseline').map(i => metric.values[i]));

  return (
    <section id="benchmark" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Benchmark evidence</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Official test results (KDDTest+, N = 22,543, seed 42)
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Threshold-free metrics compare how well each model <em>ranks</em> attacks above normal traffic. Metrics marked @0.5 depend on
            where each model's 0.5 threshold happens to fall, and the models end up at different false-positive rates there.
          </p>
        </div>

        <div id="metric-explorer" className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <div className="lg:col-span-4 space-y-1.5" role="tablist" aria-label="Metric">
            {OVERALL_METRICS.map(m => (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={metricKey === m.key}
                onClick={() => setMetricKey(m.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors border ${
                  metricKey === m.key ? 'bg-accent-primary border-accent-primary text-[color:var(--color-on-accent)] hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary font-semibold' : 'border-transparent text-content-muted hover:bg-surface-elevated hover:text-content-primary'
                }`}
              >
                {m.metric}
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
            <h3 className="font-serif font-semibold text-lg text-content-primary">{metric.metric}</h3>
            <p className="text-xs text-content-muted mt-1 mb-5">
              {metric.description} {metric.higherIsBetter ? 'Higher is better.' : 'Lower is better.'}
              {isAuc && ' Axis starts at 0.5 (chance).'}
            </p>
            <div className="space-y-3">
              {MODEL_IDS.map(id => (
                <div key={id} className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] items-center gap-3">
                  <span className="text-xs font-mono text-content-primary truncate">{MODEL_NAMES[id]}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-5 flex-1 rounded bg-surface-elevated/60 overflow-hidden">
                      <div className="h-full rounded transition-all duration-300" style={{ width: `${scale(metric.values[id]) * 100}%`, background: MODEL_COLOR[id] }} />
                    </div>
                    <span className={`text-xs font-num whitespace-nowrap ${metric.values[id] === best && id !== 'baseline' ? 'font-bold text-accent-primary' : 'text-content-primary'}`}>
                      {metric.display[id]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="metrics-table" className="rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover mb-10 overflow-x-auto">
          <table className="w-full text-xs font-mono" aria-describedby="benchmark-table-caption">
            <caption id="benchmark-table-caption" className="text-left px-4 pt-4 pb-2 text-content-muted">
              All metrics, seed 42. Bold = best learned model per row.
            </caption>
            <thead>
              <tr className="border-b border-surface-border text-content-muted">
                <th className="text-left px-4 py-2 font-medium">Metric</th>
                {MODEL_IDS.map(id => (
                  <th key={id} className="text-right px-3 py-2 font-medium whitespace-nowrap">{MODEL_NAMES[id]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OVERALL_METRICS.map(m => {
                const learned = MODEL_IDS.filter(i => i !== 'baseline').map(i => m.values[i]);
                const b = m.higherIsBetter ? Math.max(...learned) : Math.min(...learned);
                return (
                  <tr key={m.key} className="border-b border-surface-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-4 py-2 text-content-primary whitespace-nowrap">{m.metric}</td>
                    {MODEL_IDS.map(id => (
                      <td key={id} className={`px-3 py-2 text-right whitespace-nowrap font-num ${m.values[id] === b && id !== 'baseline' ? 'font-bold text-accent-primary' : 'text-content-primary'}`}>
                        {m.display[id]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div id="confusion-matrix" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h3 className="font-serif font-semibold text-lg text-content-primary">Confusion matrix at threshold 0.5</h3>
            <div className="flex flex-wrap gap-1.5">
              {MODEL_IDS.map(id => (
                <button key={id} type="button" onClick={() => setCmModel(id)} aria-pressed={cmModel === id}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${cmModel === id ? 'bg-accent-primary text-[color:var(--color-on-accent)] hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary border-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                  {MODEL_NAMES[id]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 text-xs font-mono max-w-sm">
              <div />
              <div className="text-center text-content-muted py-1">pred. normal</div>
              <div className="text-center text-content-muted py-1">pred. attack</div>
              <div className="text-content-muted pr-2 self-center">normal</div>
              <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 text-center"><div className="font-num text-base font-bold text-content-primary">{cm.tn.toLocaleString()}</div><div className="text-[10px] text-content-muted">true negative</div></div>
              <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/30 text-center"><div className="font-num text-base font-bold text-content-primary">{cm.fp.toLocaleString()}</div><div className="text-[10px] text-content-muted">false alarm</div></div>
              <div className="text-content-muted pr-2 self-center">attack</div>
              <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/30 text-center"><div className="font-num text-base font-bold text-content-primary">{cm.fn.toLocaleString()}</div><div className="text-[10px] text-content-muted">missed attack</div></div>
              <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 text-center"><div className="font-num text-base font-bold text-content-primary">{cm.tp.toLocaleString()}</div><div className="text-[10px] text-content-muted">detected</div></div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs font-mono">
              {[
                ['Attack precision', `${cm.precision.toFixed(2)}%`],
                ['Attack recall', `${cm.recall.toFixed(2)}%`],
                ['False-positive rate', `${cm.fpr.toFixed(2)}%`],
                ['False-negative rate', `${cm.fnr.toFixed(2)}%`],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-lg bg-surface-elevated/50 border border-surface-border">
                  <dt className="text-content-muted text-[10px]">{k}</dt>
                  <dd className="font-num text-sm font-bold text-content-primary">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};
