import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ResearchQuestion } from './components/ResearchQuestion';
import { DatasetPipeline } from './components/DatasetPipeline';
import { ModelsCompared } from './components/ModelsCompared';
import { BenchmarkResults } from './components/BenchmarkResults';
import { OperatingPoints } from './components/OperatingPoints';
import { CategoryAnalysis } from './components/CategoryAnalysis';
import { GeneralizationGap } from './components/GeneralizationGap';
import { UnseenAttackExplorer } from './components/UnseenAttackExplorer';
import { ErrorAnalysis } from './components/ErrorAnalysis';
import { Robustness } from './components/Robustness';
import { HeadToHead } from './components/HeadToHead';
import { StatisticalAnalysis } from './components/StatisticalAnalysis';
import { LimitationsConclusions } from './components/LimitationsConclusions';
import { Reproducibility } from './components/Reproducibility';
import { Footer } from './components/Footer';
import { SideNav } from './components/SideNav';

type Theme = 'burgundy' | 'navy';

const readInitialTheme = (): Theme => {
  // index.html sets data-theme before React loads (saved choice, else the OS preference).
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'navy' ? 'navy' : 'burgundy';
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', theme === 'navy' ? 'dark' : 'light');
  }, [theme]);

  // Keep tabs in sync, and follow OS changes until the visitor picks a theme.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'research-theme' && (e.newValue === 'burgundy' || e.newValue === 'navy')) setTheme(e.newValue);
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystem = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('research-theme');
      } catch {
        saved = null;
      }
      if (saved !== 'navy' && saved !== 'burgundy') setTheme(e.matches ? 'navy' : 'burgundy');
    };
    window.addEventListener('storage', onStorage);
    mq.addEventListener('change', onSystem);
    return () => {
      window.removeEventListener('storage', onStorage);
      mq.removeEventListener('change', onSystem);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next: Theme = prev === 'burgundy' ? 'navy' : 'burgundy';
      try {
        localStorage.setItem('research-theme', next);
      } catch {
        /* storage unavailable: the choice lasts for this page view */
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-content-primary transition-colors duration-200">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className="flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:grid-cols-[minmax(0,1fr)_19rem]">
        <main className="min-w-0">
          <Hero />
          <ResearchQuestion />
          <DatasetPipeline />
          <ModelsCompared />
          <BenchmarkResults />
          <OperatingPoints />
          <CategoryAnalysis />
          <GeneralizationGap />
          <UnseenAttackExplorer />
          <ErrorAnalysis />
          <Robustness />
          <HeadToHead />
          <StatisticalAnalysis />
          <LimitationsConclusions />
          <Reproducibility />
        </main>
        <SideNav />
      </div>
      <Footer />
    </div>
  );
};

export default App;
