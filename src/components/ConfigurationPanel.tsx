import React, { useState, useEffect } from 'react';
import {
  SimulationConfig,
  PacketSize,
  ErrorInjectionType,
  DemoScenario,
  ProtocolType,
} from '../types/simulation';

interface PresetOption {
  id: string;
  name: string;
  protocol: ProtocolType;
  packets: number;
  windowSize: number;
  packetLossProb: number;
  ackLossProb: number;
  packetSize: PacketSize;
  timeoutDuration: number;
  manualErrors: Record<number, ErrorInjectionType>;
  descriptionLines: string[];
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'normal',
    name: 'Normal Transmission',
    protocol: 'stop-and-wait',
    packets: 5,
    windowSize: 1,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    manualErrors: {},
    descriptionLines: [
      'Packets are transmitted successfully.',
      'ACKs are received normally.',
      'No retransmission is required.',
    ],
  },
  {
    id: 'packet-loss',
    name: 'Packet Loss',
    protocol: 'stop-and-wait',
    packets: 5,
    windowSize: 1,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    manualErrors: { 3: 'packet_loss' },
    descriptionLines: [
      'Packets are transmitted normally.',
      'Packet 3 is lost in the channel.',
      'The sender detects loss through timeout.',
      'The lost packet is retransmitted.',
    ],
  },
  {
    id: 'ack-loss',
    name: 'ACK Loss',
    protocol: 'stop-and-wait',
    packets: 5,
    windowSize: 1,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    manualErrors: { 2: 'ack_loss' },
    descriptionLines: [
      'Data reaches the receiver.',
      'The ACK is lost on the return path.',
      'The sender waits until timeout.',
      'The packet is retransmitted.',
    ],
  },
  {
    id: 'high-loss',
    name: 'High Error Rate',
    protocol: 'go-back-n',
    packets: 10,
    windowSize: 4,
    packetLossProb: 0.4,
    ackLossProb: 0.2,
    packetSize: 'Medium',
    timeoutDuration: 8,
    manualErrors: {},
    descriptionLines: [
      'Channel has high packet and ACK loss.',
      'Multiple timeouts occur during transfer.',
      'Retransmissions maintain reliable delivery.',
    ],
  },
  {
    id: 'gbn-retransmit',
    name: 'Go-Back-N Retransmission',
    protocol: 'go-back-n',
    packets: 6,
    windowSize: 3,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    manualErrors: { 2: 'packet_loss' },
    descriptionLines: [
      'Window of 3 packets is sent.',
      'Packet 2 is lost; Packet 3 is discarded.',
      'Timeout triggers at the sender.',
      'Entire unacknowledged window is retransmitted.',
    ],
  },
  {
    id: 'sr-retransmit',
    name: 'Selective Repeat Retransmission',
    protocol: 'selective-repeat',
    packets: 6,
    windowSize: 3,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    manualErrors: { 2: 'packet_loss' },
    descriptionLines: [
      'Window of 3 packets is sent.',
      'Packet 2 is lost; Packet 3 is buffered.',
      'Timeout triggers for Packet 2 only.',
      'Only Packet 2 is retransmitted.',
    ],
  },
];

