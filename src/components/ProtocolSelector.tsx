import React from 'react';
import { ProtocolType } from '../types/simulation';

interface ProtocolSelectorProps {
  currentProtocol: ProtocolType;
  onSelect: (protocol: ProtocolType) => void;
  disabled?: boolean;
}

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
  currentProtocol,
  onSelect,
  disabled = false,
}) => {
  const protocols: { type: ProtocolType; label: string }[] = [
    { type: 'stop-and-wait', label: 'Stop-and-Wait' },
    { type: 'go-back-n', label: 'Go-Back-N' },
    { type: 'selective-repeat', label: 'Selective Repeat' },
  ];

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-3 sm:p-4 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          ARQ PROTOCOL
        </span>

        <div className="grid grid-cols-3 gap-2">
          {protocols.map((p) => {
            const isActive = currentProtocol === p.type;
            return (
              <button
                key={p.type}
                type="button"
                onClick={() => onSelect(p.type)}
                disabled={disabled}
                className={`px-3 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
                  isActive
                    ? 'bg-lime-400 text-black border-black font-black'
                    : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
