import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ResearchQuestion } from './components/ResearchQuestion';
import { DatasetPipeline } from './components/DatasetPipeline';
import { ModelsCompared } from './components/ModelsCompared';
import { BenchmarkResults } from './components/BenchmarkResults';
import { CategoryAnalysis } from './components/CategoryAnalysis';
import { GeneralizationGap } from './components/GeneralizationGap';
import { UnseenAttackExplorer } from './components/UnseenAttackExplorer';
import { ErrorAnalysis } from './components/ErrorAnalysis';
import { StatisticalAnalysis } from './components/StatisticalAnalysis';
import { LimitationsConclusions } from './components/LimitationsConclusions';
import { Reproducibility } from './components/Reproducibility';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'burgundy' | 'navy'>(() => {
    try {
      const saved = localStorage.getItem('research-theme');
      if (saved === 'navy' || saved === 'burgundy') {
        return saved;
      }
    } catch (e) {}
    return 'burgundy';
  });

  useEffect(() => {
    // Reflect theme on documentElement and sync meta[name="color-scheme"]
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('research-theme', theme);
    } catch (e) {}

    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute('content', theme === 'navy' ? 'dark' : 'light');
    }
  }, [theme]);

  // Sync across tabs via window storage event (Modern Web Guidance)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'research-theme' && (e.newValue === 'burgundy' || e.newValue === 'navy')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'burgundy' ? 'navy' : 'burgundy'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-content-primary selection:bg-accent-primary selection:text-white transition-colors duration-200">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1">
        <Hero />
        <ResearchQuestion />
        <DatasetPipeline />
        <ModelsCompared />
        <BenchmarkResults />
        <CategoryAnalysis />
        <GeneralizationGap />
        <UnseenAttackExplorer />
        <ErrorAnalysis />
        <StatisticalAnalysis />
        <LimitationsConclusions />
        <Reproducibility />
      </main>
      <Footer />
    </div>
  );
};

export default App;
