import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Code2, BookOpen, GitBranch } from 'lucide-react';

export const Reproducibility: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const REPRODUCE_BASH = `# 1. Clone repository
git clone https://github.com/vedantb7/instrusion_detection.git
cd "Intrusion Detection"

# 2. Set up virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Verify automated unit test suite (15 data tests + 12 feature tests)
python -m unittest discover tests -v
pytest tests/test_features.py -v

# 4. Reproduce controlled training & 5-fold Optuna tuning
python scripts/run_all_controlled_models.py

# 5. Rebuild and execute comparative evaluation notebook & statistics
python scripts/build_comparison_notebook.py`;

  const BIBTEX_CITATION = `@misc{bondekar2026signature,
  title={Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection},
  author={Bondekar, Vedant and Dhruv},
  year={2026},
  howpublished={Undergraduate Machine Learning Project, ES 335, IIT Gandhinagar},
  url={https://github.com/vedantb7/instrusion_detection}
}`;

  return (
    <section id="reproduce" className="py-16 md:py-24 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Open Science & Verification</span>
          </div>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
            Reproducibility, Repository & Code Assets
          </h2>
          <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed font-light">
            Every serialized model, evaluation metric, prediction record, and statistical test script is archived in the open-source repository for peer verification and reproduction.
          </p>
        </div>

        {/* Reproduce Terminal Commands Box */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm mb-12 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-accent-primary" />
              <h3 className="font-serif font-semibold text-base sm:text-lg text-content-primary">
                End-to-End Replication Instructions
              </h3>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(REPRODUCE_BASH, 'bash')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono text-content-muted hover:text-content-primary bg-surface-elevated border border-surface-border transition-colors self-start sm:self-auto"
            >
              {copied === 'bash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'bash' ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-lg bg-surface-elevated text-xs font-mono text-content-primary overflow-x-auto leading-relaxed border border-surface-border">
            <code>{REPRODUCE_BASH}</code>
          </pre>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-surface-elevated/40 border border-surface-border">
              <span className="text-content-muted block text-[10px]">TRAINED MODELS:</span>
              <span className="font-semibold text-content-primary">models/*_controlled.joblib</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated/40 border border-surface-border">
              <span className="text-content-muted block text-[10px]">METRIC ARCHIVES:</span>
              <span className="font-semibold text-content-primary">results/metrics/*.json</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated/40 border border-surface-border">
              <span className="text-content-muted block text-[10px]">PER-SAMPLE PREDICTIONS:</span>
              <span className="font-semibold text-content-primary">results/predictions/*.csv</span>
            </div>
          </div>
        </div>

        {/* BibTeX Citation Box & Academic AI Disclosure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* BibTeX Citation */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-primary" />
                <h3 className="font-serif font-semibold text-base text-content-primary">
                  Academic Citation (BibTeX)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(BIBTEX_CITATION, 'bibtex')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-content-muted hover:text-content-primary bg-surface-elevated border border-surface-border transition-colors"
              >
                {copied === 'bibtex' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'bibtex' ? 'Copied' : 'Copy BibTeX'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-lg bg-surface-elevated text-xs font-mono text-content-primary overflow-x-auto leading-relaxed border border-surface-border">
              <code>{BIBTEX_CITATION}</code>
            </pre>
          </div>

          {/* Academic Transparency & AI Disclosure */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-serif font-semibold text-base text-content-primary border-b border-surface-border pb-3">
                Project Attribution & AI-Assistance Disclosure
              </h3>
              <p className="text-xs text-content-muted leading-relaxed font-light">
                This project was conducted for <strong className="text-content-primary">ES 335: Machine Learning (Semester 5) at IIT Gandhinagar</strong> by <strong className="text-content-primary">Vedant Bondekar and Dhruv</strong>.
              </p>
              <div className="p-3 rounded-lg bg-surface-elevated/50 border border-surface-border text-xs text-content-muted leading-relaxed">
                <strong>Academic AI Transparency:</strong> Large Language Models (LLMs) were utilized as technical engineering assistants for code formatting, documentation synthesis, and UI scaffolding. All experimental hypotheses, data pipelines, model training runs, and statistical validations were independently audited and verified against authoritative serialized artifacts.
              </div>
            </div>

            <a
              href="https://github.com/vedantb7/instrusion_detection"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold bg-surface-elevated hover:bg-surface-border text-content-primary border border-surface-border transition-colors mt-2"
            >
              <GitBranch className="w-4 h-4 text-accent-primary" />
              <span>Browse Full GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5 text-content-muted" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
