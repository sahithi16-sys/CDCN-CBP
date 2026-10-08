import React from 'react';

interface DynamicExplanationPanelProps {
  currentExplanation: string;
}

export const DynamicExplanationPanel: React.FC<DynamicExplanationPanelProps> = ({
  currentExplanation,
}) => {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black px-4 py-2.5 flex items-center gap-3 font-mono text-xs">
      <span className="font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100 whitespace-nowrap flex items-center gap-2">
        <span className="w-2 h-2 bg-lime-400 inline-block"></span>
        CURRENT EVENT:
      </span>
      <span className="text-neutral-800 dark:text-neutral-200 font-medium">
        {currentExplanation}
      </span>
    </div>
  );
};
