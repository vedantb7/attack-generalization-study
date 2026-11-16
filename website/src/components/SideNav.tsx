import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUp, Database, Github } from 'lucide-react';

export interface TocItem {
  id: string;
  label: string;
  desc?: string;
  children?: { id: string; label: string }[];
}

/** Page outline: every id here exists as an element id in a section component. */
export const TOC: TocItem[] = [
  { id: 'overview', label: 'Overview', desc: 'Central finding at a glance' },
  { id: 'question', label: 'Research question', desc: 'Memorization vs generalization', children: [{ id: 'hypotheses', label: 'Hypotheses & outcomes' }] },
  { id: 'dataset', label: 'Dataset & pipeline', desc: 'NSL-KDD, 122 features, leakage rules', children: [
    { id: 'dataset-split', label: 'Train/test split & features' },
    { id: 'pipeline-steps', label: 'Five-step pipeline' },
  ] },
  { id: 'models', label: 'Models', desc: 'Five models, one protocol', children: [{ id: 'model-details', label: 'Hyperparameters & complexity' }] },
  { id: 'benchmark', label: 'Benchmark results', desc: 'Threshold-free and @0.5 metrics', children: [
    { id: 'metric-explorer', label: 'Metric explorer' },
    { id: 'metrics-table', label: 'All metrics table' },
    { id: 'confusion-matrix', label: 'Confusion matrices' },
  ] },
  { id: 'operating', label: 'Operating points', desc: 'Detection at a fixed false-alarm budget', children: [
    { id: 'roc-explorer', label: 'Interactive ROC explorer' },
    { id: 'matched-fpr', label: 'Matched test FPR' },
    { id: 'deployable-thresholds', label: 'Deployable thresholds' },
  ] },
  { id: 'categories', label: 'Attack categories', desc: 'DoS, Probe, R2L, U2R', children: [
    { id: 'category-recall', label: 'Recall by category' },
    { id: 'category-seen-unseen', label: 'Seen vs unseen per category' },
  ] },
  { id: 'generalization', label: 'Generalization gap', desc: 'Seen → unseen attack types', children: [
    { id: 'auc-gap', label: 'AUC: seen vs unseen' },
    { id: 'recall-gap', label: 'Recall @0.5 with CIs' },
  ] },
  { id: 'explorer', label: 'Unseen attack explorer', desc: 'All 17 unseen types, per model', children: [{ id: 'explorer-table', label: 'Searchable table' }] },
  { id: 'errors', label: 'Error analysis', desc: 'Failures every model shares', children: [{ id: 'shared-failures', label: 'Shared blind spots' }] },
  { id: 'robustness', label: 'Robustness', desc: 'Seeds and capacity sweeps', children: [
    { id: 'seed-variation', label: 'Variation across 5 seeds' },
    { id: 'capacity-sweeps', label: 'Capacity sweeps' },
  ] },
  { id: 'compare', label: 'Head-to-head', desc: 'Compare any two models', children: [
    { id: 'compare-picker', label: 'Pick two models' },
    { id: 'compare-metrics', label: 'Measure by measure' },
    { id: 'compare-tests', label: 'Tests & seed wins' },
  ] },
  { id: 'statistics', label: 'Statistical tests', desc: 'Paired bootstrap, McNemar, Holm', children: [{ id: 'test-results', label: 'Test results' }] },
  { id: 'limitations', label: 'Conclusions', desc: 'What is and is not supported', children: [
    { id: 'supported', label: 'Supported' },
    { id: 'not-supported', label: 'Not supported' },
    { id: 'limitations-list', label: 'Limitations' },
  ] },
  { id: 'reproduce', label: 'Reproduce', desc: 'Commands, artifacts, citation', children: [
    { id: 'reproduce-commands', label: 'Run the notebooks' },
    { id: 'citation', label: 'Cite this work' },
  ] },
];

const ALL_IDS = TOC.flatMap(t => [t.id, ...(t.children ?? []).map(c => c.id)]);

/** Returns the id of the last section/subsection whose top has scrolled past the offset. */
export function useActiveSection(offset = 140): string {
  const [active, setActive] = useState<string>(ALL_IDS[0]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ALL_IDS[0];
      for (const id of ALL_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      // At the very bottom, highlight the last section.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = ALL_IDS[ALL_IDS.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [offset]);
  return active;
}

interface TocListProps {
  active: string;
  onNavigate?: () => void;
  compact?: boolean;
}

export const TocList: React.FC<TocListProps> = ({ active, onNavigate, compact = false }) => {
  const parentOf = useMemo(() => {
    const m: Record<string, string> = {};
    TOC.forEach(t => {
      m[t.id] = t.id;
      (t.children ?? []).forEach(c => (m[c.id] = t.id));
    });
    return m;
  }, []);
  const activeParent = parentOf[active];

  return (
    <ol className="space-y-0.5">
      {TOC.map((item, idx) => {
        const isOpen = activeParent === item.id;
        const isActive = active === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={onNavigate}
              aria-current={isActive ? 'location' : undefined}
              className={`group flex gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors border-l-2 ${
                isOpen ? 'border-accent-primary bg-accent-soft' : 'border-transparent hover:bg-surface-elevated/70'
              }`}
            >
              <span className={`font-num text-[10px] pt-0.5 w-4 shrink-0 ${isOpen ? 'text-accent-primary' : 'text-content-muted'}`}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className={`block text-[13px] leading-snug ${isOpen ? 'font-semibold text-accent-primary' : 'text-content-primary group-hover:text-accent-primary'}`}>
                  {item.label}
                </span>
                {!compact && item.desc && <span className="block text-[11px] leading-snug text-content-muted">{item.desc}</span>}
              </span>
            </a>
            {item.children && (isOpen || compact) && (
              <ol className="ml-[30px] mt-0.5 mb-1 border-l border-surface-border">
                {item.children.map(child => {
                  const childActive = active === child.id;
                  return (
                    <li key={child.id}>
                      <a
                        href={`#${child.id}`}
                        onClick={onNavigate}
                        aria-current={childActive ? 'location' : undefined}
                        className={`block -ml-px pl-3 py-1 text-[12px] leading-snug border-l transition-colors ${
                          childActive
                            ? 'border-accent-primary text-accent-primary font-semibold'
                            : 'border-transparent text-content-muted hover:text-content-primary hover:border-surface-border'
                        }`}
                      >
                        {child.label}
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export const SideNav: React.FC = () => {
  const active = useActiveSection();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <aside aria-label="On this page" className="hidden lg:block h-full border-l border-surface-border">
      <div className="sticky top-[4.5rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto py-6 pl-2 pr-4">
        <div className="mb-3 px-2.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-content-muted">On this page</span>
        </div>
        <div className="mx-2.5 mb-4 h-1 rounded-full bg-surface-elevated overflow-hidden" role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-accent-primary transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
        <nav>
          <TocList active={active} />
        </nav>
        <div className="mt-5 pt-4 mx-2.5 border-t border-surface-border space-y-2 text-[12px]">
          <a href="https://www.unb.ca/cic/datasets/nsl.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-content-muted hover:text-content-primary">
            <Database className="w-3.5 h-3.5" /> NSL-KDD dataset
          </a>
          <a href="https://github.com/vedantb7/instrusion_detection" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-content-muted hover:text-content-primary">
            <Github className="w-3.5 h-3.5" /> Code & notebooks
          </a>
          <a href="#overview" className="flex items-center gap-2 text-content-muted hover:text-content-primary">
            <ArrowUp className="w-3.5 h-3.5" /> Back to top
          </a>
        </div>
      </div>
    </aside>
  );
};
