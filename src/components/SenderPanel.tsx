import React from 'react';
import { SenderState, PacketInfo, ProtocolType } from '../types/simulation';

interface SenderPanelProps {
  sender: SenderState;
  packets: PacketInfo[];
  protocol: ProtocolType;
  totalPackets: number;
}

export const SenderPanel: React.FC<SenderPanelProps> = ({
  sender,
  packets,
  protocol,
  totalPackets,
}) => {
  const windowEnd = Math.min(sender.base + sender.windowSize - 1, totalPackets);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-neutral-900 dark:bg-neutral-100"></span>
          <span className="font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
            SENDER (TX)
          </span>
        </div>
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
          {sender.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="border border-neutral-200 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[9px] uppercase text-neutral-400 block">Base</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            P{sender.base <= totalPackets ? sender.base : `${totalPackets} (Done)`}
          </span>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[9px] uppercase text-neutral-400 block">Next Seq</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            P{sender.nextSeqNum <= totalPackets ? sender.nextSeqNum : '—'}
          </span>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[9px] uppercase text-neutral-400 block">Window (W)</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {protocol === 'stop-and-wait' ? 1 : sender.windowSize}
          </span>
        </div>
      </div>

      {/* Sliding Window Frame Slots */}
      <div>
        <div className="flex justify-between items-center mb-1 text-[11px] text-neutral-500">
          <span>Window: [P{sender.base} .. P{windowEnd}]</span>
          <span>{sender.base <= totalPackets ? `${windowEnd - sender.base + 1} frames` : 'Complete'}</span>
        </div>
        <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {packets.map((pkt) => {
              const inWindow = pkt.seqNum >= sender.base && pkt.seqNum <= windowEnd;
              const isBase = pkt.seqNum === sender.base;
              const hasTimer = sender.activeTimers[pkt.seqNum] !== undefined;

              return (
                <div
                  key={pkt.id}
                  className={`relative flex flex-col items-center justify-center w-10 h-12 border text-xs font-bold transition-colors ${
                    pkt.ackReceived
                      ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-400'
                      : inWindow
                      ? isBase
                        ? 'border-black dark:border-white bg-lime-400 text-black'
                        : 'border-black dark:border-white bg-white dark:bg-black text-neutral-900 dark:text-neutral-100'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 bg-transparent'
                  }`}
                >
                  <span>P{pkt.seqNum}</span>
                  <span className="text-[8px] uppercase mt-0.5">
                    {pkt.ackReceived ? 'ACK' : inWindow ? (hasTimer ? 'WAIT' : 'READY') : 'Q'}
                  </span>
                  {hasTimer && (
                    <span className="absolute -top-1.5 -right-1 px-1 bg-black text-white dark:bg-white dark:text-black text-[8px] font-bold">
                      {sender.activeTimers[pkt.seqNum]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
