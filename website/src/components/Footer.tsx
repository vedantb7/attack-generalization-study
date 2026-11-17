import React from 'react';
import { Database, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-elevated/40 border-t border-surface-border py-12 text-xs font-mono text-content-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-serif font-bold text-sm sm:text-base text-content-primary">
              Signature Memorization vs. Unseen Attack Generalization in Network Intrusion Detection
            </h2>
            <p className="text-[11px] text-content-muted">
              ES 335: Machine Learning (Semester 5) • Indian Institute of Technology Gandhinagar
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.kaggle.com/datasets/hassan06/nslkdd/data"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-card border border-surface-border hover:text-content-primary transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Dataset (Kaggle)</span>
            </a>
            <a
              href="https://www.unb.ca/cic/datasets/nsl.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-card border border-surface-border hover:text-content-primary transition-colors"
              title="Original source; the download is no longer available there"
            >
              <span>Original source (UNB)</span>
            </a>
            <a
              href="https://github.com/vedantb7/attack-generalization-study"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-card border border-surface-border hover:text-content-primary transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            Authored by <strong className="text-content-primary">Vedant Bondekar & Dhruv Meshram</strong> (IIT Gandhinagar)
          </div>
          <div>
            Built with React, TypeScript & Tailwind CSS • Controlled Benchmark 2026
          </div>
        </div>
      </div>
    </footer>
  );
};
