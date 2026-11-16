import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, Cpu, Binary, GitFork, Boxes, Layers } from 'lucide-react';
import { MODELS, PROTOCOL, ModelId } from '../data/researchData';

const ICONS: Record<ModelId, React.ReactNode> = {
  baseline: <Binary className="w-5 h-5" />,
  lr: <Cpu className="w-5 h-5" />,
  dt: <GitFork className="w-5 h-5" />,
  rf: <Boxes className="w-5 h-5" />,
  xgb: <Layers className="w-5 h-5" />,
};

const COMPLEXITY_LABEL: Record<string, string> = {
  C: 'C (inverse L2 strength)',
  coef_l2_norm: '‖w‖₂',
  n_nonzero_coef: 'non-zero coefficients',
  n_iter: 'lbfgs iterations',
  depth: 'tree depth',
  n_leaves: 'leaves',
  n_distinct_test_scores: 'distinct output scores',
  n_trees: 'trees',
  mean_depth: 'mean tree depth',
  max_depth: 'max tree depth',
  mean_leaves: 'mean leaves per tree',
  total_leaves: 'total leaves',
};

export const ModelsCompared: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<ModelId>('xgb');
  const [expanded, setExpanded] = useState<boolean>(false);
  const current = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  return (
    <section id="models" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Models & hyperparameters</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Five controlled models: from zero-rule baseline to boosted ensemble
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            A constant baseline, a regularized linear model, a single tree, a bagged ensemble and a boosted ensemble, all trained on the same
            122 features with the same tuning budget, objective and seeds.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {MODELS.map(model => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                aria-pressed={isSelected}
                className={`p-4 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'border-accent-primary bg-surface-card shadow-md ring-1 ring-accent-primary'
                    : 'border-surface-border bg-surface-card/60 hover:bg-surface-card text-content-muted hover:text-content-primary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-accent-soft text-accent-primary' : 'bg-surface-elevated text-content-muted'}`}>{ICONS[model.id]}</div>
                  <span className="font-mono text-[10px] text-content-muted text-right">{model.type}</span>
                </div>
                <div className="font-serif font-semibold text-sm sm:text-base text-content-primary truncate">{model.shortName}</div>
                <div className="font-num text-xs text-content-muted mt-1">
                  {model.cvAuc !== null ? (
                    <>Novelty CV AUC: <strong className="text-content-primary">{model.cvAuc.toFixed(3)}</strong></>
                  ) : (
                    <>No tuning</>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-accent-soft text-accent-primary font-medium border border-accent-border">{current.type}</span>
                {current.cvAuc !== null && (
                  <span className="text-xs text-content-muted font-mono">{PROTOCOL.nTrials} Optuna trials × {PROTOCOL.seeds.length} seeds</span>
                )}
              </div>
              <h3 className="font-editorial-heading text-xl sm:text-2xl font-semibold text-content-primary mt-1">{current.name}</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              {current.cvAuc !== null && (
                <div className="p-2 rounded bg-surface-elevated/60 text-center">
                  <span className="text-content-muted block text-[10px]">Novelty CV AUC (fold SD)</span>
                  <span className="font-bold text-content-primary">{current.cvAuc.toFixed(3)} ({current.cvAucStd?.toFixed(3)})</span>
                </div>
              )}
              <div className="p-2 rounded bg-surface-elevated/60 text-center">
                <span className="text-content-muted block text-[10px]">Inference latency</span>
                <span className="font-bold text-accent-primary">{current.latencyUs.toFixed(2)} μs / flow</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-primary">Role in the study</h4>
              <p className="text-sm text-content-primary leading-relaxed">{current.role}</p>
              <p className="text-xs text-content-muted leading-relaxed">{current.description}</p>
              {Object.keys(current.complexity).length > 0 && (
                <div className="rounded-lg bg-surface-elevated/60 border border-surface-border p-3 text-xs font-mono space-y-1">
                  <div className="font-semibold text-content-primary mb-1">Complexity of the final fit (seed 42)</div>
                  {Object.entries(current.complexity).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-content-muted">{COMPLEXITY_LABEL[k] ?? k}</span>
                      <span className="text-content-primary font-semibold">{Number.isInteger(v) ? v.toLocaleString() : v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-primary">Selected hyperparameters (seed 42)</h4>
                <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs font-mono text-content-muted hover:text-content-primary inline-flex items-center gap-1 focus:outline-none" aria-expanded={expanded}>
                  <span>{expanded ? 'Hide protocol' : 'Show tuning protocol'}</span>
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="rounded-lg bg-surface-elevated/60 border border-surface-border p-3 text-xs font-mono space-y-1.5">
                {Object.entries(current.hyperparameters).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-0.5 border-b border-surface-border/40 last:border-0 gap-3">
                    <span className="text-content-muted">{key}:</span>
                    <span className="text-content-primary font-semibold text-right">{val === null ? 'None' : String(val)}</span>
                  </div>
                ))}
              </div>
              {expanded && (
                <div className="p-3 rounded-lg bg-surface-elevated text-xs font-mono text-content-muted border border-surface-border space-y-1">
                  <div className="font-semibold text-content-primary mb-1">Tuning protocol (identical for every model)</div>
                  <div>• Optuna TPE, {PROTOCOL.nTrials} trials per model and seed</div>
                  <div>• Objective: mean ROC-AUC over {PROTOCOL.nSplits} leave-attack-types-out folds of KDDTrain+</div>
                  <div>• class_weight = None for every model; random_state = run seed</div>
                  <div>• Final refit uses the full best-trial parameter set (checked at runtime)</div>
                  <div>• Seeds: {PROTOCOL.seeds.join(', ')} (primary {PROTOCOL.primarySeed})</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
