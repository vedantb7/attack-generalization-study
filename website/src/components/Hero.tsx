import React from 'react';
import { ArrowDown, ExternalLink, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section id="overview" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-surface-border">
      {/* Editorial Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#282326_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Academic Meta Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-accent-soft text-accent-primary border border-accent-border">
            <Sparkles className="w-3 h-3" /> ES 335: Machine Learning
          </span>
          <span className="text-content-muted text-xs">•</span>
          <span className="text-content-secondary font-serif italic text-xs sm:text-sm">
            Indian Institute of Technology Gandhinagar
          </span>
          <span className="text-content-muted text-xs">•</span>
          <span className="font-mono text-xs text-content-muted">
            Authors: Vedant Bondekar & Dhruv
          </span>
        </div>

        {/* Headline & Research Question */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-editorial-heading text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-medium tracking-tight text-content-primary leading-[1.12]">
              Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection
            </h1>

            <p className="text-base sm:text-lg text-content-muted leading-relaxed max-w-2xl font-light">
              Can simpler machine learning models generalize more effectively to previously unseen attack signatures than high-capacity ensembles? An empirical, leakage-free controlled investigation on the benchmark NSL-KDD dataset.
            </p>

            {/* Quick Summary Pill Notice */}
            <div className="p-4 rounded-lg bg-surface-card border border-surface-border text-xs leading-relaxed text-content-primary shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-accent-primary">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Central Empirical Finding</span>
              </div>
              <p className="text-content-muted">
                While <strong className="text-content-primary">Random Forest</strong> saturates in-distribution validation (0.9987 Macro-F1) and achieves 96.72% precision, its detection rate collapses by <strong className="text-content-primary">52.66 percentage points</strong> on novel attack signatures (75.91% &rarr; 23.25%). In contrast, an interpretable <strong className="text-content-primary">Decision Tree</strong> maintains broader decision boundaries, achieving <strong className="text-content-primary">53.36% unseen attack recall</strong> with an overall test accuracy of 83.22%.
              </p>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#benchmark"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-accent-primary text-white hover:bg-accent-hover shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <span>Explore Benchmark Results</span>
                <ArrowDown className="w-4 h-4" />
              </a>

              <a
                href="#explorer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-card hover:bg-surface-elevated text-content-primary border border-surface-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <span>Unseen Attack Explorer</span>
              </a>

              <a
                href="https://github.com/vedantb7/instrusion_detection"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono text-content-muted hover:text-content-primary transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Code & Data</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Conceptual Research Diagram (SVG Visual) */}
          <div className="lg:col-span-5">
            <div className="p-5 sm:p-6 rounded-xl bg-surface-card border border-surface-border shadow-md">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border text-xs font-mono text-content-muted">
                <span>MANIFOLD SHIFT HYPOTHESIS</span>
                <span className="text-[10px] uppercase tracking-wider text-accent-primary font-semibold">Empirical Evidence</span>
              </div>

              {/* Data-Driven Research Concept Illustration */}
              <div className="relative aspect-[4/3] w-full rounded-lg bg-surface-elevated/50 p-2 flex items-center justify-center border border-surface-border/50">
                <svg viewBox="0 0 400 300" className="w-full h-full" aria-label="Conceptual diagram comparing Decision Tree partition vs Random Forest hyper-boxes on seen vs unseen attacks">
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-content-muted opacity-15" />
                    </pattern>
                  </defs>
                  <rect width="400" height="300" fill="url(#gridPattern)" rx="6" />

                  {/* Normal Benign Traffic Region */}
                  <path d="M 20 280 Q 150 180 200 280 Z" fill="rgba(130, 154, 181, 0.15)" stroke="rgba(130, 154, 181, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="70" y="270" className="text-[10px] font-mono fill-content-muted">Benign Normal Traffic</text>

                  {/* 22 Seen Attacks Training Cluster */}
                  <g>
                    <ellipse cx="140" cy="110" rx="65" ry="45" fill="rgba(84, 28, 50, 0.08)" stroke="rgba(84, 28, 50, 0.3)" strokeWidth="1.5" />
                    <text x="90" y="80" className="text-[10px] font-mono font-semibold fill-accent-primary">22 Seen Signatures</text>
                    <text x="90" y="94" className="text-[9px] font-mono fill-content-muted">KDDTrain+ (58,630)</text>

                    {/* Data points */}
                    <circle cx="115" cy="115" r="3.5" fill="#541C32" />
                    <circle cx="130" cy="105" r="3.5" fill="#541C32" />
                    <circle cx="145" cy="125" r="3.5" fill="#541C32" />
                    <circle cx="160" cy="110" r="3.5" fill="#541C32" />
                    <circle cx="135" cy="135" r="3.5" fill="#541C32" />
                  </g>

                  {/* Random Forest Overfit Subspace Pockets */}
                  <rect x="105" y="100" width="30" height="25" fill="none" stroke="#B77C88" strokeWidth="1.2" strokeDasharray="2 2" rx="2" />
                  <rect x="140" y="102" width="28" height="28" fill="none" stroke="#B77C88" strokeWidth="1.2" strokeDasharray="2 2" rx="2" />
                  <text x="100" y="145" className="text-[8px] font-mono fill-content-muted">RF Local Subspaces</text>

                  {/* 17 Novel Unseen Attacks Distribution Shift */}
                  <g>
                    <ellipse cx="295" cy="140" rx="60" ry="50" fill="rgba(183, 124, 136, 0.12)" stroke="#B77C88" strokeWidth="1.5" />
                    <text x="250" y="112" className="text-[10px] font-mono font-semibold fill-content-primary">17 Unseen Signatures</text>
                    <text x="250" y="124" className="text-[9px] font-mono fill-content-muted">KDDTest+ (3,750 novel)</text>

                    {/* Novel data points */}
                    <circle cx="275" cy="145" r="3.5" fill="#B77C88" />
                    <circle cx="295" cy="135" r="3.5" fill="#B77C88" />
                    <circle cx="315" cy="155" r="3.5" fill="#B77C88" />
                    <circle cx="300" cy="165" r="3.5" fill="#B77C88" />
                  </g>

                  {/* Decision Tree Global Partition Boundary */}
                  <line x1="220" y1="20" x2="220" y2="280" stroke="#541C32" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="225" y="40" className="text-[9px] font-mono font-semibold fill-accent-primary">DT Axis Split</text>
                  <text x="225" y="52" className="text-[8px] font-mono fill-content-muted">Captures 53.4% Unseen</text>

                  {/* Random Forest Boundary Misses Novel Shift */}
                  <path d="M 205 70 C 215 150 200 170 190 190" fill="none" stroke="#827A79" strokeWidth="1.5" />
                  <text x="245" y="225" className="text-[9px] font-mono fill-content-muted">RF Misses Novel Shift &rarr; 23.3%</text>
                </svg>
              </div>

              {/* Stat Pillars */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-border text-center">
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-accent-primary">53.36%</div>
                  <div className="text-[11px] font-mono text-content-muted">DT Unseen Recall</div>
                </div>
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-content-primary">23.25%</div>
                  <div className="text-[11px] font-mono text-content-muted">RF Unseen Recall</div>
                </div>
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-emerald-600 dark:text-emerald-400">+30.13 pp</div>
                  <div className="text-[11px] font-mono text-content-muted">DT Superiority (p &lt; 10⁻²²³)</div>
                </div>
                <div className="p-2 rounded bg-surface-elevated/40">
                  <div className="font-num text-lg font-bold text-rose-600 dark:text-rose-400">52.66 pp</div>
                  <div className="text-[11px] font-mono text-content-muted">RF Generalization Drop</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
