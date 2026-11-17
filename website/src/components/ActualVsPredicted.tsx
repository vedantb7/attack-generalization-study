import React, { useState } from 'react';
import { AVP_GROUPS, AVP_OPERATING_POINTS, AVP_PREDICTED, LEARNED_IDS, MODEL_NAMES, LearnedId } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

const OP_LABEL: Record<string, string> = {
  'threshold_0.5': 'Threshold 0.5',
  fpr_1pct: 'FPR ≤ 1%',
  fpr_2pct: 'FPR ≤ 2%',
  fpr_5pct: 'FPR ≤ 5%',
};

type View = 'pct' | 'count';

export const ActualVsPredicted: React.FC = () => {
  const [op, setOp] = useState<string>('threshold_0.5');
  const [view, setView] = useState<View>('pct');
  const [hover, setHover] = useState<{ g: number; id: LearnedId | 'actual' } | null>(null);
  const [focus, setFocus] = useState<LearnedId | null>(null);

  const W = 760, H = 300, L = 54, B = 46, T = 14, R = 12;
  const groupW = (W - L - R) / AVP_GROUPS.length;
  const barW = (groupW * 0.8) / (LEARNED_IDS.length + 1);
  const maxCount = Math.max(...AVP_GROUPS.map(g => Math.max(g.actual, ...LEARNED_IDS.map(id => AVP_PREDICTED[id][op][AVP_GROUPS.indexOf(g)]))));
  const logMax = Math.log10(maxCount + 1);
  // percentage view: share of the group flagged as attack (for Normal this is the false-alarm rate)
  const value = (gi: number, id: LearnedId | 'actual') => {
    const g = AVP_GROUPS[gi];
    const n = id === 'actual' ? g.actual : AVP_PREDICTED[id][op][gi];
    return view === 'pct' ? (n / g.size) * 100 : n;
  };
  const y = (v: number) => {
    const frac = view === 'pct' ? v / 100 : Math.log10(v + 1) / logMax;
    return H - B - frac * (H - B - T);
  };
  const ticks = view === 'pct' ? [0, 25, 50, 75, 100] : [0, 10, 100, 1000, 10000].filter(t => t <= maxCount * 1.5);
  const series: (LearnedId | 'actual')[] = ['actual', ...LEARNED_IDS];

  return (
    <div id="actual-vs-predicted" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover mb-10">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-serif font-semibold text-lg text-content-primary">Actual vs predicted attacks</h3>
          <p className="text-xs text-content-muted mt-1 max-w-2xl">
            For each group of test flows, the actual number of attacks (beige) next to how many each model flags as attacks (seed 42). In the
            Normal group there are no attacks, so every flagged flow is a false alarm. Switch the operating point to see the effect of a stricter
            false-alarm budget.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Operating point">
            {AVP_OPERATING_POINTS.map(o => (
              <button key={o} type="button" role="radio" aria-checked={op === o} onClick={() => setOp(o)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${op === o ? 'bg-accent-primary text-[color:var(--color-on-accent)] border-accent-primary hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                {OP_LABEL[o] ?? o}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Scale">
            {([['pct', '% of group'], ['count', 'Counts (log)']] as [View, string][]).map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={view === k} onClick={() => setView(k)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${view === k ? 'bg-accent-primary text-[color:var(--color-on-accent)] border-accent-primary hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary' : 'border-surface-border text-content-muted hover:bg-surface-elevated hover:text-content-primary'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Actual vs predicted attacks per group at ${OP_LABEL[op] ?? op}`}>
          {ticks.map(t => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
              <text x={L - 6} y={y(t) + 3} textAnchor="end" className="text-[10px] font-mono fill-content-muted">{view === 'pct' ? `${t}%` : t.toLocaleString()}</text>
            </g>
          ))}
          {AVP_GROUPS.map((g, gi) => {
            const x0 = L + gi * groupW + groupW * 0.1;
            return (
              <g key={g.key}>
                {series.map((sid, si) => {
                  const v = value(gi, sid);
                  const x = x0 + si * barW;
                  const dim = focus !== null && sid !== 'actual' && sid !== focus;
                  return (
                    <rect key={String(sid)} x={x} y={y(v)} width={barW - 2} height={Math.max(0, H - B - y(v))} rx="1.5"
                      fill={sid === 'actual' ? 'var(--color-surface-elevated)' : MODEL_COLOR[sid]}
                      stroke={sid === 'actual' ? 'var(--color-text-muted)' : 'none'} strokeWidth="0.8"
                      opacity={dim ? 0.2 : 1} className="mark-hover" style={{ transition: 'y 300ms, height 300ms, opacity 150ms' }}
                      onMouseEnter={() => setHover({ g: gi, id: sid })} />
                  );
                })}
                <text x={x0 + (groupW * 0.8) / 2} y={H - B + 15} textAnchor="middle" className="text-[11px] font-mono fill-content-primary">{g.key}</text>
                <text x={x0 + (groupW * 0.8) / 2} y={H - B + 28} textAnchor="middle" className="text-[9px] font-mono fill-content-muted">n={g.size.toLocaleString()}</text>
              </g>
            );
          })}
        </svg>
        {hover && (() => {
          const g = AVP_GROUPS[hover.g];
          const n = hover.id === 'actual' ? g.actual : AVP_PREDICTED[hover.id][op][hover.g];
          const left = ((L + hover.g * groupW + groupW * 0.5) / W) * 100;
          return (
            <div className="chart-tip" style={{ left: `${Math.min(72, Math.max(2, left - 10))}%`, top: '2%' }}>
              <div className="font-semibold text-content-primary">{g.key} · {hover.id === 'actual' ? 'actual attacks' : MODEL_NAMES[hover.id]}</div>
              <div>{n.toLocaleString()} of {g.size.toLocaleString()} flows ({((n / g.size) * 100).toFixed(1)}%)</div>
              {hover.id !== 'actual' && (
                <div className="text-content-muted">
                  {g.key === 'Normal' ? 'all false alarms' : `${((n / Math.max(g.actual, 1)) * 100).toFixed(1)}% of actual attacks detected`}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-mono" onMouseLeave={() => setFocus(null)}>
        <span className="inline-flex items-center gap-1.5 text-content-primary">
          <span className="w-3 h-2.5 rounded-sm border border-content-muted bg-surface-elevated" /> actual attacks
        </span>
        {LEARNED_IDS.map(id => (
          <button key={id} type="button" onMouseEnter={() => setFocus(id)} onFocus={() => setFocus(id)} onBlur={() => setFocus(null)}
            className="inline-flex items-center gap-1.5 text-content-primary hover:underline">
            <span className="w-3 h-2.5 rounded-sm" style={{ background: MODEL_COLOR[id] }} /> predicted: {MODEL_NAMES[id]}
          </button>
        ))}
      </div>
    </div>
  );
};