interface ConfigurationPanelProps {
  config: SimulationConfig;
  onApplyConfig: (newConfig: Partial<SimulationConfig>) => void;
  onSelectScenario: (scenario: DemoScenario) => void;
  isRunning: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onApplyConfig,
  onSelectScenario,
  isRunning,
}) => {
  const isStopAndWait = config.protocol === 'stop-and-wait';

  // Left Column Local Inputs
  const [totalPackets, setTotalPackets] = useState<number>(config.totalPackets);
  const [windowSize, setWindowSize] = useState<number>(config.windowSize);
  const [packetLossPercent, setPacketLossPercent] = useState<number>(Math.round(config.packetLossProb * 100));
  const [ackLossPercent, setAckLossPercent] = useState<number>(Math.round(config.ackLossProb * 100));
  const [packetSize, setPacketSize] = useState<PacketSize>(config.packetSize);
  const [timeoutDuration, setTimeoutDuration] = useState<number>(config.timeoutDuration);

  // Right Column Selected Preset
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('packet-loss');

  // Synchronize when config updates externally
  useEffect(() => {
    setTotalPackets(config.totalPackets);
    setWindowSize(config.windowSize);
    setPacketLossPercent(Math.round(config.packetLossProb * 100));
    setAckLossPercent(Math.round(config.ackLossProb * 100));
    setPacketSize(config.packetSize);
    setTimeoutDuration(config.timeoutDuration);
  }, [config]);

  const activePreset = PRESET_OPTIONS.find((p) => p.id === selectedScenarioId);

  // Apply custom configuration from left column
  const handleApplyConfig = () => {
    onApplyConfig({
      totalPackets,
      windowSize: isStopAndWait ? 1 : windowSize,
      packetLossProb: packetLossPercent / 100,
      ackLossProb: ackLossPercent / 100,
      packetSize,
      timeoutDuration,
    });
  };

  // Apply preset scenario from right column
  const handleApplyScenario = () => {
    if (!activePreset) return;

    // Immediately update left column input fields
    setTotalPackets(activePreset.packets);
    setWindowSize(activePreset.windowSize);
    setPacketLossPercent(Math.round(activePreset.packetLossProb * 100));
    setAckLossPercent(Math.round(activePreset.ackLossProb * 100));
    setPacketSize(activePreset.packetSize);
    setTimeoutDuration(activePreset.timeoutDuration);

    // Call onSelectScenario with standard DemoScenario shape
    const scenario: DemoScenario = {
      id: activePreset.id,
      title: activePreset.name,
      description: activePreset.descriptionLines.join(' '),
      protocol: activePreset.protocol,
      packets: activePreset.packets,
      windowSize: activePreset.windowSize,
      packetLossProb: activePreset.packetLossProb,
      ackLossProb: activePreset.ackLossProb,
      manualErrors: activePreset.manualErrors,
      highlights: activePreset.descriptionLines,
    };

    onSelectScenario(scenario);
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black font-mono text-xs">
      {/* Header */}
      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <span className="font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          CONFIGURATION
        </span>
        <span className="text-[11px] text-neutral-500 uppercase">
          Active Protocol: <strong className="text-neutral-900 dark:text-neutral-100">{config.protocol}</strong>
        </span>
      </div>

      {/* Two-Column Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
        {/* LEFT COLUMN: CURRENT CONFIGURATION */}
        <div className="space-y-3.5 md:pr-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="pb-1 border-b border-neutral-200 dark:border-neutral-800 font-bold uppercase text-neutral-900 dark:text-neutral-100 text-[11px]">
              CURRENT CONFIGURATION
            </div>

            <div className="space-y-2">
              {/* Packets */}
              <div className="flex items-center justify-between">
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold">
                  Packets:
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={totalPackets}
                  onChange={(e) => setTotalPackets(Math.max(1, Math.min(30, Number(e.target.value))))}
                  disabled={isRunning}
                  className="w-24 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-right text-xs text-neutral-900 dark:text-neutral-100 font-bold focus:outline-none"
                />
              </div>

              {/* Window Size */}
              <div className="flex items-center justify-between">
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold">
                  Window:
                  {isStopAndWait && (
                    <span className="text-[10px] text-neutral-400 ml-1.5 font-normal">
                      (Fixed to 1 for S&amp;W)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={isStopAndWait ? 1 : windowSize}
                  onChange={(e) => setWindowSize(Math.max(1, Math.min(8, Number(e.target.value))))}
                  disabled={isRunning || isStopAndWait}
                  className={`w-24 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-right text-xs text-neutral-900 dark:text-neutral-100 font-bold focus:outline-none ${
                    isStopAndWait ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Packet Loss */}
              <div className="flex items-center justify-between">
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold">
                  Packet Loss:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={packetLossPercent}
                    onChange={(e) => setPacketLossPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                    disabled={isRunning}
                    className="w-20 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-right text-xs text-neutral-900 dark:text-neutral-100 font-bold focus:outline-none"
                  />
                  <span className="text-neutral-500 font-bold">%</span>
                </div>
              </div>

              {/* ACK Loss */}
              <div className="flex items-center justify-between">
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold">
                  ACK Loss:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={ackLossPercent}
                    onChange={(e) => setAckLossPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                    disabled={isRunning}
                    className="w-20 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-right text-xs text-neutral-900 dark:text-neutral-100 font-bold focus:outline-none"
                  />
                  <span className="text-neutral-500 font-bold">%</span>
                </div>
              </div>

              {/* Packet Size */}
              <div className="flex items-center justify-between">
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold">
                  Packet Size:
                </label>
                <select
                  value={packetSize}
                  onChange={(e) => setPacketSize(e.target.value as PacketSize)}
                  disabled={isRunning}
                  className="w-36 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value="Small">Small (256 B)</option>
                  <option value="Medium">Medium (1 KB)</option>
                  <option value="Large">Large (4 KB)</option>
                </select>
              </div>

              {/* Timeout */}
              <div className="flex items-center justify-between">
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold">
                  Timeout:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={2}
                    max={24}
                    value={timeoutDuration}
                    onChange={(e) => setTimeoutDuration(Math.max(2, Math.min(24, Number(e.target.value))))}
                    disabled={isRunning}
                    className="w-20 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-right text-xs text-neutral-900 dark:text-neutral-100 font-bold focus:outline-none"
                  />
                  <span className="text-neutral-500 text-[11px]">ticks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApplyConfig}
              disabled={isRunning}
              className="w-full py-2 px-4 bg-lime-400 hover:bg-lime-300 text-black font-bold uppercase tracking-wider text-xs border border-black transition-colors disabled:opacity-40"
            >
              APPLY CONFIGURATION
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PRESET SCENARIOS */}
        <div className="space-y-3.5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="pb-1 border-b border-neutral-200 dark:border-neutral-800 font-bold uppercase text-neutral-900 dark:text-neutral-100 text-[11px]">
              PRESET SCENARIOS
            </div>

            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                Scenario:
              </label>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                disabled={isRunning}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none font-bold"
              >
                <option value="">Select a scenario</option>
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3-4 short lines description box */}
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 min-h-[96px] flex items-center">
              {activePreset ? (
                <div className="space-y-1 text-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed">
                  {activePreset.descriptionLines.map((line, idx) => (
                    <div key={idx}>• {line}</div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-400 text-[11px] italic">
                  Select a preset scenario above to view its configuration.
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={handleApplyScenario}
              disabled={!activePreset || isRunning}
              className="w-full py-2 px-4 bg-neutral-900 dark:bg-neutral-100 hover:opacity-90 text-white dark:text-black font-bold uppercase tracking-wider text-xs border border-neutral-900 dark:border-neutral-100 transition-opacity disabled:opacity-40"
            >
              APPLY SCENARIO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
