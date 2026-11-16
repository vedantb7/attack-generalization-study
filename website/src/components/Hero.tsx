import React from 'react';
import { ArrowDown, ExternalLink, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { LEARNED_IDS, MODEL_NAMES, SEED_SUMMARY, THRESHOLD_FREE, PROTOCOL } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

export const Hero: React.FC = () => {
  const auc = (id: (typeof LEARNED_IDS)[number]) => SEED_SUMMARY[id].aucUnseen;
  const ordered = [...LEARNED_IDS].sort((a, b) => auc(b).mean - auc(a).mean);
  const lo = 0.6;
  const hi = 1.0;
  const x = (v: number) => 138 + ((v - lo) / (hi - lo)) * 236;
  const bestLowFpr = Math.max(...LEARNED_IDS.map(id => SEED_SUMMARY[id].unseenAt2.mean));

  return (
    <section id="overview" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-surface-border">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#282326_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-accent-soft text-accent-primary border border-accent-border">
            <Sparkles className="w-3 h-3" /> ES 335: Machine Learning
          </span>
          <span className="text-content-muted text-xs">•</span>
          <span className="text-content-secondary font-serif italic text-xs sm:text-sm">Indian Institute of Technology Gandhinagar</span>
          <span className="text-content-muted text-xs">•</span>
          <span className="font-mono text-xs text-content-muted">Authors: Vedant Bondekar & Dhruv</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-editorial-heading text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-content-primary leading-[1.12]">
              Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection
            </h1>
            <p className="text-base sm:text-lg text-content-muted leading-relaxed max-w-2xl font-light">
              Do simpler models (Logistic Regression, a single Decision Tree) detect previously unseen attack types better than
              high-capacity ensembles (Random Forest, XGBoost)? A leakage-free, multi-seed controlled study on NSL-KDD.
            </p>

            <div className="p-4 rounded-lg bg-surface-card border border-surface-border text-xs leading-relaxed text-content-primary shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-accent-primary">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Central empirical finding</span>
              </div>
              <p className="text-content-muted">
                Across model families, <strong className="text-content-primary">the ensembles rank unseen attacks best</strong>: ROC-AUC of
                unseen attacks vs normal traffic is {auc('xgb').mean.toFixed(3)} (XGBoost) and {auc('rf').mean.toFixed(3)} (Random Forest), against{' '}
                {auc('lr').mean.toFixed(3)} (Logistic Regression) and {auc('dt').mean.toFixed(3)} (Decision Tree), in every one of{' '}
                {PROTOCOL.seeds.length} seeds. Within the single models, stronger regularisation helps. At a 2% false-positive rate, no model
                detects more than {bestLowFpr.toFixed(1)}% of unseen-attack flows on average.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="#benchmark" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-accent-primary text-white hover:bg-accent-hover shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary">
                <span>Explore results</span>
                <ArrowDown className="w-4 h-4" />
              </a>
              <a href="#explorer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-card hover:bg-surface-elevated text-content-primary border border-surface-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary">
                <span>Unseen attack explorer</span>
              </a>
              <a href="https://github.com/vedantb7/instrusion_detection" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono text-content-muted hover:text-content-primary transition-colors">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Code & data</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="p-5 sm:p-6 rounded-xl bg-surface-card border border-surface-border shadow-md">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border text-xs font-mono text-content-muted">
                <span>UNSEEN ATTACKS VS NORMAL · ROC-AUC</span>
                <span className="text-[10px] uppercase tracking-wider text-accent-primary font-semibold">{PROTOCOL.seeds.length} seeds</span>
              </div>
              <svg viewBox="0 0 400 200" className="w-full h-auto" role="img" aria-label="Unseen-vs-normal ROC-AUC per model, mean and individual seeds">
                {[0.6, 0.7, 0.8, 0.9, 1.0].map(t => (
                  <g key={t}>
                    <line x1={x(t)} y1="10" x2={x(t)} y2="170" stroke="var(--chart-grid)" />
                    <text x={x(t)} y="186" textAnchor="middle" className="text-[10px] font-mono fill-content-muted">{t.toFixed(1)}</text>
                  </g>
                ))}
                {ordered.map((id, k) => {
                  const y = 30 + k * 38;
                  const s = auc(id);
                  return (
                    <g key={id}>
                      <text x="130" y={y + 4} textAnchor="end" className="text-[11px] font-mono fill-content-primary">{MODEL_NAMES[id]}</text>
                      <line x1={x(lo)} y1={y} x2={x(s.mean)} y2={y} stroke={MODEL_COLOR[id]} strokeWidth="10" strokeLinecap="butt" opacity="0.85" />
                      {s.values.map((v, j) => (
                        <circle key={j} cx={x(v)} cy={y - 10} r="2.6" fill={MODEL_COLOR[id]} stroke="var(--color-surface)" strokeWidth="0.8" />
                      ))}
                      <text x={Math.min(x(s.mean) + 6, 392)} y={y + 4} textAnchor={x(s.mean) + 40 > 395 ? 'end' : 'start'} className="text-[10px] font-mono fill-content-primary font-semibold">
                        {s.mean.toFixed(3)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="text-[11px] text-content-muted mt-1">Bar = mean over seeds; dots = individual end-to-end runs. Threshold-free, so not affected by where each model puts its 0.5 threshold.</p>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-border text-center">
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-accent-primary">{THRESHOLD_FREE.xgb.aucUnseen.toFixed(3)}</div>
                  <div className="text-[11px] font-mono text-content-muted">XGBoost unseen AUC (seed 42)</div>
                </div>
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-content-primary">{THRESHOLD_FREE.dt.aucUnseen.toFixed(3)}</div>
                  <div className="text-[11px] font-mono text-content-muted">Decision Tree unseen AUC</div>
                </div>
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-content-primary">{PROTOCOL.nSignificant}/{PROTOCOL.nTests}</div>
                  <div className="text-[11px] font-mono text-content-muted">tests significant (Holm)</div>
                </div>
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-content-primary">{bestLowFpr.toFixed(1)}%</div>
                  <div className="text-[11px] font-mono text-content-muted">best unseen recall @2% FPR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
