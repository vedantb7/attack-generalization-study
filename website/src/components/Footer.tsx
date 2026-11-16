import React from 'react';
import { ArrowUp, Database, Github, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-surface-elevated/40 border-t border-surface-border py-12 text-xs font-mono text-content-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-accent-primary" />
              <span className="font-serif font-bold text-sm text-content-primary">
                Network Intrusion Detection Research
              </span>
            </div>
            <p className="text-[11px] text-content-muted font-sans">
              Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection
            </p>
            <p className="text-[11px] text-content-muted">
              ES 335: Machine Learning (Semester 5) • Indian Institute of Technology Gandhinagar
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.unb.ca/cic/datasets/nsl.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-card border border-surface-border hover:text-content-primary transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>NSL-KDD Dataset</span>
            </a>
            <a
              href="https://github.com/vedantb7/instrusion_detection"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-card border border-surface-border hover:text-content-primary transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-md bg-surface-card border border-surface-border hover:text-content-primary transition-colors focus:outline-none"
              aria-label="Back to top"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            Research by <strong className="text-content-primary">Vedant Bondekar & Dhruv</strong> (IIT Gandhinagar)
          </div>
          <div>
            Built with React, TypeScript & Tailwind CSS • Controlled Benchmark 2026
          </div>
        </div>
      </div>
    </footer>
  );
};
