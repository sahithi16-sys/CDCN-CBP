import React from 'react';
import { SimulationSpeed } from '../types/simulation';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';

interface ControlsBarProps {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  speed: SimulationSpeed;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: SimulationSpeed) => void;
  currentStep: number;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isRunning,
  isPaused,
  isCompleted,
  speed,
  onStart,
  onPause,
  onResume,
  onStep,
  onReset,
  onChangeSpeed,
  currentStep,
}) => {
  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isRunning && !isPaused) return 'Running';
    if (isPaused) return 'Paused';
    return 'Idle';
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-3 sm:p-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isRunning || isCompleted ? (
            <button
              onClick={onStart}
              disabled={isCompleted}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border border-black ${
                isCompleted
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 border-neutral-300 dark:border-neutral-700 cursor-not-allowed'
                  : 'bg-lime-400 hover:bg-lime-300 text-black'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-lime-400 hover:bg-lime-300 text-black border border-black transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black border border-black dark:border-white hover:opacity-90 transition-colors"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStep}
            disabled={isCompleted}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
              isCompleted
                ? 'opacity-40 cursor-not-allowed border-neutral-300 dark:border-neutral-700 text-neutral-400'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-900 dark:text-neutral-100'
            }`}
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 hover:border-red-500 hover:text-red-500 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] uppercase text-neutral-500 font-bold">
            Speed:
          </span>
          <div className="flex border border-neutral-200 dark:border-neutral-800">
            {([0.5, 1, 2, 4] as SimulationSpeed[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`px-2.5 py-1 text-xs transition-colors border-r last:border-r-0 border-neutral-200 dark:border-neutral-800 ${
                  speed === s
                    ? 'bg-lime-400 text-black font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry info */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase text-neutral-400 mr-1.5">Status:</span>
            <span className={`font-bold uppercase ${
              isRunning && !isPaused ? 'text-lime-600 dark:text-lime-400' : 'text-neutral-900 dark:text-neutral-100'
            }`}>
              {getStatusText()}
            </span>
          </div>

          <div className="border-l border-neutral-200 dark:border-neutral-800 pl-4">
            <span className="text-[10px] uppercase text-neutral-400 mr-1.5">Step:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {currentStep}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
