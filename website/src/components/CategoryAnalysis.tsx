import React, { useState } from 'react';
import { Layers3 } from 'lucide-react';
import { ATTACK_CATEGORIES, MODEL_IDS, LEARNED_IDS, MODEL_NAMES } from '../data/researchData';
import { MODEL_COLOR } from './modelStyle';

const NOTES: Record<string, string> = {
  DoS: 'The largest family. Seen DoS (mostly neptune and smurf) is detected at 93–100%, but unseen DoS (apache2, processtable, mailbomb) only at 4–18% at threshold 0.5; mailbomb is missed by every model.',
  Probe: 'Scanning traffic. Unseen Probe is dominated by mscan and saint: saint is caught by every model (95–99%), mscan by 40–81% depending on the model.',
  R2L: 'Remote-to-local attacks look like normal sessions in these features. Every model misses most R2L traffic, seen or unseen.',
  U2R: 'Very rare (67 test rows), so recall estimates are noisy.',
};

export const CategoryAnalysis: React.FC = () => {
  const [selected, setSelected] = useState<string>('DoS');
  const cat = ATTACK_CATEGORIES.find(c => c.category === selected) ?? ATTACK_CATEGORIES[0];

  return (
    <section id="categories" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Layers3 className="w-3.5 h-3.5" />
            <span>Attack categories</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Recall by attack category, and seen vs unseen within each
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Splitting each category into seen and unseen attack types shows that the drop on unseen attacks is not just a change in category
            mix. It appears within DoS and Probe as well.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {ATTACK_CATEGORIES.map(c => (
            <button key={c.category} type="button" onClick={() => setSelected(c.category)} aria-pressed={selected === c.category}
              className={`card-lift p-4 rounded-xl text-left border ${selected === c.category ? 'border-accent-primary bg-surface-card ring-1 ring-accent-primary shadow-md' : 'border-surface-border bg-surface-card/60 hover:bg-surface-card'}`}>
              <div className="font-serif font-semibold text-sm text-content-primary">{c.label}</div>
              <div className="font-num text-xs text-content-muted mt-1">{c.total.toLocaleString()} test rows · {c.unseenN.toLocaleString()} unseen</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="category-recall" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
            <h3 className="font-serif font-semibold text-lg text-content-primary">{cat.label}: recall at threshold 0.5</h3>
            <p className="text-xs text-content-muted mt-1 mb-5">{NOTES[cat.category]}</p>
            <div className="space-y-3">
              {MODEL_IDS.map(id => (
                <div key={id} className="grid grid-cols-[150px_1fr_96px] items-center gap-3 text-xs font-mono">
                  <span className="text-content-primary truncate">{MODEL_NAMES[id]}</span>
                  <div className="h-4 rounded bg-surface-elevated/60 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${cat.recall[id]}%`, background: MODEL_COLOR[id] }} />
                  </div>
                  <span className="text-right font-num text-content-primary">{cat.recall[id].toFixed(1)}% <span className="text-content-muted">({cat.detected[id].toLocaleString()})</span></span>
                </div>
              ))}
            </div>
          </div>

          <div id="category-seen-unseen" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover">
            <h3 className="font-serif font-semibold text-lg text-content-primary">{cat.category}: seen vs unseen attack types</h3>
            <p className="text-xs text-content-muted mt-1 mb-5">
              {cat.seenN.toLocaleString()} seen-type rows vs {cat.unseenN.toLocaleString()} unseen-type rows, threshold 0.5.
            </p>
            <div className="space-y-4">
              {LEARNED_IDS.map(id => (
                <div key={id} className="space-y-1">
                  <div className="text-xs font-mono text-content-primary">{MODEL_NAMES[id]}</div>
                  {(['seen', 'unseen'] as const).map(part => {
                    const v = part === 'seen' ? cat.seenRecall[id] : cat.unseenRecall[id];
                    return (
                      <div key={part} className="grid grid-cols-[60px_1fr_56px] items-center gap-2 text-[11px] font-mono">
                        <span className="text-content-muted">{part}</span>
                        <div className="h-3 rounded bg-surface-elevated/60 overflow-hidden">
                          <div className="h-full rounded" style={{ width: `${v}%`, background: MODEL_COLOR[id], opacity: part === 'seen' ? 1 : 0.55 }} />
                        </div>
                        <span className="text-right font-num text-content-primary">{v.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
