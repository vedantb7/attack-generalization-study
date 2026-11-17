import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { COMPUTE_COST, COMPUTE_SYSTEM, SEED_SUMMARY, KNOWN_CV, FPR_AT_95_RECALL, LEARNED_IDS, MODEL_NAMES, LearnedId } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

type CostKey = 'singleFlowMs' | 'batchUsPerFlow' | 'tuningMinutesAllSeeds' | 'modelSizeKb';
type QualityKey = 'aucUnseen' | 'knownAuc' | 'unseenAt2' | 'fpr95';

const COSTS: { key: CostKey; label: string; unit: string; desc: string }[] = [
  { key: 'singleFlowMs', label: 'Single-flow latency', unit: 'ms', desc: 'time to score one connection, as a live detector would' },
  { key: 'batchUsPerFlow', label: 'Batch latency', unit: 'µs/flow', desc: 'per-flow time when scoring the whole test set at once' },
  { key: 'tuningMinutesAllSeeds', label: 'Tuning time (5 seeds)', unit: 'min', desc: 'wall time of all Optuna trials across the 5 seeds' },
  { key: 'modelSizeKb', label: 'Model size', unit: 'KB', desc: 'saved pipeline on disk' },
];

const QUALITY: { key: QualityKey; label: string; higher: boolean; fmt: (v: number) => string }[] = [
  { key: 'aucUnseen', label: 'Unseen-attack AUC (5-seed mean)', higher: true, fmt: v => v.toFixed(3) },
  { key: 'unseenAt2', label: 'Unseen recall @2% FPR (5-seed mean)', higher: true, fmt: v => `${v.toFixed(1)}%` },
  { key: 'knownAuc', label: 'Known-attack AUC (CV on KDDTrain+)', higher: true, fmt: v => v.toFixed(4) },
  { key: 'fpr95', label: 'FPR needed for 95% recall (test)', higher: false, fmt: v => `${v.toFixed(1)}%` },
];

const quality = (id: LearnedId, k: QualityKey): number =>
  k === 'aucUnseen' ? SEED_SUMMARY[id].aucUnseen.mean
    : k === 'unseenAt2' ? SEED_SUMMARY[id].unseenAt2.mean
      : k === 'knownAuc' ? KNOWN_CV[id].rocAuc
        : FPR_AT_95_RECALL[id].testAll;

const fmtCost = (v: number, unit: string) =>
  unit === 'KB' ? (v >= 1024 ? `${(v / 1024).toFixed(1)} MB` : `${v.toFixed(1)} KB`) : `${v < 10 ? v.toFixed(2) : v.toFixed(1)} ${unit}`;

