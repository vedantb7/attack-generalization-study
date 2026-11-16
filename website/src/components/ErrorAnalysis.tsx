import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { UNSEEN_ATTACKS, ATTACK_CATEGORIES, LEARNED_IDS, MODEL_NAMES, SEED_SUMMARY } from '../data/researchData';

export const ErrorAnalysis: React.FC = () => {
  const blind = UNSEEN_ATTACKS.filter(a => LEARNED_IDS.every(id => a.results[id].recall < 10));
  const blindFlows = blind.reduce((s, a) => s + a.count, 0);
  const totalUnseen = UNSEEN_ATTACKS.reduce((s, a) => s + a.count, 0);
  const r2l = ATTACK_CATEGORIES.find(c => c.category === 'R2L');
  const r2lBest = r2l ? Math.max(...LEARNED_IDS.map(id => r2l.recall[id])) : 0;
  const dtSpread = SEED_SUMMARY.dt.unseenRecall;

  const cards = [
    {
      title: 'Blind spots shared by every model',
      body: `${blind.length} unseen attack types (${blindFlows.toLocaleString()} of ${totalUnseen.toLocaleString()} unseen flows, ${((blindFlows / totalUnseen) * 100).toFixed(0)}%) are detected at under 10% by all four learned models at threshold 0.5.`,
      list: blind.map(a => `${a.name} (${a.category}, ${a.count})`),
    },
    {
      title: 'R2L traffic looks normal',
      body: `Remote-to-local attacks (password guessing, SNMP abuse, tunnelling) produce connection records close to normal sessions. The best model detects only ${r2lBest.toFixed(1)}% of the ${r2l?.total.toLocaleString()} R2L test flows, seen or unseen.`,
      list: [] as string[],
    },
    {
      title: 'Single trees are unstable',
      body: `The Decision Tree's unseen recall at 0.5 ranges from ${Math.min(...dtSpread.values).toFixed(1)}% to ${Math.max(...dtSpread.values).toFixed(1)}% across seeds (SD ${dtSpread.std.toFixed(1)} pp). Its few distinct output scores also make it hard to place at a chosen false-positive rate.`,
      list: [] as string[],
    },
  ];

  return (
    <section id="errors" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Error analysis</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">Where every model fails</h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            The differences between models matter less than the failures they share. These patterns are descriptive: no feature-attribution
            analysis was run, so they say <em>where</em> models fail, not <em>why</em>.
          </p>
        </div>
        <div id="shared-failures" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(c => (
            <div key={c.title} className="card-lift p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-3">
              <h3 className="font-serif font-semibold text-base text-content-primary">{c.title}</h3>
              <p className="text-sm text-content-muted leading-relaxed">{c.body}</p>
              {c.list.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.list.map(x => (
                    <span key={x} className="px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-[11px] font-mono text-content-primary">{x}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-content-muted mt-4">Models compared: {LEARNED_IDS.map(id => MODEL_NAMES[id]).join(', ')}.</p>
      </div>
    </section>
  );
};
