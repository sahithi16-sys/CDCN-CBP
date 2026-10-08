import React from 'react';
import { SimulationStats } from '../types/simulation';

interface StatisticsPanelProps {
  stats: SimulationStats;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats }) => {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          STATISTICS
        </span>
        <span className="text-neutral-500 text-[11px]">
          Efficiency: <strong className="text-lime-600 dark:text-lime-400 text-sm">{stats.efficiency}%</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="border border-neutral-200 dark:border-neutral-800 p-2.5 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[10px] uppercase text-neutral-400 block">Packets Sent</span>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {stats.totalAttempts}
          </span>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 p-2.5 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[10px] uppercase text-neutral-400 block">Packets Received</span>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {stats.deliveredPackets} / {stats.totalPackets}
          </span>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 p-2.5 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[10px] uppercase text-neutral-400 block">Packets Lost</span>
          <span className="text-lg font-bold text-red-600 dark:text-red-400">
            {stats.packetsLost}
          </span>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 p-2.5 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[10px] uppercase text-neutral-400 block">ACKs Lost</span>
          <span className="text-lg font-bold text-red-600 dark:text-red-400">
            {stats.acksLost}
          </span>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 p-2.5 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[10px] uppercase text-neutral-400 block">Retransmissions</span>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {stats.retransmissions}
          </span>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 p-2.5 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[10px] uppercase text-neutral-400 block">Timeouts</span>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {stats.timeouts}
          </span>
        </div>
      </div>
    </div>
  );
};
