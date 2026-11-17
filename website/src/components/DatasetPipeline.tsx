import React, { useState } from 'react';
import { Database, AlertTriangle, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
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
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
            <a
              href="https://www.kaggle.com/datasets/hassan06/nslkdd/data"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary text-[color:var(--color-on-accent)] hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary border border-accent-primary transition-colors"
            >
              <span>Download: NSL-KDD on Kaggle</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.unb.ca/cic/datasets/nsl.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-primary text-accent-primary hover:bg-surface-elevated transition-colors"
              title="The original download is no longer available from this page"
            >
              <span>Original source: Canadian Institute for Cybersecurity (UNB)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="mt-2 text-xs font-mono text-content-muted">
            The original UNB page no longer offers the download, so the files are linked from a Kaggle mirror. Files used: KDDTrain+ and KDDTest+
            (official split, unmodified).
          </p>
        </div>

        {/* Dataset Breakdown Cards */}
        <div id="dataset-split" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left: Distribution Inversion Comparison */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover space-y-6">
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
                  <strong>Distribution Inversion:</strong> Attack majority (56.9%) with 17 novel unseen attack types (3,750 flows).
                </div>
              </div>
            </div>

            {/* Target Leakage Warning Box */}
            <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-950 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Strict Metadata Leakage Prevention:</strong>
                Column 43 (<code className="font-mono text-[11px]">difficulty_level</code>) represents the post-hoc consensus classification accuracy of 21 machine learning learners trained on the original KDD Cup data. Including it as an input predictor would constitute severe target leakage. Our pipeline rigorously strips <code className="font-mono text-[11px]">difficulty_level</code> from every feature matrix.
              </div>
            </div>
          </div>

          {/* Right: 41 Features Taxonomy Selector */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover flex flex-col justify-between">
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
                        ? 'border-accent-primary bg-accent-primary text-[color:var(--color-on-accent)] hover:bg-surface-elevated hover:text-accent-primary hover:border-accent-primary font-semibold'
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
              Common 122-feature representation shared by all models.
            </div>
          </div>
        </div>

        {/* Feature Engineering Justifications & Documentation Callout */}
        <div id="feature-justifications" className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover mb-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Feature Engineering Justifications</span>
              </div>
              <h3 className="font-serif font-semibold text-lg sm:text-xl text-content-primary">
                Why These 41 Features? Controlled Preprocessing Choices
              </h3>
            </div>

            <a
              href="https://github.com/vedantb7/attack-generalization-study/blob/main/docs/features.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold bg-accent-soft text-accent-primary border border-accent-border hover:bg-accent-primary hover:text-[color:var(--color-on-accent)] transition-colors shrink-0"
              title="Read full features justification in docs/features.md"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Read docs/features.md</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs sm:text-sm text-content-muted leading-relaxed font-light">
            Every model receives the <strong>exact same 122-column input representation</strong> (38 standardized numeric features and 84 one-hot encoded categorical columns). There is no per-model feature engineering and no feature selection, so empirical differences between model families isolate structural inductive biases rather than input disparities.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5">
              <strong className="text-content-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                <span>1. Preserve All 41 Predictors</span>
              </strong>
              <p className="text-content-muted leading-relaxed">
                Near-constant flags (<code className="font-mono text-[10px]">root_shell</code>, <code className="font-mono text-[10px]">num_failed_logins</code>, <code className="font-mono text-[10px]">su_attempted</code>) are retained as crucial signals for rare R2L and U2R attacks.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5">
              <strong className="text-content-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                <span>2. Strict Leakage Elimination</span>
              </strong>
              <p className="text-content-muted leading-relaxed">
                <code className="font-mono text-[10px]">difficulty_level</code> alone reaches ROC-AUC 0.763. It and target labels are strictly barred from the feature matrix with programmatic guards.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5">
              <strong className="text-content-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                <span>3. Uncompressed One-Hot Encoding</span>
              </strong>
              <p className="text-content-muted leading-relaxed">
                All 70 network services receive their own column without grouping into an "infrequent" bin, ensuring low-frequency, attack-specific port signatures remain intact.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5">
              <strong className="text-content-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                <span>4. Uniform Scaling Without Log1p</span>
              </strong>
              <p className="text-content-muted leading-relaxed">
                Applying <code className="font-mono text-[10px]">log1p</code> to byte tails was removed from earlier pipelines because it gave linear models an unfair private representation compared to trees.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5">
              <strong className="text-content-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                <span>5. Retain Redundant Clusters</span>
              </strong>
              <p className="text-content-muted leading-relaxed">
                10 pairs have |r| &gt; 0.95 (e.g. the 4 SYN-error features). We rely on L2 regularization and tree splitting rather than arbitrary pruning that risks dropping critical nuances.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5">
              <strong className="text-content-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                <span>6. No Resampling or Outlier Clipping</span>
              </strong>
              <p className="text-content-muted leading-relaxed">
                Training data is 46.5% attack. Extreme byte/packet tails represent genuine physical attack phenomena (e.g. volumetric floods), not corrupt sensor noise.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-elevated/60 border border-surface-border text-xs text-content-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              For more info about features, univariate KS shifts, and raw column dictionaries,{' '}
              <strong className="text-content-primary">refer to the dedicated documentation</strong>:
            </span>
            <a
              href="https://github.com/vedantb7/attack-generalization-study/blob/main/docs/features.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary underline hover:text-accent-hover font-mono font-medium inline-flex items-center gap-1 shrink-0"
            >
              <span>docs/features.md</span>
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          </div>
        </div>

        {/* Visual Pipeline Flow */}
        <div id="pipeline-steps" className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
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
                <code className="font-mono break-all">OneHotEncoder</code> on 3 categoricals (84 cols, unknown levels ignored) + <code className="font-mono break-all">StandardScaler</code> on 38 numerical cols &rarr; 122 features.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <div className="w-6 h-6 rounded bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
                4
              </div>
              <h4 className="font-semibold text-xs text-content-primary">Leave-Attack-Types-Out CV</h4>
              <p className="text-[11px] text-content-muted leading-relaxed">
                5 folds, each holding out a group of training attack types plus a fifth of normal rows. Preprocessor refit per fold; 25 Optuna trials maximise held-out ROC-AUC.
              </p>
            </div>

            {/* Stage 5 */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <div className="w-6 h-6 rounded bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
                5
              </div>
              <h4 className="font-semibold text-xs text-content-primary">Test Eval × 5 Seeds</h4>
              <p className="text-[11px] text-content-muted leading-relaxed">
                Final models refit on all of KDDTrain+ with the full best-trial parameters. KDDTest+ scored once per seed: threshold-free, at matched FPR and at 0.5.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
