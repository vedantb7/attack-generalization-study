import React, { useState, useMemo } from 'react';
import { Search, ShieldAlert, ArrowUpDown, Info } from 'lucide-react';
import { UNSEEN_ATTACKS, UnseenAttackRecord } from '../data/researchData';

export const UnseenAttackExplorer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedModel, setSelectedModel] = useState<'dt' | 'rf' | 'lr' | 'compare'>('compare');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'count' | 'name' | 'recall'>('count');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [activeAttack, setActiveAttack] = useState<UnseenAttackRecord | null>(UNSEEN_ATTACKS[0]);

  // Filter and sort attacks
  const filteredAttacks = useMemo(() => {
    return UNSEEN_ATTACKS.filter(a => {
      const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
      const matchQuery = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    }).sort((a, b) => {
      if (sortField === 'count') {
        return sortAsc ? a.count - b.count : b.count - a.count;
      }
      if (sortField === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortField === 'recall') {
        const key = selectedModel === 'compare' ? 'dt' : selectedModel;
        const recallA = a.results[key].recall;
        const recallB = b.results[key].recall;
        return sortAsc ? recallA - recallB : recallB - recallA;
      }
      return 0;
    });
  }, [selectedCategory, searchQuery, sortField, sortAsc, selectedModel]);

  const toggleSort = (field: 'count' | 'name' | 'recall') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <section id="explorer" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Interactive Tool</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            The 17 Unseen Attack Explorer
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Filter, sort, and inspect detection rates across every novel attack signature present in the official NSL-KDD test set. Understand how aggregate metrics can conceal severe vulnerabilities on rare attacks.
          </p>
        </div>

        {/* Macro vs Sample-Weighted Educational Callout */}
        <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm mb-8 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2 font-serif font-semibold text-base sm:text-lg text-content-primary">
              <Info className="w-4 h-4 text-accent-primary shrink-0" />
              <span>Sample-Weighted vs. Macro-Average Unseen Recall</span>
            </div>
            <span className="text-xs font-mono text-content-muted">High-Priority Analytical Insight</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Logistic Regression Card */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-burgundy-rose block">Logistic Regression</span>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-content-muted">Sample-Weighted:</span>
                  <span className="font-bold text-content-primary">42.08%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Macro-Average:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">17.42%</span>
                </div>
              </div>
              <p className="text-[11px] text-content-muted leading-relaxed pt-1 border-t border-surface-border/60">
                <strong>Why the 24.66 pp gap?</strong> LR detected 730 flows of <code className="font-mono">apache2</code> (99.1%) and 523 of <code className="font-mono">mscan</code> (52.5%). Because these two volumetric attacks represent 46% of all test unseen samples, aggregate recall looks moderate, but across the other 15 attacks it missed nearly 100%!
              </p>
            </div>

            {/* Decision Tree Card */}
            <div className="p-4 rounded-lg bg-accent-soft/40 border border-accent-border space-y-2">
              <span className="font-mono text-xs font-bold text-accent-primary block">Decision Tree (CART)</span>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-content-muted">Sample-Weighted:</span>
                  <span className="font-bold text-accent-primary">53.36%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Macro-Average:</span>
                  <span className="font-bold text-accent-primary">47.98%</span>
                </div>
              </div>
              <p className="text-[11px] text-content-muted leading-relaxed pt-1 border-t border-surface-border/60">
                <strong>True Broad Generalization:</strong> DT detected substantial samples across both volumetric tools and application attacks (<code className="font-mono">snmpguess</code>: 98.8%, <code className="font-mono">saint</code>: 99.4%, <code className="font-mono">httptunnel</code>: 82.7%, <code className="font-mono">ps</code>: 60.0%), maintaining a high macro-average.
              </p>
            </div>

            {/* Random Forest Card */}
            <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-2">
              <span className="font-mono text-xs font-bold text-content-primary block">Random Forest</span>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-content-muted">Sample-Weighted:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">23.25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Macro-Average:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">19.68%</span>
                </div>
              </div>
              <p className="text-[11px] text-content-muted leading-relaxed pt-1 border-t border-surface-border/60">
                <strong>Ensemble Collapse:</strong> RF missed 100% of <code className="font-mono">snmpguess</code> (0/331), <code className="font-mono">mailbomb</code> (0/293), and <code className="font-mono">snmpgetattack</code> (0/178). Its subspace projection memorized training patterns and failed on unseen signatures.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-content-muted mr-1">Category:</span>
            {['All', 'DoS', 'Probe', 'R2L', 'U2R'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors border ${
                  selectedCategory === cat
                    ? 'border-accent-primary bg-accent-soft text-accent-primary font-bold shadow-sm'
                    : 'border-surface-border bg-surface-elevated/40 text-content-muted hover:text-content-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Model Focus Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-content-muted mr-1">Model View:</span>
            {[
              { id: 'compare', label: 'Multi-Model Compare' },
              { id: 'dt', label: 'Decision Tree' },
              { id: 'rf', label: 'Random Forest' },
              { id: 'lr', label: 'Logistic Reg.' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
                  selectedModel === m.id
                    ? 'border-accent-primary bg-accent-primary text-white font-semibold'
                    : 'border-surface-border bg-surface-elevated/40 text-content-muted hover:text-content-primary'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="unseen-attack-search"
              type="text"
              placeholder="Search attack..."
              aria-label="Search unseen attack signatures by name"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-surface-border bg-surface-elevated/40 text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-accent-primary font-mono"
            />
          </div>
        </div>

        {/* The 17 Attacks Data Table & Detail Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Table (8 Cols) */}
          <div className="lg:col-span-8 p-4 sm:p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm">
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="unseen-attacks-caption"
              className="table-wrapper border border-surface-border rounded-lg max-h-[560px] overflow-y-auto"
            >
              <table className="w-full text-left text-xs border-collapse">
                <caption id="unseen-attacks-caption" className="sr-only">
                  Per-attack detection statistics on the 17 novel attack signatures in NSL-KDD
                </caption>
                <thead className="bg-surface-elevated font-mono text-content-secondary sticky top-0 z-10 border-b border-surface-border">
                  <tr>
                    <th scope="col" className="py-2.5 px-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      <div className="flex items-center gap-1">
                        <span>Attack Name</span>
                        <ArrowUpDown className="w-3 h-3 text-content-muted" />
                      </div>
                    </th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">Category</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right cursor-pointer select-none" onClick={() => toggleSort('count')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Count ($n$)</span>
                        <ArrowUpDown className="w-3 h-3 text-content-muted" />
                      </div>
                    </th>
                    {selectedModel === 'compare' ? (
                      <>
                        <th scope="col" className="py-2.5 px-3 font-semibold text-right">Log. Reg.</th>
                        <th scope="col" className="py-2.5 px-3 font-semibold text-right text-accent-primary">Dec. Tree</th>
                        <th scope="col" className="py-2.5 px-3 font-semibold text-right">Rand. Forest</th>
                      </>
                    ) : (
                      <>
                        <th scope="col" className="py-2.5 px-3 font-semibold text-right">Detected</th>
                        <th scope="col" className="py-2.5 px-3 font-semibold text-right">Missed</th>
                        <th scope="col" className="py-2.5 px-3 font-semibold text-right cursor-pointer select-none" onClick={() => toggleSort('recall')}>
                          <div className="flex items-center justify-end gap-1">
                            <span>Recall (%)</span>
                            <ArrowUpDown className="w-3 h-3 text-content-muted" />
                          </div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60 font-num">
                  {filteredAttacks.map((atk, idx) => {
                    const isSelected = activeAttack?.name === atk.name;
                    return (
                      <tr
                        key={atk.name}
                        onClick={() => setActiveAttack(atk)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-accent-soft font-semibold'
                            : idx % 2 === 0 ? 'bg-surface-card hover:bg-surface-elevated/40' : 'bg-surface-elevated/20 hover:bg-surface-elevated/40'
                        }`}
                      >
                        <th scope="row" className="py-2.5 px-3 font-mono font-medium text-content-primary">
                          {atk.name}
                        </th>
                        <td className="py-2.5 px-3 font-mono text-content-muted">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            atk.category === 'DoS' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300' :
                            atk.category === 'Probe' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' :
                            atk.category === 'R2L' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300' :
                            'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                          }`}>
                            {atk.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-content-primary font-bold">
                          {atk.count}
                        </td>

                        {selectedModel === 'compare' ? (
                          <>
                            <td className="py-2.5 px-3 text-right text-content-muted font-mono">
                              {atk.results.lr.recall.toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-3 text-right text-accent-primary font-mono font-bold">
                              {atk.results.dt.recall.toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-3 text-right text-content-muted font-mono">
                              {atk.results.rf.recall.toFixed(1)}%
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">
                              {atk.results[selectedModel].detected}
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-700 dark:text-rose-400">
                              {atk.results[selectedModel].missed}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-accent-primary">
                              {atk.results[selectedModel].recall.toFixed(1)}%
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-content-muted pt-3">
              <span>Showing {filteredAttacks.length} of 17 unseen attack types</span>
              <span>Total novel flows: 3,750</span>
            </div>
          </div>

          {/* Right Selected Attack Profile Card (4 Cols) */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            {activeAttack ? (
              <>
                <div className="border-b border-surface-border pb-3">
                  <span className="text-[10px] font-mono text-accent-primary uppercase tracking-wider block">
                    Selected Attack Profile
                  </span>
                  <h3 className="font-editorial-heading text-xl font-bold text-content-primary mt-1">
                    {activeAttack.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated text-content-secondary">
                      {activeAttack.category}
                    </span>
                    <span className="font-mono text-xs text-content-muted">
                      Total Test Samples: <strong>{activeAttack.count}</strong>
                    </span>
                  </div>
                </div>

                {/* Per-Model Comparison for Active Attack */}
                <div className="space-y-3 pt-1">
                  <span className="text-xs font-mono font-semibold text-content-muted uppercase tracking-wider block">
                    Model Detection Tally:
                  </span>

                  {/* Decision Tree */}
                  <div className="p-3 rounded-lg bg-accent-soft/40 border border-accent-border space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-accent-primary">Decision Tree</span>
                      <span className="font-bold text-accent-primary">{activeAttack.results.dt.recall.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-border overflow-hidden">
                      <div className="bg-accent-primary h-full" style={{ width: `${activeAttack.results.dt.recall}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-content-muted">
                      <span>Detected: {activeAttack.results.dt.detected}</span>
                      <span>Missed: {activeAttack.results.dt.missed}</span>
                    </div>
                  </div>

                  {/* Logistic Regression */}
                  <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-content-primary">Logistic Regression</span>
                      <span className="font-bold text-content-primary">{activeAttack.results.lr.recall.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-border overflow-hidden">
                      <div className="bg-burgundy-rose h-full" style={{ width: `${activeAttack.results.lr.recall}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-content-muted">
                      <span>Detected: {activeAttack.results.lr.detected}</span>
                      <span>Missed: {activeAttack.results.lr.missed}</span>
                    </div>
                  </div>

                  {/* Random Forest */}
                  <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-content-primary">Random Forest</span>
                      <span className="font-bold text-content-primary">{activeAttack.results.rf.recall.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-border overflow-hidden">
                      <div className="bg-content-primary h-full" style={{ width: `${activeAttack.results.rf.recall}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-content-muted">
                      <span>Detected: {activeAttack.results.rf.detected}</span>
                      <span>Missed: {activeAttack.results.rf.missed}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-content-muted leading-relaxed pt-2 border-t border-surface-border">
                  Click any row in the table to display its comparative model performance breakdown.
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-content-muted text-xs">
                Select an attack from the table to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
