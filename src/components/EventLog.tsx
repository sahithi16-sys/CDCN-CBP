import React, { useState } from 'react';
import { SimulationEvent, EventType } from '../types/simulation';

interface EventLogProps {
  events: SimulationEvent[];
  onClear: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ events, onClear }) => {
  const [filter, setFilter] = useState<'ALL' | 'DATA' | 'ACK' | 'ERROR'>('ALL');

  const filteredEvents = events.filter((ev) => {
    if (filter === 'ALL') return true;
    if (filter === 'DATA') return ev.type === 'SEND' || ev.type === 'RECEIVE';
    if (filter === 'ACK') return ev.type === 'ACK_SEND' || ev.type === 'ACK_RECEIVE';
    if (filter === 'ERROR')
      return ev.type === 'PACKET_LOST' || ev.type === 'ACK_LOST' || ev.type === 'TIMEOUT' || ev.type === 'DISCARD';
    return true;
  });

  const getEventTag = (type: EventType): { tag: string; color: string } => {
    switch (type) {
      case 'SEND':
        return { tag: 'TX', color: 'text-neutral-900 dark:text-neutral-100' };
      case 'RECEIVE':
        return { tag: 'RX', color: 'text-lime-600 dark:text-lime-400' };
      case 'ACK_SEND':
      case 'ACK_RECEIVE':
        return { tag: 'ACK', color: 'text-lime-600 dark:text-lime-400' };
      case 'PACKET_LOST':
      case 'ACK_LOST':
        return { tag: 'LOST', color: 'text-red-600 dark:text-red-400' };
      case 'TIMEOUT':
        return { tag: 'TIMEOUT', color: 'text-amber-600 dark:text-amber-400' };
      case 'RETRANSMIT':
        return { tag: 'TX', color: 'text-amber-600 dark:text-amber-400' };
      case 'DISCARD':
        return { tag: 'DISCARD', color: 'text-red-600 dark:text-red-400' };
      case 'BUFFER':
        return { tag: 'BUFFER', color: 'text-lime-600 dark:text-lime-400' };
      default:
        return { tag: 'SYS', color: 'text-neutral-400' };
    }
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 flex flex-col h-72 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          EVENT LOG
        </span>
        <div className="flex items-center gap-2">
          <div className="flex border border-neutral-200 dark:border-neutral-800 text-[10px]">
            {(['ALL', 'DATA', 'ACK', 'ERROR'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 border-r last:border-r-0 border-neutral-200 dark:border-neutral-800 ${
                  filter === f ? 'bg-lime-400 text-black font-bold' : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={onClear}
            className="px-2 py-0.5 border border-neutral-300 dark:border-neutral-700 hover:border-red-500 hover:text-red-500 text-[10px] uppercase text-neutral-500"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 bg-neutral-50 dark:bg-neutral-950 p-2 border border-neutral-200 dark:border-neutral-800/80">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-400 text-xs italic">
            No events recorded. Start simulation to observe events.
          </div>
        ) : (
          filteredEvents.map((ev, index) => {
            const { tag, color } = getEventTag(ev.type);
            const lineNum = String(index + 1).padStart(2, '0');

            return (
              <div
                key={ev.id}
                className="flex items-center gap-3 py-0.5 text-[11px] hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <span className="text-neutral-400 select-none w-6">{lineNum}</span>
                <span className={`w-14 font-bold ${color}`}>{tag}</span>
                <span className="text-neutral-800 dark:text-neutral-200 flex-1 truncate">
                  {ev.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
