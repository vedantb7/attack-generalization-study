import React from 'react';
import { AlertTriangle, ShieldX } from 'lucide-react';

export const ErrorAnalysis: React.FC = () => {
  return (
    <section id="errors" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Failure Mode Triage</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Error Analysis: The Anatomy of Model Failures
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Why do specific models fail on particular attack families? We separate directly observed prediction errors from structural interpretations of inductive bias.
          </p>
        </div>

        {/* Dual Failure Modes: Type I vs Type II Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Failure Mode 1: False Positives (Alert Fatigue) */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2 font-serif font-semibold text-lg text-content-primary">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Type I Error: Alert Fatigue (FPR)</span>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                Benign Traffic Misclassified
              </span>
            </div>

            <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
              When normal background traffic is incorrectly flagged as malicious, security operations center (SOC) analysts must investigate false alarms. In high-bandwidth production switches carrying millions of flows, even a 1% FPR creates thousands of wasted alerts.
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border flex justify-between items-center">
                <span>Logistic Regression:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">7.55% FPR (733 false alarms)</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border flex justify-between items-center">
                <span>Decision Tree (CART):</span>
                <span className="font-bold text-content-primary">4.48% FPR (435 false alarms)</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border flex justify-between items-center">
                <span>Random Forest:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">2.71% FPR (263 false alarms) &mdash; Best</span>
              </div>
            </div>

            <p className="text-[11px] text-content-muted leading-relaxed font-light">
              <strong>Observed Interpretation:</strong> Logistic Regression's continuous hyperplane cannot isolate benign high-traffic spikes from true DoS without shifting the boundary into benign space. Random Forest's ensemble consensus requires majority agreement across 75 trees, drastically reducing spurious false alarms.
            </p>
          </div>

          {/* Failure Mode 2: False Negatives (Undetected Breaches) */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2 font-serif font-semibold text-lg text-content-primary">
                <ShieldX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>Type II Error: Breaches (FNR)</span>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                Attacks Bypassing Defense
              </span>
            </div>

            <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
              When malicious traffic is classified as normal, intrusions succeed undetected. In enterprise security, False Negatives carry asymmetric organizational risk compared to False Positives.
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border flex justify-between items-center">
                <span>Decision Tree (CART):</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">26.09% FNR (3,348 missed attacks) &mdash; Best</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border flex justify-between items-center">
                <span>Logistic Regression:</span>
                <span className="font-bold text-content-primary">37.08% FNR (4,759 missed attacks)</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border flex justify-between items-center">
                <span>Random Forest:</span>
                <span className="font-bold text-rose-700 dark:text-rose-400">39.48% FNR (5,066 missed attacks) &mdash; Worst</span>
              </div>
            </div>

            <p className="text-[11px] text-content-muted leading-relaxed font-light">
              <strong>Observed Interpretation:</strong> Random Forest missed 1,718 more attacks than Decision Tree on the exact same test set. On novel attacks, Random Forest's false negative rate escalated to 76.75% (2,878 missed out of 3,750 novel flows).
            </p>
          </div>
        </div>

        {/* Granular Attack Case Studies */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-6">
          <h3 className="font-serif font-semibold text-base sm:text-lg text-content-primary border-b border-surface-border pb-3">
            Case Studies: How Inductive Biases Dictate Attack Detection
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Case 1: apache2 vs processtable */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2.5">
              <span className="font-mono text-xs font-bold text-accent-primary uppercase tracking-wider block">
                Case 1: Volumetric vs. Slow-Rate DoS
              </span>
              <h4 className="font-semibold text-sm text-content-primary">
                apache2 (99.1% LR) vs. processtable (1.0% LR)
              </h4>
              <p className="text-xs text-content-muted leading-relaxed">
                <code className="font-mono">apache2</code> floods HTTP servers with aggressive request rates, producing high values across continuous traffic counts that linear weights easily separate. But <code className="font-mono">processtable</code> slowly exhausts resources without high packet volume; Logistic Regression and Random Forest miss &gt;98% of it, while Decision Tree isolates connection duration rules, detecting 34.3% (235/685).
              </p>
            </div>

            {/* Case 2: snmpguess */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2.5">
              <span className="font-mono text-xs font-bold text-accent-primary uppercase tracking-wider block">
                Case 2: The Brute-Force Divergence
              </span>
              <h4 className="font-semibold text-sm text-content-primary">
                snmpguess (98.8% DT vs. 0.0% RF)
              </h4>
              <p className="text-xs text-content-muted leading-relaxed">
                <code className="font-mono">snmpguess</code> brute-forces SNMP community strings over UDP port 161. A single Decision Tree evaluated UDP protocol and destination port globally, catching 327 of 331 flows (98.8%). In Random Forest, random subspace sampling (<code className="font-mono">sqrt(122) ≈ 11</code>) omitted the crucial SNMP feature from most trees, yielding 0 detections (0.0%).
              </p>
            </div>

            {/* Case 3: Universal Blind Spots */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2.5">
              <span className="font-mono text-xs font-bold text-accent-primary uppercase tracking-wider block">
                Case 3: Universal Stealth Blind Spots
              </span>
              <h4 className="font-semibold text-sm text-content-primary">
                worm & snmpgetattack (0% Across All Models)
              </h4>
              <p className="text-xs text-content-muted leading-relaxed">
                Neither simpler models nor complex ensembles detected a single record of <code className="font-mono">worm</code> (0/2) or <code className="font-mono">snmpgetattack</code> (0/178 for DT and RF; 1/178 for LR). These stealth attacks transmit minimal payload indicators without generating anomalous packet frequencies, proving that no model in this benchmark provides universal zero-day immunity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
