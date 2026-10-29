import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  phase: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, phase, description }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4 shadow-sm">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
        <Construction className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          Programado para {phase}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
};
