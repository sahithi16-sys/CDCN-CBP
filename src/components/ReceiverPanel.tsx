import React from 'react';
import { ReceiverState, PacketInfo, ProtocolType } from '../types/simulation';
import { Check } from 'lucide-react';

interface ReceiverPanelProps {
  receiver: ReceiverState;
  packets: PacketInfo[];
  protocol: ProtocolType;
  totalPackets: number;
}

export const ReceiverPanel: React.FC<ReceiverPanelProps> = ({
  receiver,
  packets,
  protocol,
  totalPackets,
}) => {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-neutral-900 dark:bg-neutral-100"></span>
          <span className="font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
            RECEIVER (RX)
          </span>
        </div>
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
          {receiver.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="border border-neutral-200 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[9px] uppercase text-neutral-400 block">Expected</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            P{receiver.expectedSeqNum <= totalPackets ? receiver.expectedSeqNum : '—'}
          </span>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[9px] uppercase text-neutral-400 block">Last RX</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {receiver.lastReceivedSeqNum ? `P${receiver.lastReceivedSeqNum}` : 'None'}
          </span>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-950">
          <span className="text-[9px] uppercase text-neutral-400 block">Last ACK</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {receiver.lastAckSent ? `ACK${receiver.lastAckSent}` : 'None'}
          </span>
        </div>
      </div>

      {/* Frame Slots / Buffer */}
      <div>
        <div className="flex justify-between items-center mb-1 text-[11px] text-neutral-500">
          <span>{protocol === 'selective-repeat' ? 'Buffer / Delivery:' : 'Delivered Stream:'}</span>
          <span>{receiver.delivered.length} / {totalPackets} delivered</span>
        </div>
        <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {packets.map((pkt) => {
              const isDelivered = receiver.delivered.includes(pkt.seqNum);
              const isBuffered = !!receiver.buffer[pkt.seqNum];
              const isExpected = pkt.seqNum === receiver.expectedSeqNum;

              return (
                <div
                  key={pkt.id}
                  className={`flex flex-col items-center justify-center w-10 h-12 border text-xs font-bold transition-colors ${
                    isDelivered
                      ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-400'
                      : isBuffered
                      ? 'border-black dark:border-white bg-lime-400 text-black'
                      : isExpected
                      ? 'border-black dark:border-white text-neutral-900 dark:text-neutral-100 bg-white dark:bg-black'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 bg-transparent'
                  }`}
                >
                  <span>P{pkt.seqNum}</span>
                  <div className="mt-0.5">
                    {isDelivered ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : isBuffered ? (
                      <span className="text-[8px] uppercase">BUF</span>
                    ) : isExpected ? (
                      <span className="text-[8px] uppercase">EXP</span>
                    ) : (
                      <span className="text-[8px]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
