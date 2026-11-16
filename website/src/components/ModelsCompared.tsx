import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, Cpu, Binary, GitFork, Boxes } from 'lucide-react';
import { MODELS } from '../data/researchData';

export const ModelsCompared: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('dt');
  const [expandedHyperparams, setExpandedHyperparams] = useState<boolean>(false);

  const current = MODELS.find(m => m.id === selectedModel) || MODELS[2];

  const ICONS: Record<string, React.ReactNode> = {
    baseline: <Binary className="w-5 h-5" />,
    lr: <Cpu className="w-5 h-5" />,
    dt: <GitFork className="w-5 h-5" />,
    rf: <Boxes className="w-5 h-5" />
  };

  return (
    <section id="models" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Model Architectures & Hyperparameters</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Four Controlled Benchmarks: From Heuristic to Deep Ensemble
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            We systematically compare four distinct algorithmic inductive biases—a constant heuristic baseline, a regularized linear model, an interpretable recursive partition tree, and a high-capacity randomized tree ensemble.
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {MODELS.map(model => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'border-accent-primary bg-surface-card shadow-md ring-1 ring-accent-primary'
                    : 'border-surface-border bg-surface-card/60 hover:bg-surface-card text-content-muted hover:text-content-primary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-accent-soft text-accent-primary' : 'bg-surface-elevated text-content-muted'}`}>
                    {ICONS[model.id]}
                  </div>
                  <span className="font-mono text-[10px] text-content-muted">{model.type}</span>
                </div>
                <div className="font-serif font-semibold text-sm sm:text-base text-content-primary truncate">
                  {model.shortName}
                </div>
                <div className="font-num text-xs text-content-muted mt-1">
                  CV Macro-F1: <strong className="text-content-primary">{model.cvMacroF1.toFixed(4)}</strong>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Model Deep Dive Card */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-accent-soft text-accent-primary font-medium border border-accent-border">
                  {current.type}
                </span>
                <span className="text-xs text-content-muted font-mono">
                  Controlled Optimization (25 Optuna Trials)
                </span>
              </div>
              <h3 className="font-editorial-heading text-xl sm:text-2xl font-semibold text-content-primary mt-1">
                {current.name}
              </h3>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-2 rounded bg-surface-elevated/60 text-center">
                <span className="text-content-muted block text-[10px]">Cross-Validation</span>
                <span className="font-bold text-content-primary">{current.cvMacroF1.toFixed(4)} {current.cvStd ? `± ${current.cvStd.toFixed(4)}` : ''}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated/60 text-center">
                <span className="text-content-muted block text-[10px]">Inference Latency</span>
                <span className="font-bold text-accent-primary">{current.latencyUs.toFixed(2)} μs / flow</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-primary">
                Experimental Role & Scientific Objective
              </h4>
              <p className="text-sm text-content-primary leading-relaxed">
                {current.role}
              </p>
              <p className="text-xs text-content-muted leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Hyperparameters Snapshot */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-primary">
                  Optimal Hyperparameters
                </h4>
                <button
                  type="button"
                  onClick={() => setExpandedHyperparams(!expandedHyperparams)}
                  className="text-xs font-mono text-content-muted hover:text-content-primary inline-flex items-center gap-1 focus:outline-none"
                >
                  <span>{expandedHyperparams ? 'Collapse Details' : 'Expand Search Bounds'}</span>
                  {expandedHyperparams ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="rounded-lg bg-surface-elevated/60 border border-surface-border p-3 text-xs font-mono space-y-1.5">
                {Object.entries(current.hyperparameters).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-0.5 border-b border-surface-border/40 last:border-0">
                    <span className="text-content-muted">{key}:</span>
                    <span className="text-content-primary font-semibold">
                      {val === null ? 'null (None)' : String(val)}
                    </span>
                  </div>
                ))}
              </div>

              {expandedHyperparams && (
                <div className="p-3 rounded-lg bg-surface-elevated text-xs font-mono text-content-muted border border-surface-border space-y-1 animate-in fade-in duration-150">
                  <div className="font-semibold text-content-primary mb-1">Optuna TPE 5-Fold CV Tuning Protocol:</div>
                  <div>• Budget: 25 randomized trials with Tree-structured Parzen Estimator</div>
                  <div>• Objective: Macro-averaged F1 on train_sub (100,778 samples)</div>
                  <div>• Seed: 42 fixed across fold splits and sampler</div>
                  <div>• Decision Threshold: 0.50 fixed (no snooping on test set)</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
