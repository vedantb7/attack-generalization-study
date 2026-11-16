import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { SEED_SUMMARY, CAPACITY_SWEEPS, LEARNED_IDS, MODEL_NAMES, PROTOCOL, SweepSeries } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

const SEED_ROWS: { key: string; label: string; unit: 'auc' | 'pct' }[] = [
  { key: 'aucUnseen', label: 'AUC unseen vs normal', unit: 'auc' },
  { key: 'unseenAt2', label: 'Unseen recall @2% FPR', unit: 'pct' },
  { key: 'unseenRecall', label: 'Unseen recall @0.5', unit: 'pct' },
  { key: 'fpr', label: 'FPR @0.5', unit: 'pct' },
  { key: 'cvAuc', label: 'Novelty CV AUC (train only)', unit: 'auc' },
];

const SERIES: { key: 'cvAuc' | 'testAucUnseen' | 'testAucSeen'; label: string; dash?: string }[] = [
  { key: 'testAucUnseen', label: 'test AUC, unseen vs normal' },
  { key: 'testAucSeen', label: 'test AUC, seen vs normal', dash: '4 3' },
  { key: 'cvAuc', label: 'novelty CV AUC (train only)', dash: '1 3' },
];

const SweepChart: React.FC<{ s: SweepSeries }> = ({ s }) => {
  const W = 300;
  const H = 180;
  const vals = s.points.flatMap(p => [p.cvAuc, p.testAucUnseen, p.testAucSeen]);
  const lo = Math.floor(Math.min(...vals) * 20) / 20;
  const hi = Math.min(1, Math.ceil(Math.max(...vals) * 20) / 20);
  const px = (k: number) => 36 + (k / (s.points.length - 1)) * (W - 50);
  const py = (v: number) => H - 32 - ((v - lo) / (hi - lo)) * (H - 50);
  const color = MODEL_COLOR[s.model];
  const [hover, setHover] = useState<number | null>(null);
  const hp = hover !== null ? s.points[hover] : null;
  return (
    <div className="card-lift p-4 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
      <div>
        <h4 className="font-serif font-semibold text-sm text-content-primary">{MODEL_NAMES[s.model]}</h4>
        <span className="block text-[10px] font-mono text-content-muted">tuned {s.param}={Number.isNaN(Number(s.tuned)) ? s.tuned : Number(Number(s.tuned).toPrecision(2))} · Spearman CV↔test {s.spearman.toFixed(2)}</span>
      </div>
      <div className="relative" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-1" role="img" aria-label={`${MODEL_NAMES[s.model]} capacity sweep over ${s.param}`}>
        {[lo, (lo + hi) / 2, hi].map(t => (
          <g key={t}>
            <line x1="36" x2={W - 14} y1={py(t)} y2={py(t)} stroke="var(--chart-grid)" />
            <text x="31" y={py(t) + 3} textAnchor="end" className="text-[9px] font-mono fill-content-muted">{t.toFixed(2)}</text>
          </g>
        ))}
        {SERIES.map(ser => (
          <polyline key={ser.key} fill="none" stroke={color} strokeWidth={ser.key === 'testAucUnseen' ? 2.4 : 1.4} strokeDasharray={ser.dash}
            points={s.points.map((p, k) => `${px(k)},${py(p[ser.key])}`).join(' ')} />
        ))}
        {hover !== null && <line x1={px(hover)} x2={px(hover)} y1="12" y2={H - 32} stroke="var(--color-text-muted)" strokeDasharray="2 2" />}
        {s.points.map((p, k) => <circle key={k} cx={px(k)} cy={py(p.testAucUnseen)} r={hover === k ? 4.5 : 2.6} fill={color} style={{ transition: 'r 120ms' }} />)}
        {s.points.map((_, k) => {
          const half = (W - 50) / (s.points.length - 1) / 2;
          return <rect key={`h${k}`} x={px(k) - half} y="8" width={half * 2} height={H - 40} fill="transparent" onMouseEnter={() => setHover(k)} />;
        })}
        {s.points.map((p, k) => (
          <text key={`l${k}`} x={px(k)} y={H - 18} textAnchor="middle" className="text-[8px] font-mono fill-content-muted">{p.value}</text>
        ))}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="text-[9px] font-mono fill-content-muted">{s.param} (capacity →)</text>
      </svg>
      {hp && hover !== null && (
        <div className="chart-tip" style={{ left: `${Math.min(62, Math.max(4, (px(hover) / W) * 100 - 20))}%`, top: '4%' }}>
          <div className="font-semibold text-content-primary">{s.param} = {hp.value}</div>
          <div>test unseen AUC <strong>{hp.testAucUnseen.toFixed(3)}</strong></div>
          <div>test seen AUC {hp.testAucSeen.toFixed(3)}</div>
          <div>novelty CV AUC {hp.cvAuc.toFixed(3)}</div>
          <div className="text-content-muted">{s.model === 'lr' ? '‖w‖₂' : 'leaves'} {hp.complexity.toLocaleString()}</div>
        </div>
      )}
      </div>
    </div>
  );
};

