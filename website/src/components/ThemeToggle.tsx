import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'burgundy' | 'navy';
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isNavy = theme === 'navy';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border border-surface-border bg-surface-card hover:border-accent-border shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
      aria-label={`Switch to ${isNavy ? 'Burgundy + Ivory' : 'Midnight Navy + Champagne'} theme`}
      title={`Switch to ${isNavy ? 'Burgundy + Ivory' : 'Midnight Navy + Champagne'} theme`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isNavy ? (
          <Moon className="w-3.5 h-3.5 text-champagne animate-in fade-in duration-200" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-burgundy-deep animate-in fade-in duration-200" />
        )}
      </div>
      <span className="hidden sm:inline font-mono tracking-wide text-content-secondary">
        {isNavy ? 'Midnight Navy' : 'Burgundy & Ivory'}
      </span>
    </button>
  );
};
