import React, { useMemo, useState } from 'react';
import { ROC_CURVES, ROC_COUNTS, ROC_FPR_GRID, FPR_AT_95_RECALL, DATASET_SPECIFICATION, LEARNED_IDS, MODEL_NAMES, LearnedId, RocKind } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

const KINDS: { key: RocKind; label: string; desc: string }[] = [
  { key: 'unseen', label: 'Unseen attacks', desc: '3,750 flows from the 17 attack types absent from training' },
  { key: 'seen', label: 'Seen attacks', desc: '9,083 flows from attack types present in training' },
  { key: 'all', label: 'All attacks', desc: 'all 12,833 attack flows' },
  { key: 'known', label: 'Known attacks (CV)', desc: 'stratified 5-fold CV on KDDTrain+: attack types seen in training, training normals' },
];

const FPR95_KEY: Record<RocKind, 'testUnseen' | 'testSeen' | 'testAll' | 'knownCv'> = {
  unseen: 'testUnseen', seen: 'testSeen', all: 'testAll', known: 'knownCv',
};

export const RocExplorer: React.FC = () => {
  const [kind, setKind] = useState<RocKind>('unseen');
  const [zoom, setZoom] = useState<boolean>(true);
  const sliderIdx = useMemo(() => ROC_FPR_GRID.map((v, i) => (v <= 20 ? i : -1)).filter(i => i >= 0), []);
  const [pos, setPos] = useState<number>(sliderIdx.findIndex(i => ROC_FPR_GRID[i] === 2));
  const [focus, setFocus] = useState<LearnedId | null>(null);
  const [cmModel, setCmModel] = useState<LearnedId>('xgb');

  const gi = sliderIdx[pos];
  const fpr = ROC_FPR_GRID[gi];
  const xMax = zoom ? 20 : 100;
  const W = 520;
  const H = 300;
  const L = 46;
  const B = 34;
  const x = (v: number) => L + (Math.min(v, xMax) / xMax) * (W - L - 16);
  const y = (v: number) => H - B - (v / 100) * (H - B - 14);
  const visible = ROC_FPR_GRID.map((v, i) => [v, i] as const).filter(([v]) => v <= xMax);

  const ranked = [...LEARNED_IDS].sort((a, b) => ROC_CURVES[b][kind][gi] - ROC_CURVES[a][kind][gi]);
  const ticks = zoom ? [0, 5, 10, 15, 20] : [0, 20, 40, 60, 80, 100];

  return (
    <div id="roc-explorer" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover mb-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
        <div>
          <h3 className="font-serif font-semibold text-lg text-content-primary">Interactive ROC explorer</h3>
          <p className="text-xs text-content-muted mt-1 max-w-xl">
            Drag the slider to choose a false-alarm budget and read off how many attacks each model catches at that budget. Test-set curves use
            seed 42; "Known attacks (CV)" uses stratified 5-fold CV on KDDTrain+, the proposal's definition of known-attack performance. Hover a
            model to isolate its curve, click it to show its confusion matrix.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Attack subset">
          {KINDS.map(k => (
            <button key={k.key} type="button" role="radio" aria-checked={kind === k.key} onClick={() => setKind(k.key)} title={k.desc}
              className={`btn-press px-3 py-1.5 rounded-lg text-xs font-mono border ${kind === k.key ? 'bg-accent-primary text-[color:var(--color-on-accent)] border-accent-primary hover:bg-surface-elevated hover:text-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
              {k.label}
            </button>
          ))}
          <button type="button" onClick={() => setZoom(!zoom)} aria-pressed={zoom}
            className="btn-press px-3 py-1.5 rounded-lg text-xs font-mono border border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary">
            {zoom ? 'Show full FPR range' : 'Zoom to FPR ≤ 20%'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_15rem] gap-6 items-start">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label={`ROC curves for ${kind} attacks; selected false-positive rate ${fpr}%`}>
            {[0, 25, 50, 75, 100].map(t => (
              <g key={t}>
                <line x1={L} x2={W - 16} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
                <text x={L - 6} y={y(t) + 3} textAnchor="end" className="text-[10px] font-mono fill-content-muted">{t}%</text>
              </g>
            ))}
            {ticks.map(t => (
              <text key={t} x={x(t)} y={H - B + 16} textAnchor="middle" className="text-[10px] font-mono fill-content-muted">{t}%</text>
            ))}
            <text x={(L + W) / 2} y={H - 4} textAnchor="middle" className="text-[10px] font-mono fill-content-muted">false-positive rate (share of {kind === 'known' ? 'training' : 'test'} normal flows flagged)</text>
            <text x={12} y={(H - B) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(H - B) / 2})`} className="text-[10px] font-mono fill-content-muted">recall</text>

            {LEARNED_IDS.map(id => {
              const pts = visible.map(([v, i]) => `${x(v)},${y(ROC_CURVES[id][kind][i])}`).join(' ');
              const dim = focus !== null && focus !== id;
              return (
                <polyline key={id} points={pts} fill="none" stroke={MODEL_COLOR[id]} strokeWidth={focus === id ? 3.2 : 2}
                  strokeLinejoin="round" opacity={dim ? 0.15 : 1} style={{ transition: 'opacity 150ms, stroke-width 150ms' }} />
              );
            })}

            <line x1={x(fpr)} x2={x(fpr)} y1="10" y2={H - B} stroke="var(--color-text-primary)" strokeDasharray="4 3" opacity="0.6" />
            <text x={Math.min(x(fpr) + 4, W - 60)} y="20" className="text-[10px] font-mono fill-content-primary font-semibold">FPR ≤ {fpr}%</text>
            {LEARNED_IDS.map(id => (
              <circle key={id} cx={x(fpr)} cy={y(ROC_CURVES[id][kind][gi])} r={focus === id ? 6 : 4.5} fill={MODEL_COLOR[id]}
                stroke="var(--color-surface)" strokeWidth="1.5" opacity={focus !== null && focus !== id ? 0.2 : 1} style={{ transition: 'all 150ms' }} />
            ))}
          </svg>

          <label htmlFor="fpr-slider" className="flex items-center gap-3 mt-3 text-xs font-mono text-content-muted">
            <span className="shrink-0">FPR budget</span>
            <input id="fpr-slider" type="range" min={0} max={sliderIdx.length - 1} step={1} value={pos}
              onChange={e => setPos(Number(e.target.value))} className="flex-1 accent-[color:var(--color-accent-primary)] cursor-pointer" />
            <span className="shrink-0 w-14 text-right font-num text-content-primary font-semibold">{fpr.toFixed(2)}%</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[0.5, 1, 2, 5, 10].map(v => {
              const target = sliderIdx.findIndex(i => ROC_FPR_GRID[i] === v);
              return target < 0 ? null : (
                <button key={v} type="button" onClick={() => setPos(target)}
                  className={`btn-press px-2 py-0.5 rounded text-[11px] font-mono border ${pos === target ? 'border-accent-primary text-accent-primary bg-accent-soft' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                  {v}%
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2" onMouseLeave={() => setFocus(null)}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted">Recall at FPR ≤ {fpr}%</div>
          {ranked.map((id, k) => {
            const v = ROC_CURVES[id][kind][gi];
            return (
              <button key={id} type="button" onMouseEnter={() => setFocus(id)} onFocus={() => setFocus(id)} onBlur={() => setFocus(null)} onClick={() => setCmModel(id)}
                aria-pressed={cmModel === id}
                className={`card-lift w-full text-left p-2.5 rounded-lg border bg-surface-card ${cmModel === id ? 'border-accent-primary ring-1 ring-accent-primary' : focus === id ? 'border-accent-border' : 'border-surface-border'}`}>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-2 text-content-primary">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: MODEL_COLOR[id] }} />
                    {MODEL_NAMES[id]}
                  </span>
                  <span className="text-content-muted">#{k + 1} · 95% recall needs FPR {FPR_AT_95_RECALL[id][FPR95_KEY[kind]].toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded bg-surface-elevated overflow-hidden">
                    <div className="h-full rounded transition-[width] duration-200" style={{ width: `${v}%`, background: MODEL_COLOR[id] }} />
                  </div>
                  <span className="font-num text-sm font-semibold text-content-primary w-14 text-right">{v.toFixed(1)}%</span>
                </div>
              </button>
            );
          })}
          <p className="text-[11px] text-content-muted leading-relaxed pt-1">
            The Decision Tree's curve moves in big steps because it outputs only a few distinct scores.
          </p>
        </div>
      </div>

      <div id="live-confusion" className="mt-6 pt-5 border-t border-surface-border">
        {kind === 'known' ? (
          <p className="text-xs text-content-muted">
            The live confusion matrix uses the test set. Switch to unseen, seen or all attacks to see it; known-attack CV pools five held-out folds,
            so it has no single test-set matrix.
          </p>
        ) : (() => {
          const N = DATASET_SPECIFICATION.testNormal;
          const P = DATASET_SPECIFICATION.testAttack;
          const fp = ROC_COUNTS[cmModel].fp[gi];
          const tp = ROC_COUNTS[cmModel].tp[gi];
          const tpu = ROC_COUNTS[cmModel].tpUnseen[gi];
          const cells = [
            { label: 'true negative', v: N - fp, tone: 'good' },
            { label: 'false alarm', v: fp, tone: 'bad' },
            { label: 'missed attack', v: P - tp, tone: 'bad' },
            { label: 'detected attack', v: tp, tone: 'good' },
          ];
          return (
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted mb-2">
                  Live confusion matrix · {MODEL_NAMES[cmModel]} · FPR ≤ {fpr}% (all 22,543 test flows)
                </div>
                <div className="grid grid-cols-[auto_8rem_8rem] gap-1.5 text-xs font-mono">
                  <div />
                  <div className="text-center text-content-muted">pred. normal</div>
                  <div className="text-center text-content-muted">pred. attack</div>
                  {[0, 1].map(r => (
                    <React.Fragment key={r}>
                      <div className="text-content-muted pr-2 self-center">{r === 0 ? 'normal' : 'attack'}</div>
                      {cells.slice(r * 2, r * 2 + 2).map(c => (
                        <div key={c.label} className={`p-2.5 rounded text-center transition-colors ${c.tone === 'good' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
                          <div className="font-num text-base font-bold text-content-primary">{c.v.toLocaleString()}</div>
                          <div className="text-[10px] text-content-muted">{c.label}</div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {[
                  ['Achieved FPR', `${((fp / N) * 100).toFixed(2)}%`],
                  ['Attack recall', `${((tp / P) * 100).toFixed(1)}%`],
                  ['Precision', tp + fp > 0 ? `${((tp / (tp + fp)) * 100).toFixed(1)}%` : '—'],
                  ['Unseen detected', `${tpu.toLocaleString()} / 3,750`],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-surface-elevated/50 border border-surface-border">
                    <dt className="text-[10px] text-content-muted">{k}</dt>
                    <dd className="font-num text-sm font-bold text-content-primary">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