export const Robustness: React.FC = () => {
  const lr = CAPACITY_SWEEPS.find(s => s.model === 'lr');
  return (
    <section id="robustness" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Robustness</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Seed variation and capacity sweeps
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Every model was tuned, refit and evaluated end to end with {PROTOCOL.seeds.length} seeds. Separately, one capacity parameter per family was
            swept with the other hyperparameters fixed, to test "simpler is better" within each family.
          </p>
        </div>

        <div id="seed-variation" className="rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover overflow-x-auto mb-10">
          <table className="w-full text-xs font-mono">
            <caption className="text-left px-4 pt-4 pb-2 text-content-muted">Mean ± SD over seeds {PROTOCOL.seeds.join(', ')}.</caption>
            <thead>
              <tr className="border-b border-surface-border text-content-muted">
                <th className="text-left px-4 py-2 font-medium">Metric</th>
                {LEARNED_IDS.map(id => (
                  <th key={id} className="text-right px-3 py-2 font-medium whitespace-nowrap">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: MODEL_COLOR[id] }} />{MODEL_NAMES[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEED_ROWS.map(r => (
                <tr key={r.key} className="border-b border-surface-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                  <td className="px-4 py-2 text-content-primary whitespace-nowrap">{r.label}</td>
                  {LEARNED_IDS.map(id => {
                    const s = SEED_SUMMARY[id][r.key];
                    return (
                      <td key={id} className="px-3 py-2 text-right font-num text-content-primary whitespace-nowrap">
                        {r.unit === 'auc' ? `${s.mean.toFixed(3)} ± ${s.std.toFixed(3)}` : `${s.mean.toFixed(1)}% ± ${s.std.toFixed(1)}`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="capacity-sweeps" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAPACITY_SWEEPS.map(s => <SweepChart key={s.model} s={s} />)}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-mono text-content-muted">
          <span>━ test AUC, unseen vs normal</span><span>╌ test AUC, seen vs normal</span><span>┈ novelty CV AUC (train only)</span>
        </div>
        <p className="text-xs text-content-muted mt-4 max-w-4xl leading-relaxed">
          Within Logistic Regression, more regularisation steadily improves unseen-attack ranking ({lr?.points[lr.points.length - 1].testAucUnseen.toFixed(3)} at
          C={lr?.points[lr.points.length - 1].value} → {lr?.points[0].testAucUnseen.toFixed(3)} at C={lr?.points[0].value}). The Decision Tree peaks at moderate depth,
          and both ensembles are almost flat. The training-only novelty CV tracks the test curve well for LR but not for tree depth, so it is a partial proxy.
          Test curves here are descriptive and were not used to select anything.
        </p>
      </div>
    </section>
  );
};