export const Tradeoffs: React.FC = () => {
  const [costKey, setCostKey] = useState<CostKey>('singleFlowMs');
  const [qKey, setQKey] = useState<QualityKey>('aucUnseen');
  const [hover, setHover] = useState<LearnedId | null>(null);
  const cost = COSTS.find(c => c.key === costKey)!;
  const q = QUALITY.find(x => x.key === qKey)!;

  const W = 520, H = 300, L = 56, B = 40, T = 16, R = 24;
  const xs = LEARNED_IDS.map(id => COMPUTE_COST[id][costKey]);
  const ys = LEARNED_IDS.map(id => quality(id, qKey));
  const lx = Math.log10(Math.min(...xs) / 1.6), hx = Math.log10(Math.max(...xs) * 1.6);
  const pad = (Math.max(...ys) - Math.min(...ys)) * 0.25 || 0.01;
  const ly = Math.min(...ys) - pad, hy = Math.max(...ys) + pad;
  const px = (v: number) => L + ((Math.log10(v) - lx) / (hx - lx)) * (W - L - R);
  const py = (v: number) => H - B - ((v - ly) / (hy - ly)) * (H - B - T);
  const xTicks = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000].filter(t => Math.log10(t) >= lx && Math.log10(t) <= hx);

  const c = COMPUTE_COST;
  const fastest = [...LEARNED_IDS].sort((a, b) => c[a].singleFlowMs - c[b].singleFlowMs)[0];
  const best = [...LEARNED_IDS].sort((a, b) => SEED_SUMMARY[b].aucUnseen.mean - SEED_SUMMARY[a].aucUnseen.mean)[0];
  const ratio = (a: LearnedId, b: LearnedId) => (c[a].singleFlowMs / c[b].singleFlowMs).toFixed(1);
  // ratio range using a's interquartile range against b's median (single-flow latency)
  const ratioRange = (a: LearnedId, b: LearnedId) =>
    `${(c[a].singleFlowMsIqr[0] / c[b].singleFlowMs).toFixed(1)}–${(c[a].singleFlowMsIqr[1] / c[b].singleFlowMs).toFixed(1)}×`;
  const fastMs = [Math.min(c.lr.singleFlowMs, c.dt.singleFlowMs), Math.max(c.lr.singleFlowMs, c.dt.singleFlowMs)];

  const guide = [
    {
      title: 'Latency- or memory-critical',
      models: ['lr', 'dt'] as LearnedId[],
      text: `Inline or edge detection where every millisecond or kilobyte counts. LR and the Decision Tree score a flow in about ${fastMs[0].toFixed(1)}–${fastMs[1].toFixed(1)} ms and fit in ${c.lr.modelSizeKb.toFixed(0)}–${c.dt.modelSizeKb.toFixed(0)} KB, and both are easy to explain. The price: unseen-attack AUC ${SEED_SUMMARY.dt.aucUnseen.mean.toFixed(2)}–${SEED_SUMMARY.lr.aucUnseen.mean.toFixed(2)}. Prefer LR here: it is far more stable across seeds.`,
    },
    {
      title: 'Balanced',
      models: ['xgb'] as LearnedId[],
      text: `XGBoost gives the best unseen-attack AUC (${SEED_SUMMARY.xgb.aucUnseen.mean.toFixed(3)}) at ${ratioRange('xgb', 'lr')} LR's single-flow latency (median ${c.xgb.singleFlowMs.toFixed(1)} ms, varying most between runs) and a ${c.xgb.modelSizeKb.toFixed(0)} KB model.`,
    },
    {
      title: 'Detection-first, offline or batch',
      models: ['rf', 'xgb'] as LearnedId[],
      text: `When alerts are scored in batches and compute is cheap, either ensemble works. Random Forest matches XGBoost on unseen attacks but costs ${ratio('rf', 'xgb')}× its single-flow latency and ${(c.rf.modelSizeKb / c.xgb.modelSizeKb).toFixed(0)}× its size.`,
    },
  ];

  return (
    <section id="tradeoffs" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Compute vs performance</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            The trade-off between simpler and more complex models
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Detection quality is only half of a deployment decision. Pick a cost and a quality measure to see where each model sits.{' '}
            {MODEL_NAMES[fastest]} is the fastest per flow; {MODEL_NAMES[best]} detects unseen attacks best.
          </p>
        </div>

        <div id="tradeoff-chart" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted mb-1.5">Cost (x-axis, log scale)</div>
              <div className="flex flex-wrap gap-1.5">
                {COSTS.map(k => (
                  <button key={k.key} type="button" onClick={() => setCostKey(k.key)} aria-pressed={costKey === k.key} title={k.desc}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${costKey === k.key ? 'bg-accent-primary text-[color:var(--color-on-accent)] border-accent-primary hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted mb-1.5">Quality (y-axis)</div>
              <div className="flex flex-wrap gap-1.5">
                {QUALITY.map(k => (
                  <button key={k.key} type="button" onClick={() => setQKey(k.key)} aria-pressed={qKey === k.key}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${qKey === k.key ? 'bg-accent-primary text-[color:var(--color-on-accent)] border-accent-primary hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative max-w-3xl" onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${q.label} against ${cost.label}`}>
              {xTicks.map(t => (
                <g key={t}>
                  <line x1={px(t)} x2={px(t)} y1={T} y2={H - B} stroke="var(--chart-grid)" />
                  <text x={px(t)} y={H - B + 14} textAnchor="middle" className="text-[10px] font-mono fill-content-muted">{t >= 1 ? t : t.toFixed(1)}</text>
                </g>
              ))}
              {[0, 0.5, 1].map(f => {
                const v = ly + f * (hy - ly);
                return (
                  <g key={f}>
                    <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--chart-grid)" />
                    <text x={L - 6} y={py(v) + 3} textAnchor="end" className="text-[10px] font-mono fill-content-muted">{q.fmt(v)}</text>
                  </g>
                );
              })}
              <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" className="text-[10px] font-mono fill-content-muted">{cost.label} ({cost.unit}) → more expensive</text>
              <text x={L} y={10} className="text-[10px] font-mono fill-content-muted">{q.higher ? '↑ better' : '↓ better'}</text>
              {LEARNED_IDS.map(id => {
                const x = px(COMPUTE_COST[id][costKey]);
                const y = py(quality(id, qKey));
                const dim = hover !== null && hover !== id;
                return (
                  <g key={id} opacity={dim ? 0.3 : 1} style={{ transition: 'opacity 150ms' }} onMouseEnter={() => setHover(id)}>
                    <circle cx={x} cy={y} r={hover === id ? 11 : 9} fill={MODEL_COLOR[id]} stroke="var(--color-surface)" strokeWidth="2" style={{ transition: 'cx 300ms, cy 300ms, r 150ms' }} />
                    <text x={x > W * 0.62 ? x - 14 : x + 14} y={y + 4} textAnchor={x > W * 0.62 ? 'end' : 'start'} className="text-[11px] font-mono fill-content-primary">{MODEL_NAMES[id]}</text>
                  </g>
                );
              })}
            </svg>
            {hover && (
              <div className="chart-tip" style={{ left: `${Math.min(70, (px(COMPUTE_COST[hover][costKey]) / W) * 100 + 3)}%`, top: `${Math.max(0, (py(quality(hover, qKey)) / H) * 100 - 30)}%` }}>
                <div className="font-semibold text-content-primary">{MODEL_NAMES[hover]}</div>
                <div>{cost.label}: {fmtCost(COMPUTE_COST[hover][costKey], cost.unit)}</div>
                {costKey === 'singleFlowMs' && <div className="text-content-muted">IQR {COMPUTE_COST[hover].singleFlowMsIqr[0].toFixed(1)}–{COMPUTE_COST[hover].singleFlowMsIqr[1].toFixed(1)} ms</div>}
                {costKey === 'batchUsPerFlow' && <div className="text-content-muted">IQR {COMPUTE_COST[hover].batchUsIqr[0].toFixed(1)}–{COMPUTE_COST[hover].batchUsIqr[1].toFixed(1)} µs</div>}
                <div>{q.label}: {q.fmt(quality(hover, qKey))}</div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-content-muted mt-2">Medians of repeated runs on the test system below; latency includes the preprocessing step. Absolute times depend on hardware, the ratios between models are what matter.</p>
        </div>

        <div id="tradeoff-table" className="rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover overflow-x-auto mb-6">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-surface-border text-content-muted">
                <th className="text-left px-4 py-2 font-medium">Model</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Single flow</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Batch / flow</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Size</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Tuning (5 seeds)</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Unseen AUC</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Known AUC</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">FPR @95% recall</th>
              </tr>
            </thead>
            <tbody>
              {LEARNED_IDS.map(id => (
                <tr key={id} className="border-b border-surface-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                  <td className="px-4 py-2 text-content-primary whitespace-nowrap"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: MODEL_COLOR[id] }} />{MODEL_NAMES[id]}</td>
                  <td className="px-3 py-2 text-right font-num whitespace-nowrap">{c[id].singleFlowMs.toFixed(1)} ms <span className="text-content-muted text-[10px]">({c[id].singleFlowMsIqr[0].toFixed(1)}–{c[id].singleFlowMsIqr[1].toFixed(1)})</span></td>
                  <td className="px-3 py-2 text-right font-num whitespace-nowrap">{c[id].batchUsPerFlow.toFixed(1)} µs <span className="text-content-muted text-[10px]">({c[id].batchUsIqr[0].toFixed(1)}–{c[id].batchUsIqr[1].toFixed(1)})</span></td>
                  <td className="px-3 py-2 text-right font-num whitespace-nowrap">{fmtCost(c[id].modelSizeKb, 'KB')}</td>
                  <td className="px-3 py-2 text-right font-num whitespace-nowrap">{c[id].tuningMinutesAllSeeds.toFixed(0)} min</td>
                  <td className="px-3 py-2 text-right font-num">{SEED_SUMMARY[id].aucUnseen.mean.toFixed(3)}</td>
                  <td className="px-3 py-2 text-right font-num">{KNOWN_CV[id].rocAuc.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-num">{FPR_AT_95_RECALL[id].testAll.toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="text-content-muted italic">
                <td className="px-4 py-2 whitespace-nowrap">Deep models (NN, RNN)</td>
                <td colSpan={7} className="px-3 py-2">Not trained: outside this project's compute budget. Typically far costlier to train (often on GPUs); not measured here.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-content-muted -mt-3 mb-6">Latency shown as median (interquartile range). XGBoost's single-flow time varies most because it scores on all threads of a CPU that mixes performance and efficiency cores.</p>

        <div id="test-system" className="p-5 rounded-xl bg-surface-elevated/50 border border-surface-border panel-hover mb-6">
          <h3 className="font-serif font-semibold text-base text-content-primary mb-3">Test system used for these measurements</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-xs font-mono">
            {[
              ['CPU', COMPUTE_SYSTEM.cpu],
              ['Cores / threads', `${COMPUTE_SYSTEM.physical_cores ?? '?'} cores / ${COMPUTE_SYSTEM.logical_cpus ?? '?'} threads`],
              ['Max clock', COMPUTE_SYSTEM.max_clock_ghz ? `${COMPUTE_SYSTEM.max_clock_ghz} GHz` : 'n/a'],
              ['Memory', COMPUTE_SYSTEM.ram_gb ? `${COMPUTE_SYSTEM.ram_gb} GB RAM` : 'n/a'],
              ['GPU', COMPUTE_SYSTEM.gpu === 'none' ? 'none (CPU only)' : COMPUTE_SYSTEM.gpu],
              ['Operating system', `${COMPUTE_SYSTEM.os} (kernel ${COMPUTE_SYSTEM.kernel})`],
              ['Python', COMPUTE_SYSTEM.python],
              ['Libraries', `scikit-learn ${COMPUTE_SYSTEM.scikit_learn}, XGBoost ${COMPUTE_SYSTEM.xgboost}, NumPy ${COMPUTE_SYSTEM.numpy}, pandas ${COMPUTE_SYSTEM.pandas}`],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-content-muted">{k}</dt>
                <dd className="text-content-primary break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 pt-3 border-t border-surface-border text-[11px] text-content-muted space-y-1 leading-relaxed">
            <p><strong className="text-content-primary font-medium">Threads:</strong> {COMPUTE_SYSTEM.threads}.</p>
            <p><strong className="text-content-primary font-medium">Method:</strong> {COMPUTE_SYSTEM.method}.</p>
            <p><strong className="text-content-primary font-medium">Training and tuning</strong> times come from the same machine (Optuna logs and the final fits in notebooks 04–07).</p>
          </div>
        </div>

        <div id="deployment-guide" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guide.map(g => (
            <div key={g.title} className="card-lift p-5 rounded-xl bg-surface-card border border-surface-border shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                {g.models.map(id => <span key={id} className="w-2.5 h-2.5 rounded-full" style={{ background: MODEL_COLOR[id] }} />)}
                <h3 className="font-serif font-semibold text-base text-content-primary ml-1">{g.title}</h3>
              </div>
              <p className="text-sm text-content-muted leading-relaxed">{g.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
