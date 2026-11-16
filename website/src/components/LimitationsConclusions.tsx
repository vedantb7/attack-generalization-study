import React from 'react';
import { ShieldAlert, AlertOctagon, BookmarkCheck } from 'lucide-react';

export const LimitationsConclusions: React.FC = () => {
  return (
    <section id="limitations" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Academic Rigor & Boundaries</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Methodological Limitations & Research Conclusions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            We present our conclusions within strictly bounded academic parameters. Honesty regarding benchmark limitations is essential for reproducible machine learning research.
          </p>
        </div>

        {/* 6 Core Limitations Grid */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm mb-12 space-y-6">
          <div className="flex items-center gap-2 font-serif font-semibold text-lg text-content-primary border-b border-surface-border pb-3">
            <ShieldAlert className="w-5 h-5 text-accent-primary" />
            <span>Explicit Methodological Guardrails</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-content-muted leading-relaxed">
            {/* Limitation 1 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-accent-primary block">
                1. Synthetic Benchmark Scope
              </span>
              <p>
                NSL-KDD is derived from DARPA 1998 military simulation traffic. While cleaned of duplicate records by Tavallaee et al. (2009), it lacks modern encrypted TLS/HTTPS protocols, multi-stage advanced persistent threats (APTs), and cloud orchestration topologies.
              </p>
            </div>

            {/* Limitation 2 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-accent-primary block">
                2. Unseen ≠ Real-World Zero-Day
              </span>
              <p>
                The 17 unseen attack signatures are novel solely with respect to the training set. They reflect historical attack variations from the 1999–2009 era; they do not establish zero-day immunity against active real-world cyber exploits.
              </p>
            </div>

            {/* Limitation 3 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-accent-primary block">
                3. Extreme Sample Imbalance
              </span>
              <p>
                Multiple unseen attack types have minimal test representations (<code className="font-mono">worm</code>: 2, <code className="font-mono">sqlattack</code>: 2, <code className="font-mono">udpstorm</code>: 2, <code className="font-mono">xsnoop</code>: 4). Extreme sample scarcity amplifies percentage recall volatility on rare attacks.
              </p>
            </div>

            {/* Limitation 4 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-accent-primary block">
                4. Correlated Covariance Shift
              </span>
              <p>
                Generalization degradation stems from both attack signature novelty and background feature distribution shifts (e.g. KS divergence on host error rates). Drop in performance is an empirical observation, not an isolated proof of memorization alone.
              </p>
            </div>

            {/* Limitation 5 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-accent-primary block">
                5. The Alert Fatigue Cost
              </span>
              <p>
                Higher unseen attack recall often comes at the direct expense of false alarm escalation. Simpler models cannot be declared universally superior if their 7.5% FPR causes denial of service in SOC triage workflows.
              </p>
            </div>

            {/* Limitation 6 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-accent-primary block">
                6. Bounded External Validity
              </span>
              <p>
                These empirical findings are strictly valid for the NSL-KDD benchmark, its official split, the 122-feature ColumnTransformer representation, and the evaluated hyperparameters. They should not be extrapolated uncritically to other domains.
              </p>
            </div>
          </div>
        </div>

        {/* Final Research Conclusions Card */}
        <div className="p-6 md:p-8 rounded-xl bg-accent-soft border border-accent-border shadow-sm space-y-6">
          <div className="flex items-center gap-2 font-serif font-semibold text-xl text-content-primary border-b border-accent-border/60 pb-3">
            <BookmarkCheck className="w-5 h-5 text-accent-primary" />
            <span>Final Research Takeaway & Conclusions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm leading-relaxed text-content-primary">
            <div className="space-y-3 font-light">
              <p>
                <strong className="font-semibold text-content-primary">1. Decision Tree Outperforms Complex Ensemble:</strong> Under a strictly controlled, leakage-free benchmark, an interpretable Decision Tree achieved the highest overall test accuracy (83.22%), the highest Macro-F1 (0.8322), and the highest unseen attack recall (53.36%), outperforming Random Forest by +30.13 percentage points on novel attacks ($p &lt; 10^{-223}$).
              </p>
              <p>
                <strong className="font-semibold text-content-primary">2. Random Forest Exhibits Severe OOD Fragility:</strong> While saturating cross-validation (0.9987) and delivering the lowest false positive rate (2.71%), Random Forest suffered a 52.66 pp collapse on unseen attacks (75.91% &rarr; 23.25%). Bagged subspace projection forces trees to memorize narrow training feature combinations.
              </p>
            </div>

            <div className="space-y-3 font-light">
              <p>
                <strong className="font-semibold text-content-primary">3. Complexity Alone Does Not Predict Generalization:</strong> The hypothesis that simpler models always generalize better is nuanced. Both Decision Tree and Logistic Regression retained wider boundaries, but Logistic Regression suffered unacceptable alert fatigue (7.55% FPR) and missed 11 of 17 unseen attack types.
              </p>
              <p>
                <strong className="font-semibold text-content-primary">4. Operational Recommendation:</strong> In security architectures subject to zero-day shift, high-capacity ensembles should not be deployed alone. Hybrid architectures combining global partition filters (trees/linear rules) with ensemble precision filters offer the most robust defensive posture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
