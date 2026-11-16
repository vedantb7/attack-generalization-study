import React, { useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import { DATASET_SPECIFICATION } from '../data/researchData';

export const DatasetPipeline: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<number>(0);

  const FEATURE_EXAMPLES: Record<number, string[]> = {
    0: ['duration', 'protocol_type (tcp/udp/icmp)', 'service (http/smtp/...)', 'flag (SF/REJ/S0/...)', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment', 'urgent'],
    1: ['hot', 'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations', 'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login'],
    2: ['count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate'],
    3: ['dst_host_count', 'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate']
  };

  return (
    <section id="dataset" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Dataset & Preprocessing Architecture</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            The NSL-KDD Benchmark & Strict Leakage-Free Pipeline
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Each observation represents a single aggregated TCP/IP network connection record summarized across 41 predictive telemetry features. To prevent evaluation leakage, all preprocessing parameters are fitted strictly inside cross-validation training folds.
          </p>
        </div>

        {/* Dataset Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left: Distribution Inversion Comparison */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-serif font-semibold text-lg text-content-primary">
                Partition Footprint & Distribution Inversion
              </h3>
              <span className="text-xs font-mono text-content-muted">Tavallaee et al. (2009)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Training Partition */}
              <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent-primary">KDDTrain+</span>
                  <span className="font-num text-xs text-content-muted">125,973 flows</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Normal (0):</span>
                    <span className="text-content-primary font-semibold">67,343 (53.46%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-border overflow-hidden flex">
                    <div className="bg-emerald-600 dark:bg-emerald-500 h-full" style={{ width: '53.46%' }} />
                    <div className="bg-rose-600 dark:bg-rose-500 h-full" style={{ width: '46.54%' }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Attack (1):</span>
                    <span className="text-content-primary font-semibold">58,630 (46.54%)</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-surface-border/60 text-[11px] text-content-muted">
                  Contains 22 distinct attack signatures across 4 DARPA categories.
                </div>
              </div>

              {/* Test Partition */}
              <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent-primary">KDDTest+</span>
                  <span className="font-num text-xs text-content-muted">22,543 flows</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Normal (0):</span>
                    <span className="text-content-primary font-semibold">9,710 (43.07%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-border overflow-hidden flex">
                    <div className="bg-emerald-600 dark:bg-emerald-500 h-full" style={{ width: '43.07%' }} />
                    <div className="bg-rose-600 dark:bg-rose-500 h-full" style={{ width: '56.93%' }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Attack (1):</span>
                    <span className="text-content-primary font-semibold">12,833 (56.93%)</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-surface-border/60 text-[11px] text-content-muted">
                  <strong>Distribution Inversion:</strong> Attack majority (56.9%) with 17 novel unseen attack signatures ($n=3,750$).
                </div>
              </div>
            </div>

            {/* Target Leakage Warning Box */}
            <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-950 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Strict Metadata Leakage Prevention:</strong>
                Column 43 (<code className="font-mono text-[11px]">difficulty_level</code>) represents the post-hoc consensus classification accuracy of 21 machine learning learners trained on the original KDD Cup data. Including it as an input predictor would constitute severe target leakage. Our pipeline rigorously strips <code className="font-mono text-[11px]">difficulty_level</code> from all feature matrices $X$.
              </div>
            </div>
          </div>

          {/* Right: 41 Features Taxonomy Selector */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
                <h3 className="font-serif font-semibold text-lg text-content-primary">
                  41 Input Feature Groups
                </h3>
                <span className="text-xs font-mono text-content-muted">122 Processed</span>
              </div>

              {/* Group Selector Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {DATASET_SPECIFICATION.featureGroups.map((group, idx) => (
                  <button
                    key={group.name}
                    type="button"
                    onClick={() => setSelectedGroup(idx)}
                    className={`p-2.5 rounded-lg text-left text-xs transition-colors border ${
                      selectedGroup === idx
                        ? 'border-accent-primary bg-accent-soft text-accent-primary font-semibold'
                        : 'border-surface-border bg-surface-elevated/40 text-content-muted hover:text-content-primary hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider">{group.count} features</span>
                    </div>
                    <div className="font-medium truncate">{group.name}</div>
                  </button>
                ))}
              </div>

              {/* Selected Group Description */}
              <div className="p-3 rounded-lg bg-surface-elevated/60 text-xs text-content-secondary space-y-2 mb-3">
                <p className="leading-relaxed">
                  {DATASET_SPECIFICATION.featureGroups[selectedGroup].description}
                </p>
                <div className="pt-2 border-t border-surface-border/60">
                  <span className="font-mono text-[10px] text-content-muted uppercase tracking-wider block mb-1.5">
                    Feature Fields ({DATASET_SPECIFICATION.featureGroups[selectedGroup].count}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {FEATURE_EXAMPLES[selectedGroup].map(feat => (
                      <span key={feat} className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-[10px] font-mono text-content-primary">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-content-muted pt-3 border-t border-surface-border">
              Common 122-feature representation shared by all four models.
            </div>
          </div>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm">
          <h3 className="font-serif font-semibold text-base sm:text-lg text-content-primary mb-2">
            End-to-End Controlled Pipeline Architecture
          </h3>
          <p className="text-xs sm:text-sm text-content-muted mb-6">
            Identical preprocessing transformations were applied to all models to guarantee that empirical differences stem strictly from model inductive biases rather than feature engineering discrepancies:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
            {/* Stage 1 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <div className="w-6 h-6 rounded bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
                1
              </div>
              <h4 className="font-semibold text-xs text-content-primary">Raw Data Ingestion</h4>
              <p className="text-[11px] text-content-muted leading-relaxed">
                Load 43-column CSVs. Strip headers if present. Convert categorical labels to binary <code className="font-mono">is_intrusion</code> (Normal=0, Attack=1).
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <div className="w-6 h-6 rounded bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
                2
              </div>
              <h4 className="font-semibold text-xs text-content-primary">Feature Segregation</h4>
              <p className="text-[11px] text-content-muted leading-relaxed">
                Extract 41 predictors. Strictly isolate and drop <code className="font-mono">label</code>, <code className="font-mono">attack_category</code>, and <code className="font-mono">difficulty_level</code>.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <div className="w-6 h-6 rounded bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
                3
              </div>
              <h4 className="font-semibold text-xs text-content-primary">ColumnTransformer</h4>
              <p className="text-[11px] text-content-muted leading-relaxed">
                <code className="font-mono">OneHotEncoder(handle_unknown='ignore')</code> on 3 categoricals (84 cols) + <code className="font-mono">StandardScaler()</code> on 38 numerical cols &rarr; 122 features.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <div className="w-6 h-6 rounded bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
                4
              </div>
              <h4 className="font-semibold text-xs text-content-primary">5-Fold Fold-Level CV</h4>
              <p className="text-[11px] text-content-muted leading-relaxed">
                Preprocessors fit strictly on each fold's training slice (N=100,778). 25 Optuna TPE trials maximizing validation Macro-F1.
              </p>
            </div>

            {/* Stage 5 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <div className="w-6 h-6 rounded bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
                5
              </div>
              <h4 className="font-semibold text-xs text-content-primary">One-Time Test Eval</h4>
              <p className="text-[11px] text-content-muted leading-relaxed">
                Final models fit on full KDDTrain+. Official KDDTest+ (N=22,543) evaluated exactly once at fixed 0.50 threshold (zero tuning).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
