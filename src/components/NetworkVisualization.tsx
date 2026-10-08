import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InFlightItem, ProtocolType } from '../types/simulation';
import { ArrowRight, ArrowLeft, X, Check } from 'lucide-react';

interface NetworkVisualizationProps {
  inFlight: InFlightItem[];
  protocol: ProtocolType;
  isRunning: boolean;
  isPaused: boolean;
  packetLossProb: number;
  ackLossProb: number;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  inFlight,
  isRunning,
  isPaused,
  packetLossProb,
  ackLossProb,
}) => {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black font-mono">
      {/* Header bar */}
      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          NETWORK SIMULATION
        </span>
        <div className="flex items-center gap-4 text-[11px] text-neutral-500">
          <span>DATA LOSS: <strong className="text-neutral-900 dark:text-neutral-100">{(packetLossProb * 100).toFixed(0)}%</strong></span>
          <span>ACK LOSS: <strong className="text-neutral-900 dark:text-neutral-100">{(ackLossProb * 100).toFixed(0)}%</strong></span>
          <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
            isRunning && !isPaused ? 'border-lime-500 text-lime-600 dark:text-lime-400' : 'border-neutral-300 dark:border-neutral-700 text-neutral-400'
          }`}>
            {isRunning && !isPaused ? 'CHANNEL ACTIVE' : 'CHANNEL IDLE'}
          </span>
        </div>
      </div>

      {/* Main Channel Tracks Area */}
      <div className="p-4 sm:p-6">
        {/* Node Labels: Sender and Receiver */}
        <div className="flex items-center justify-between mb-3 text-xs font-bold">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <span className="w-2.5 h-2.5 bg-black dark:bg-white inline-block"></span>
            <span className="text-sm">SENDER (TX)</span>
          </div>
          <span className="text-neutral-400 text-[10px] uppercase tracking-widest">
            FULL-DUPLEX CHANNEL
          </span>
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <span className="text-sm">RECEIVER (RX)</span>
            <span className="w-2.5 h-2.5 bg-black dark:bg-white inline-block"></span>
          </div>
        </div>

        {/* Transmission Track 1: DATA PACKETS (TX -> RX) */}
        <div className="relative my-3 h-20 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70 flex items-center px-4 overflow-hidden">
          {/* Hairline track line */}
          <div className="absolute inset-x-8 h-[1px] bg-neutral-300 dark:bg-neutral-700" />
          <div className="absolute left-3 top-2 text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
            DATA CHANNEL →
          </div>

          {/* Render in-flight DATA packets */}
          <AnimatePresence>
            {inFlight
              .filter((item) => item.type === 'DATA')
              .map((item) => {
                const leftPos = Math.min(92, Math.max(5, item.progress));

                return (
                  <motion.div
                    key={item.id}
                    initial={{ left: '5%', opacity: 0 }}
                    animate={{
                      left: `${leftPos}%`,
                      opacity: 1,
                      scale: item.status === 'lost' ? [1, 1.1, 0.7] : 1,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'linear' }}
                    className={`absolute -translate-y-1/2 top-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-tight border ${
                      item.status === 'lost'
                        ? 'bg-red-600 border-red-700 text-white shadow-sm'
                        : item.status === 'delivered'
                        ? 'bg-lime-400 border-black text-black'
                        : 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm'
                    }`}
                  >
                    {item.status === 'lost' ? (
                      <>
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>P{item.seqNum} LOST</span>
                      </>
                    ) : item.status === 'delivered' ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>P{item.seqNum} DELIVERED</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>DATA P{item.seqNum}</span>
                      </>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {inFlight.filter((item) => item.type === 'DATA').length === 0 && (
            <div className="mx-auto text-[11px] text-neutral-400">
              [ Channel Idle — No Data Frames In Flight ]
            </div>
          )}
        </div>

        {/* Transmission Track 2: ACK RETURN PATH (RX -> TX) */}
        <div className="relative my-3 h-20 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70 flex items-center px-4 overflow-hidden">
          {/* Hairline track line */}
          <div className="absolute inset-x-8 h-[1px] bg-neutral-300 dark:bg-neutral-700" />
          <div className="absolute right-3 top-2 text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
            ← ACK RETURN PATH
          </div>

          {/* Render in-flight ACK packets */}
          <AnimatePresence>
            {inFlight
              .filter((item) => item.type === 'ACK')
              .map((item) => {
                const rightPos = Math.min(92, Math.max(5, item.progress));

                return (
                  <motion.div
                    key={item.id}
                    initial={{ right: '5%', opacity: 0 }}
                    animate={{
                      right: `${rightPos}%`,
                      opacity: 1,
                      scale: item.status === 'lost' ? [1, 1.1, 0.7] : 1,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'linear' }}
                    className={`absolute -translate-y-1/2 top-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-tight border ${
                      item.status === 'lost'
                        ? 'bg-red-600 border-red-700 text-white shadow-sm'
                        : item.status === 'delivered'
                        ? 'bg-lime-400 border-black text-black'
                        : 'bg-lime-400 text-black border-black shadow-sm'
                    }`}
                  >
                    {item.status === 'lost' ? (
                      <>
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>ACK{item.seqNum} LOST</span>
                      </>
                    ) : item.status === 'delivered' ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>ACK{item.seqNum} RECEIVED</span>
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>ACK{item.seqNum}</span>
                      </>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {inFlight.filter((item) => item.type === 'ACK').length === 0 && (
            <div className="mx-auto text-[11px] text-neutral-400">
              [ Return Path Idle — Awaiting Receiver Response ]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
