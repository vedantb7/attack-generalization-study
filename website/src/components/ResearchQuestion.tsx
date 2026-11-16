import React from 'react';
import { HelpCircle, AlertOctagon, Cpu, ShieldCheck } from 'lucide-react';

export const ResearchQuestion: React.FC = () => {
  return (
    <section id="question" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>The Research Question</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Can Simpler Models Generalize Better to Novel Attacks Than Complex Ensembles?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            In network intrusion detection, production classifiers are routinely evaluated on familiar attack traffic, achieving &gt;98% in-distribution accuracy. But when an attacker shifts tactics or deploys a new tool, does high expressive capacity become a liability?
          </p>
        </div>

        {/* The Core Dichotomy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Signature Memorization */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-accent-primary font-serif font-semibold text-lg">
              <AlertOctagon className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Signature Memorization</span>
            </div>
            <p className="text-sm text-content-muted leading-relaxed">
              When a machine learning model fits tightly around specific, localized artifacts in the training data—such as specific port combinations, byte counts, or narrow time-window packet counters—it effectively <strong className="text-content-primary">memorizes the signature</strong> rather than learning a generalized concept of malicious behavior.
            </p>
            <div className="p-3.5 rounded-lg bg-surface-elevated/60 text-xs font-mono text-content-secondary space-y-1">
              <span className="font-semibold block text-content-primary">Observation in Random Forest:</span>
              <span>100 deep trees with random feature subspacing (<code className="text-[11px]">max_features='sqrt'</code>) partition the training space into micro-cubes, saturating cross-validation (0.9987 F1) but blinding the ensemble to novel attack variants.</span>
            </div>
          </div>

          {/* Card 2: Unseen Attack Generalization */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-accent-primary font-serif font-semibold text-lg">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Unseen Attack Generalization</span>
            </div>
            <p className="text-sm text-content-muted leading-relaxed">
              The ability of a classifier to correctly flag network flows originating from <strong className="text-content-primary">attack types absent from the training partition</strong>. Because attackers continuously modify tool payloads and evasion techniques, out-of-distribution robustness is the primary requirement for real-world defensive viability.
            </p>
            <div className="p-3.5 rounded-lg bg-surface-elevated/60 text-xs font-mono text-content-secondary space-y-1">
              <span className="font-semibold block text-content-primary">Observation in Decision Tree:</span>
              <span>An unconstrained single tree evaluates all 122 features globally at each split, discovering broader structural cuts on duration and byte distributions that successfully detect 53.36% of novel attacks.</span>
            </div>
          </div>
        </div>

        {/* Boundary Geometry Comparison Visual */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm">
          <h3 className="font-serif font-semibold text-base sm:text-lg text-content-primary mb-2">
            Decision Boundary Geometry & Out-of-Distribution Shift
          </h3>
          <p className="text-xs sm:text-sm text-content-muted mb-6 max-w-3xl">
            Why do different inductive biases respond differently to novel attacks? Here is how each model family constructs its decision regions relative to training points and out-of-distribution test points:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Model 1: Logistic Regression */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-content-primary">Logistic Regression</span>
                <span className="text-content-muted">Linear Hyperplane</span>
              </div>
              <div className="aspect-[4/3] rounded bg-surface-card border border-surface-border flex items-center justify-center p-2 relative overflow-hidden">
                <svg viewBox="0 0 160 120" className="w-full h-full">
                  {/* Background grid */}
                  <rect width="160" height="120" fill="none" />
                  {/* Linear Decision Boundary */}
                  <line x1="10" y1="110" x2="150" y2="10" stroke="#541C32" strokeWidth="2" />
                  <path d="M 10 110 L 150 10 L 160 120 L 10 120 Z" fill="rgba(84, 28, 50, 0.08)" />
                  <text x="100" y="80" className="text-[9px] font-mono fill-accent-primary">Attack (+)</text>
                  <text x="30" y="40" className="text-[9px] font-mono fill-content-muted">Normal (-)</text>
                  {/* Known points */}
                  <circle cx="110" cy="90" r="3" fill="#541C32" />
                  <circle cx="130" cy="70" r="3" fill="#541C32" />
                  <circle cx="140" cy="100" r="3" fill="#541C32" />
                  {/* Novel shifted point */}
                  <circle cx="80" cy="95" r="3.5" fill="#B77C88" stroke="#351321" strokeWidth="1" />
                  <text x="45" y="105" className="text-[8px] font-mono fill-rose-600 font-semibold">Novel (Caught)</text>
                </svg>
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                A single global linear boundary divides the feature space. While forgiving of continuous shifts, it cannot model non-linear protocol dependencies, generating higher false alarms (7.55% FPR).
              </p>
            </div>

            {/* Model 2: Decision Tree */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-content-primary">Decision Tree</span>
                <span className="text-content-muted">Axis-Aligned Cuts</span>
              </div>
              <div className="aspect-[4/3] rounded bg-surface-card border border-surface-border flex items-center justify-center p-2 relative overflow-hidden">
                <svg viewBox="0 0 160 120" className="w-full h-full">
                  {/* Axis-aligned partition cuts */}
                  <line x1="80" y1="0" x2="80" y2="120" stroke="#541C32" strokeWidth="1.5" />
                  <line x1="80" y1="50" x2="160" y2="50" stroke="#541C32" strokeWidth="1.5" />
                  <line x1="80" y1="85" x2="160" y2="85" stroke="#541C32" strokeWidth="1.5" />
                  <rect x="80" y="50" width="80" height="70" fill="rgba(84, 28, 50, 0.12)" />
                  <text x="100" y="70" className="text-[9px] font-mono fill-accent-primary">Attack Region</text>
                  {/* Known points */}
                  <circle cx="110" cy="65" r="3" fill="#541C32" />
                  <circle cx="125" cy="75" r="3" fill="#541C32" />
                  <circle cx="140" cy="60" r="3" fill="#541C32" />
                  {/* Novel shifted point */}
                  <circle cx="95" cy="100" r="3.5" fill="#B77C88" stroke="#351321" strokeWidth="1" />
                  <text x="95" y="115" className="text-[8px] font-mono fill-emerald-600 font-semibold">Caught (53.4%)</text>
                </svg>
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                Recursive orthogonal cuts extend semi-infinitely across continuous features. When novel attacks exhibit altered rates on global features, the broad partition blocks catch them.
              </p>
            </div>

            {/* Model 3: Random Forest */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-content-primary">Random Forest</span>
                <span className="text-content-muted">Subspace Ensembles</span>
              </div>
              <div className="aspect-[4/3] rounded bg-surface-card border border-surface-border flex items-center justify-center p-2 relative overflow-hidden">
                <svg viewBox="0 0 160 120" className="w-full h-full">
                  {/* Isolated hyper-boxes */}
                  <rect x="90" y="20" width="30" height="25" fill="rgba(84, 28, 50, 0.15)" stroke="#541C32" strokeWidth="1" strokeDasharray="2 1" rx="2" />
                  <rect x="110" y="55" width="35" height="30" fill="rgba(84, 28, 50, 0.15)" stroke="#541C32" strokeWidth="1" strokeDasharray="2 1" rx="2" />
                  {/* Training points inside boxes */}
                  <circle cx="102" cy="32" r="2.5" fill="#541C32" />
                  <circle cx="125" cy="68" r="2.5" fill="#541C32" />
                  <circle cx="132" cy="75" r="2.5" fill="#541C32" />
                  {/* Novel shifted point OUTSIDE the boxes */}
                  <circle cx="95" cy="95" r="3.5" fill="#B77C88" stroke="#351321" strokeWidth="1" />
                  <text x="40" y="105" className="text-[8px] font-mono fill-rose-600 font-semibold">MISSED (Unseen Gap 52.7pp)</text>
                </svg>
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                Randomized feature subspace projection creates tight local consensus envelopes around known training clusters. When novel attacks shift off these subspaces, the majority of trees vote Normal.
              </p>
            </div>
          </div>

          {/* Academic Guardrail Callout */}
          <div className="mt-6 p-3.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Cpu className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Academic Scope & Terminology Guardrail:</strong>
              These 17 unseen attack signatures are absent from training within the standardized NSL-KDD benchmark. We explicitly do <span className="underline font-semibold">not</span> claim genuine real-world zero-day exploit immunity. Our objective is strictly to assess whether simpler models show superior out-of-distribution inductive bias under controlled benchmark conditions.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
