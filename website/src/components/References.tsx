import React from 'react';
import { BookOpen } from 'lucide-react';

const REFERENCES: { authors: string; title: string; venue: string; url?: string; urlLabel?: string }[] = [
  {
    authors: 'Tavallaee, M., Bagheri, E., Lu, W., & Ghorbani, A. A. (2009).',
    title: 'A Detailed Analysis of the KDD CUP 99 Data Set.',
    venue: 'Proceedings of the 2009 IEEE Symposium on Computational Intelligence for Security and Defense Applications (CISDA), Ottawa, ON, Canada, pp. 1–6.',
  },
  {
    authors: 'Canadian Institute for Cybersecurity, University of New Brunswick.',
    title: 'NSL-KDD Dataset.',
    venue: 'Original source (the download is no longer offered there); the copy used here is the Kaggle mirror by hassan06.',
    url: 'https://www.unb.ca/cic/datasets/nsl.html',
    urlLabel: 'unb.ca/cic/datasets/nsl.html',
  },
  {
    authors: 'NSL-KDD (Kaggle mirror).',
    title: 'KDDTrain+ and KDDTest+ files.',
    venue: 'Kaggle dataset hassan06/nslkdd.',
    url: 'https://www.kaggle.com/datasets/hassan06/nslkdd/data',
    urlLabel: 'kaggle.com/datasets/hassan06/nslkdd',
  },
  {
    authors: 'McNemar, Q. (1947).',
    title: 'Note on the sampling error of the difference between correlated proportions or percentages.',
    venue: 'Psychometrika, 12(2), pp. 153–157.',
  },
  {
    authors: 'Holm, S. (1979).',
    title: 'A simple sequentially rejective multiple test procedure.',
    venue: 'Scandinavian Journal of Statistics, 6(2), pp. 65–70.',
  },
];

export const References: React.FC = () => (
  <section id="references" className="py-16 md:py-24 border-b border-surface-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-8">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-accent-primary uppercase mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sources</span>
        </div>
        <h2 className="font-editorial-heading text-2xl sm:text-3xl md:text-4xl font-medium text-content-primary tracking-tight">
          References
        </h2>
      </div>
      <ol className="space-y-4 max-w-4xl list-decimal pl-5 marker:font-mono marker:text-content-muted">
        {REFERENCES.map(r => (
          <li key={r.title} className="text-sm text-content-muted leading-relaxed pl-1">
            <span className="text-content-primary font-medium">{r.authors}</span> <em>{r.title}</em> {r.venue}
            {r.url && (
              <>
                {' '}
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accent-primary hover:underline break-all">
                  {r.urlLabel}
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  </section>
);
