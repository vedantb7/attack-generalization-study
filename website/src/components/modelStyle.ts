import type { ModelId } from '../data/researchData';

/** Theme-aware model colours (defined as CSS variables in index.css). */
export const MODEL_COLOR: Record<ModelId, string> = {
  baseline: 'var(--model-baseline)',
  lr: 'var(--model-lr)',
  dt: 'var(--model-dt)',
  rf: 'var(--model-rf)',
  xgb: 'var(--model-xgb)',
};

export const MODEL_ABBR: Record<ModelId, string> = {
  baseline: 'Base',
  lr: 'LR',
  dt: 'DT',
  rf: 'RF',
  xgb: 'XGB',
};

export const fmtP = (p: number): string => (p < 0.001 ? p.toExponential(1) : p.toFixed(3));

export const budgetLabel = (b: string): string => b.replace('fpr_', '').replace('pct', '%');
