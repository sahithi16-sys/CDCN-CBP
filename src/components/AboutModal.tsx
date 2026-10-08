import React from 'react';
import { Info, X, Radio, CheckCircle, Code, Award, BookCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Project Documentation & Specifications
              </h2>
              <p className="text-xs text-slate-400">
                Reliable Data Transfer — ARQ Protocol Simulator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-300 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">
                Course:
              </span>
              <span className="font-bold text-slate-100 text-sm">
                Computer Networks
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">
                Project Topic:
              </span>
              <span className="font-bold text-cyan-400 text-sm">
                Topic 1 — Reliable Data Transfer / ARQ
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">
                Architecture:
              </span>
              <span className="text-slate-200">
                Client-Side React 19 + TypeScript
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">
                Visualization:
              </span>
              <span className="text-slate-200">
                Framer Motion + Recharts + Tailwind
              </span>
            </div>
          </div>

          {/* Protocols Implemented */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Simulated Protocols:</span>
            </h4>
            <div className="space-y-1.5 pl-2">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <div>
                  <strong className="text-slate-200">Stop-and-Wait ARQ:</strong> Strict 1-frame window. Sender waits for ACK before dispatching next frame. Retransmits on timeout.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <div>
                  <strong className="text-slate-200">Go-Back-N ARQ:</strong> Sliding window up to size W. Cumulative ACKs. Receiver rejects out-of-order frames. On timeout, retransmits entire window.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <div>
                  <strong className="text-slate-200">Selective Repeat ARQ:</strong> Individual ACKs. Receiver buffers out-of-order frames. On timeout, retransmits only the failed packet.
                </div>
              </div>
            </div>
          </div>

          {/* Core Academic Concepts */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
              <BookCheck className="w-4 h-4 text-emerald-400" />
              <span>Core Academic Concepts Demonstrated:</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {[
                'Error Control',
                'Flow Control',
                'Sliding Window',
                'Cumulative ACK',
                'Selective ACK',
                'Timeout Detection',
                'Retransmission',
                'Channel In-Flight Animation',
                'Receiver Buffering',
                'Out-of-Order Discarding',
                'Performance Benchmarking',
              ].map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Academic Statement */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-slate-300 leading-relaxed">
            <strong className="text-cyan-300 block mb-1">Academic Purpose:</strong>
            This educational simulator was created for the Computer Networks laboratory evaluation and project demonstration. It visually translates abstract transport and data-link state transitions into understandable animated events.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
