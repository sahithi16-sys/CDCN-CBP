import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ComparisonResult } from '../types/simulation';

interface PerformanceChartProps {
  results: ComparisonResult[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ results }) => {
  const chartData = results.map((r) => ({
    name: r.protocol === 'stop-and-wait' ? 'S&W' : r.protocol === 'go-back-n' ? 'GBN' : 'SR',
    Efficiency: r.efficiency,
    Retransmissions: r.retransmissions,
    TotalAttempts: r.transmissions,
    Timeouts: r.timeouts,
  }));

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Chart 1: Efficiency & Total Attempts */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <span className="font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
            Efficiency (%) vs Total Attempts
          </span>
          <span className="text-[10px] text-neutral-400">Benchmark Metric</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#e5e5e5" />
              <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#262626',
                  borderRadius: '0px',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
              <Bar dataKey="Efficiency" fill="#bef264" name="Efficiency (%)" />
              <Bar dataKey="TotalAttempts" fill="#737373" name="Total Attempts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Retransmissions & Timeouts */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <span className="font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
            Retransmissions & Timeouts Triggered
          </span>
          <span className="text-[10px] text-neutral-400">Overhead Metric</span>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#e5e5e5" />
              <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#262626',
                  borderRadius: '0px',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
              <Bar dataKey="Retransmissions" fill="#ef4444" name="Retransmissions" />
              <Bar dataKey="Timeouts" fill="#f59e0b" name="Timeouts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
