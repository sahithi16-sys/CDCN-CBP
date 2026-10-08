import React, { useState } from 'react';
import { ComparisonResult, ProtocolType } from '../types/simulation';
import { runHeadlessSimulation } from '../simulations/engine';
import { PerformanceChart } from './PerformanceChart';
import { X, Play } from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [totalPackets, setTotalPackets] = useState<number>(10);
  const [windowSize, setWindowSize] = useState<number>(3);
  const [packetLossProb, setPacketLossProb] = useState<number>(0.2);
  const [ackLossProb, setAckLossProb] = useState<number>(0.1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Baseline results
  const [results, setResults] = useState<ComparisonResult[]>(() => {
    return [
      runHeadlessSimulation('stop-and-wait', 10, 1, 0.2, 0.1),
      runHeadlessSimulation('go-back-n', 10, 3, 0.2, 0.1),
      runHeadlessSimulation('selective-repeat', 10, 3, 0.2, 0.1),
    ];
  });

  if (!isOpen) return null;

  const handleRunBenchmark = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const sw = runHeadlessSimulation('stop-and-wait', totalPackets, 1, packetLossProb, ackLossProb);
      const gbn = runHeadlessSimulation('go-back-n', totalPackets, windowSize, packetLossProb, ackLossProb);
      const sr = runHeadlessSimulation('selective-repeat', totalPackets, windowSize, packetLossProb, ackLossProb);
      setResults([sw, gbn, sr]);
      setIsSimulating(false);
    }, 80);
  };

  const getResult = (type: ProtocolType) => results.find((r) => r.protocol === type);

  const swRes = getResult('stop-and-wait');
  const gbnRes = getResult('go-back-n');
  const srRes = getResult('selective-repeat');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-lime-400"></span>
            <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-neutral-100">
              PROTOCOL COMPARISON
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Controls */}
          <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 items-end text-xs">
            <div>
              <label className="block text-[10px] uppercase text-neutral-500 mb-1">Packets</label>
              <select
                value={totalPackets}
                onChange={(e) => setTotalPackets(Number(e.target.value))}
                className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} Packets</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-neutral-500 mb-1">Window Size</label>
              <select
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
              >
                {[2, 3, 4, 5].map((w) => (
                  <option key={w} value={w}>W = {w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-neutral-500 mb-1">Packet Loss</label>
              <select
                value={packetLossProb}
                onChange={(e) => setPacketLossProb(Number(e.target.value))}
                className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
              >
                {[0, 0.1, 0.2, 0.3, 0.4].map((l) => (
                  <option key={l} value={l}>{(l * 100).toFixed(0)}%</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-neutral-500 mb-1">ACK Loss</label>
              <select
                value={ackLossProb}
                onChange={(e) => setAckLossProb(Number(e.target.value))}
                className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
              >
                {[0, 0.1, 0.2, 0.3].map((l) => (
                  <option key={l} value={l}>{(l * 100).toFixed(0)}%</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <button
                onClick={handleRunBenchmark}
                disabled={isSimulating}
                className="w-full py-1.5 px-3 bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isSimulating ? 'Running...' : 'Compare'}</span>
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 bg-neutral-50 dark:bg-neutral-950">
                  <th className="py-2 px-3">Protocol</th>
                  <th className="py-2 px-3">Window</th>
                  <th className="py-2 px-3">Packets Sent</th>
                  <th className="py-2 px-3">Retransmissions</th>
                  <th className="py-2 px-3">Timeouts</th>
                  <th className="py-2 px-3">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                <tr>
                  <td className="py-2 px-3 font-bold">Stop-and-Wait</td>
                  <td className="py-2 px-3">1</td>
                  <td className="py-2 px-3">{swRes?.transmissions ?? '—'}</td>
                  <td className="py-2 px-3">{swRes?.retransmissions ?? '—'}</td>
                  <td className="py-2 px-3">{swRes?.timeouts ?? '—'}</td>
                  <td className="py-2 px-3 font-bold text-neutral-900 dark:text-neutral-100">{swRes?.efficiency ?? '—'}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold">Go-Back-N</td>
                  <td className="py-2 px-3">{windowSize}</td>
                  <td className="py-2 px-3">{gbnRes?.transmissions ?? '—'}</td>
                  <td className="py-2 px-3">{gbnRes?.retransmissions ?? '—'}</td>
                  <td className="py-2 px-3">{gbnRes?.timeouts ?? '—'}</td>
                  <td className="py-2 px-3 font-bold text-neutral-900 dark:text-neutral-100">{gbnRes?.efficiency ?? '—'}%</td>
                </tr>
                <tr className="bg-lime-50/40 dark:bg-lime-950/20">
                  <td className="py-2 px-3 font-bold">Selective Repeat</td>
                  <td className="py-2 px-3">{windowSize}</td>
                  <td className="py-2 px-3">{srRes?.transmissions ?? '—'}</td>
                  <td className="py-2 px-3">{srRes?.retransmissions ?? '—'}</td>
                  <td className="py-2 px-3">{srRes?.timeouts ?? '—'}</td>
                  <td className="py-2 px-3 font-bold text-lime-600 dark:text-lime-400">{srRes?.efficiency ?? '—'}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Performance Charts */}
          <PerformanceChart results={results} />
        </div>
      </div>
    </div>
  );
};
