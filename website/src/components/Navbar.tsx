import React, { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Github, Menu, X, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  theme: 'burgundy' | 'navy';
  toggleTheme: () => void;
}

const NAV_LINKS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Hypothesis', href: '#question' },
  { label: 'Pipeline', href: '#dataset' },
  { label: 'Models', href: '#models' },
  { label: 'Results', href: '#benchmark' },
  { label: 'Generalization', href: '#generalization' },
  { label: 'Unseen Explorer', href: '#explorer' },
  { label: 'Error Analysis', href: '#errors' },
  { label: 'Significance', href: '#statistics' },
  { label: 'Limitations', href: '#limitations' },
  { label: 'Reproduce', href: '#reproduce' },
];

export const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress percentage
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100)));
      }

      // Determine active section
      const sectionElements = NAV_LINKS.map(link => {
        const id = link.href.substring(1);
        return { id, el: document.getElementById(id) };
      }).filter(item => item.el !== null);

      const scrollPos = window.scrollY + 120;
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const item = sectionElements[i];
        if (item.el && item.el.offsetTop <= scrollPos) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface-bg/85 border-b border-surface-border transition-colors duration-200">
      {/* Reading Progress Bar */}
      <div
        className="h-[2px] bg-accent-primary transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand / Academic Affiliation */}
        <a
          href="#overview"
          className="flex items-center gap-2 group focus:outline-none"
        >
          <div className="w-7 h-7 rounded-md bg-accent-soft border border-accent-border flex items-center justify-center text-accent-primary group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-semibold text-sm tracking-tight text-content-primary leading-none group-hover:text-accent-primary transition-colors">
              Intrusion Detection ML
            </span>
            <span className="font-mono text-[10px] text-content-muted tracking-wider leading-tight">
              ES 335 • IIT GANDHINAGAR
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 text-xs font-medium">
          {NAV_LINKS.map(link => {
            const isActive = activeSection === link.href.substring(1);
            return (
              <a
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  isActive
                    ? 'text-accent-primary bg-accent-soft font-semibold'
                    : 'text-content-muted hover:text-content-primary hover:bg-surface-elevated/60'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right Action Bar (Theme toggle + GitHub link + Mobile trigger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          <a
            href="https://github.com/vedantb7/instrusion_detection"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full text-content-muted hover:text-content-primary hover:bg-surface-elevated border border-transparent hover:border-surface-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
            aria-label="GitHub Repository"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-elevated border border-surface-border focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-surface-border bg-surface-card px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {NAV_LINKS.map(link => {
              const isActive = activeSection === link.href.substring(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-xs rounded-md font-medium transition-colors ${
                    isActive
                      ? 'text-accent-primary bg-accent-soft font-semibold'
                      : 'text-content-secondary hover:bg-surface-elevated'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
          <div className="pt-2 border-t border-surface-border text-center">
            <span className="font-mono text-[11px] text-content-muted">
              Authors: Vedant Bondekar & Dhruv • IIT Gandhinagar
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
