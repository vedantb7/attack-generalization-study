import React, { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { TocList, useActiveSection } from './SideNav';
import { Github, Menu, X, ShieldAlert, Database } from 'lucide-react';

interface NavbarProps {
  theme: 'burgundy' | 'navy';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface-bg/90 border-b border-surface-border">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <a href="#overview" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-8 h-8 rounded-md bg-accent-soft border border-accent-border flex items-center justify-center text-accent-primary shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif font-semibold text-sm tracking-tight text-content-primary leading-tight truncate group-hover:text-accent-primary transition-colors">
              Unseen-Attack Generalization in NIDS
            </span>
            <span className="font-mono text-[10px] text-content-muted tracking-wide leading-tight truncate">
              Vedant Bondekar & Dhruv Meshram · ES 335 · IIT Gandhinagar
            </span>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="#dataset"
            title="Dataset sources: Kaggle mirror and original UNB page"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Dataset</span>
          </a>
          <a
            href="https://github.com/vedantb7/instrusion_detection"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Code</span>
          </a>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="lg:hidden p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-elevated border border-surface-border"
            aria-label={open ? 'Close page contents' : 'Open page contents'}
            aria-expanded={open}
            aria-controls="mobile-toc"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-toc" className="lg:hidden border-t border-surface-border bg-surface-card max-h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-3">
          <div className="px-2.5 pb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-content-muted">On this page</div>
          <TocList active={active} onNavigate={() => setOpen(false)} compact />
        </div>
      )}
    </header>
  );
};
