import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ATTACK_CATEGORIES } from '../data/researchData';

export const CategoryAnalysis: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('R2L (Remote to Local)');

  const activeCategory = ATTACK_CATEGORIES.find(c => c.category === selectedCat) || ATTACK_CATEGORIES[2];

  const CATEGORY_INSIGHTS: Record<string, { title: string; explanation: string; mechanics: string }> = {
    'DoS (Denial of Service)': {
      title: 'Volumetric Floods: Broad Model Consensus',
      explanation: 'High connection frequencies and uniform SYN/error rates across short time windows (e.g., neptune, smurf, apache2) create strong linear and tree-based signals. All three trained models achieve ~80–85% recall.',
      mechanics: 'Top features: count, srv_count, serror_rate, dst_host_srv_count.'
    },
    'Probe (Surveillance)': {
      title: 'Network Port Scanning: High Visibility',
      explanation: 'Probes systematically sweep target IP addresses and port ranges (e.g., ipsweep, portsweep, satan, saint). These reconnaissance bursts produce distinctive dst_host host distributions easily isolated by decision trees (83.02%) and logistic regression (78.11%).',
      mechanics: 'Top features: dst_host_diff_srv_rate, dst_host_same_src_port_rate.'
    },
    'R2L (Remote to Local)': {
      title: 'The Stealth Vulnerability: Severe Degradation',
      explanation: 'R2L attacks mimic legitimate application traffic (e.g., brute-force guessing or application buffer overflows) over valid sessions. Both Logistic Regression (1.04%) and Random Forest (2.36%) experience near-total failure. Decision Tree uniquely detects 37.48% by isolating specific port and duration splits on snmpguess and httptunnel.',
      mechanics: 'Top features: dst_bytes, hot, num_failed_logins, duration.'
    },
    'U2R (User to Root)': {
      title: 'Privilege Escalation: Extreme Scarcity',
      explanation: 'Only 67 total test samples exist across all U2R attacks (such as buffer_overflow, rootkit, ps, xterm). Because U2R exploits occur within legitimate established user sessions, statistical traffic counters show negligible anomaly. Both LR (31.34%) and DT (32.84%) detect ~21–22 samples, while RF detects only 8 (11.94%).',
      mechanics: 'Top features: root_shell, su_attempted, num_compromised.'
    }
  };

  return (
    <section className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Category-Level Vulnerability Analysis</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Attack Category Recall: The Critical R2L & U2R Blind Spot
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Performance varies dramatically across the four DARPA attack families. While volumetric attacks (DoS and Probing) are detected with ~80% reliability, stealth application exploits reveal massive blind spots in high-capacity ensembles.
          </p>
        </div>

        {/* Grouped Category Comparison Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left: Grouped Bar Visualization */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-serif font-semibold text-lg text-content-primary">
                Detection Recall by Attack Category
              </h3>
              <span className="text-xs font-mono text-content-muted">KDDTest+ Samples ($n$)</span>
            </div>

            <div className="space-y-6 pt-2">
              {ATTACK_CATEGORIES.map(cat => {
                const isSelected = selectedCat === cat.category;
                return (
                  <div
                    key={cat.category}
                    onClick={() => setSelectedCat(cat.category)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent-primary bg-accent-soft/40 shadow-sm'
                        : 'border-surface-border bg-surface-card hover:bg-surface-elevated/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-content-primary">{cat.category}</span>
                        <span className="text-content-muted">($n$={cat.total.toLocaleString()})</span>
                      </div>
                      <span className="text-[11px] text-accent-primary font-semibold">
                        DT: {cat.dtRecall.toFixed(1)}% | RF: {cat.rfRecall.toFixed(1)}%
                      </span>
                    </div>

                    {/* Grouped Bars */}
                    <div className="space-y-1.5 font-num text-[11px]">
                      {/* Logistic Regression Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-[10px] font-mono text-content-muted truncate">Log. Reg.</span>
                        <div className="flex-1 h-3 rounded bg-surface-elevated/80 overflow-hidden">
                          <div
                            className="h-full bg-burgundy-rose transition-all duration-300"
                            style={{ width: `${cat.lrRecall}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-content-muted font-mono text-[10px]">
                          {cat.lrRecall.toFixed(1)}%
                        </span>
                      </div>

                      {/* Decision Tree Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-[10px] font-mono font-bold text-accent-primary truncate">Dec. Tree</span>
                        <div className="flex-1 h-3 rounded bg-surface-elevated/80 overflow-hidden">
                          <div
                            className="h-full bg-accent-primary transition-all duration-300"
                            style={{ width: `${cat.dtRecall}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-bold text-accent-primary font-mono text-[10px]">
                          {cat.dtRecall.toFixed(1)}%
                        </span>
                      </div>

                      {/* Random Forest Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-[10px] font-mono text-content-muted truncate">Rand. Forest</span>
                        <div className="flex-1 h-3 rounded bg-surface-elevated/80 overflow-hidden">
                          <div
                            className="h-full bg-content-primary transition-all duration-300"
                            style={{ width: `${cat.rfRecall}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-content-muted font-mono text-[10px]">
                          {cat.rfRecall.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-content-muted pt-2 border-t border-surface-border">
              <span>Click any category card to inspect domain failure analysis</span>
              <span>KDDTest+ Ground Truth</span>
            </div>
          </div>

          {/* Right: Selected Category In-Depth Defense Triage */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <span className="text-[10px] font-mono text-accent-primary uppercase tracking-wider block">
                  Category Deep Dive
                </span>
                <h3 className="font-serif font-semibold text-xl text-content-primary mt-1">
                  {activeCategory.category}
                </h3>
                <span className="text-xs font-mono text-content-muted">
                  Total Test Evaluation Samples: <strong className="text-content-primary">{activeCategory.total.toLocaleString()}</strong>
                </span>
              </div>

              {/* Dynamic Insight for Active Category */}
              <div className="space-y-3 text-xs leading-relaxed">
                <h4 className="font-semibold text-content-primary text-sm">
                  {CATEGORY_INSIGHTS[activeCategory.category]?.title}
                </h4>
                <p className="text-content-muted">
                  {CATEGORY_INSIGHTS[activeCategory.category]?.explanation}
                </p>

                <div className="p-3 rounded-lg bg-surface-elevated/50 border border-surface-border space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent-primary font-bold block">
                    Domain Indicator Features:
                  </span>
                  <span className="font-mono text-[11px] text-content-primary">
                    {CATEGORY_INSIGHTS[activeCategory.category]?.mechanics}
                  </span>
                </div>
              </div>

              {/* Exact Count Tally */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
                <div className="p-2.5 rounded bg-surface-elevated/60 border border-surface-border">
                  <span className="text-[10px] text-content-muted block">Logistic Reg.</span>
                  <span className="font-bold text-xs text-content-primary">{activeCategory.lrDetected} / {activeCategory.total}</span>
                </div>
                <div className="p-2.5 rounded bg-accent-soft border border-accent-border">
                  <span className="text-[10px] text-accent-primary font-bold block">Decision Tree</span>
                  <span className="font-bold text-xs text-accent-primary">{activeCategory.dtDetected} / {activeCategory.total}</span>
                </div>
                <div className="p-2.5 rounded bg-surface-elevated/60 border border-surface-border">
                  <span className="text-[10px] text-content-muted block">Random Forest</span>
                  <span className="font-bold text-xs text-content-primary">{activeCategory.rfDetected} / {activeCategory.total}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-surface-border bg-surface-elevated/30 text-[11px] text-content-muted">
              <strong>Domain Caveat:</strong> Attacks within a category can vary dramatically in evasion capability. For example, in R2L, <code className="font-mono">snmpguess</code> is detected 98.8% by DT, whereas <code className="font-mono">snmpgetattack</code> and <code className="font-mono">worm</code> yield 0.0% across all models.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
