import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink } from 'lucide-react';

export const Reproducibility: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const REPRODUCE_BASH = `# 1. Clone the repository
git clone https://github.com/vedantb7/attack-generalization-study.git
cd attack-generalization-study

# 2. Set up the environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt      # or requirements-lock.txt for exact versions

# 3. Run every notebook in order (01 -> 11); each saves its own outputs
export PYTHONHASHSEED=42
for nb in notebooks/*.ipynb; do
  jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=-1 "$nb" || break
done
# 02 builds folds + preprocessor, 03-07 train 5 models x 5 seeds,
# 08 compares them, 09 sweeps capacity, 10 adds known-attack CV and
# FPR at 95% recall, 11 regenerates this website's data

# 4. Run the tests (27)
pytest -q tests`;

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
        <div id="reproduce-commands" className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
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
              <span className="font-semibold text-content-primary">models/*.joblib</span>
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

        {/* Academic Transparency & AI Disclosure */}
        <div className="p-6 md:p-8 rounded-xl bg-surface-card border border-surface-border shadow-sm panel-hover space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-3">
            <h3 className="font-serif font-semibold text-base sm:text-lg text-content-primary">
              Project Attribution & AI-Assistance Disclosure
            </h3>
            <a
              href="https://github.com/vedantb7/attack-generalization-study"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-surface-elevated hover:bg-surface-border text-content-primary border border-surface-border transition-colors self-start sm:self-auto shrink-0"
            >
              <span>Browse Full GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5 text-content-muted" />
            </a>
          </div>
          <p className="text-xs sm:text-sm text-content-muted leading-relaxed font-light">
            This project was conducted for <strong className="text-content-primary">ES 335: Machine Learning (Semester 5) at IIT Gandhinagar</strong> by <strong className="text-content-primary">Vedant Bondekar and Dhruv Meshram</strong>.
          </p>
          <div className="p-4 rounded-lg bg-surface-elevated/50 border border-surface-border text-xs text-content-muted leading-relaxed">
            <strong className="text-content-primary">Academic AI Transparency:</strong> Large Language Models (LLMs) were utilized as technical engineering assistants for code formatting, documentation synthesis, and UI scaffolding. All experimental hypotheses, data pipelines, model training runs, and statistical validations were independently audited and verified against authoritative serialized artifacts.
          </div>
        </div>
      </div>
    </section>
  );
};
