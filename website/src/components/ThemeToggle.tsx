import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'burgundy' | 'navy';
  toggleTheme: () => void;
}

/** Two-state switch: light (Burgundy & Ivory) and dark (Midnight Navy). */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'navy';
  const label = isDark ? 'Switch to light theme (Burgundy & Ivory)' : 'Switch to dark theme (Midnight Navy)';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full border border-surface-border bg-surface-elevated p-0.5 transition-colors hover:border-accent-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
    >
      <Sun className={`absolute left-2 h-3.5 w-3.5 transition-opacity ${isDark ? 'opacity-50 text-content-muted' : 'opacity-0'}`} aria-hidden="true" />
      <Moon className={`absolute right-2 h-3.5 w-3.5 transition-opacity ${isDark ? 'opacity-0' : 'opacity-50 text-content-muted'}`} aria-hidden="true" />
      <span
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-[color:var(--color-on-accent)] shadow-sm transition-transform duration-200 ${isDark ? 'translate-x-[26px]' : 'translate-x-0'}`}
        aria-hidden="true"
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
};
