import React, { useState, useEffect } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { Navbar } from './components/Navbar';
import { ProtocolSelector } from './components/ProtocolSelector';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { ControlsBar } from './components/ControlsBar';
import { NetworkVisualization } from './components/NetworkVisualization';
import { DynamicExplanationPanel } from './components/DynamicExplanationPanel';
import { SenderPanel } from './components/SenderPanel';
import { ReceiverPanel } from './components/ReceiverPanel';
import { StatisticsPanel } from './components/StatisticsPanel';
import { EventLog } from './components/EventLog';
import { ComparisonModal } from './components/ComparisonModal';

export function App() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  const {
    state,
    config,
    speed,
    setSpeed,
    start,
    pause,
    resume,
    step,
    reset,
    setProtocol,
    updateConfig,
    loadScenario,
    clearEvents,
  } = useSimulation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* 1. Header: ARQ SIMULATOR | Compare, Reset, Theme */}
      <Navbar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onReset={reset}
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      {/* Main Simulator Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* 2. Protocol Selection */}
        <ProtocolSelector
          currentProtocol={state.protocol}
          onSelect={setProtocol}
          disabled={state.isRunning && !state.isPaused}
        />

        {/* 3. Configuration (Two Columns: Current Configuration | Preset Scenarios) */}
        <ConfigurationPanel
          config={config}
          onApplyConfig={updateConfig}
          onSelectScenario={loadScenario}
          isRunning={state.isRunning && !state.isPaused}
        />

        {/* 4. Simulation Controls (Positioned directly above Network Simulation) */}
        <ControlsBar
          isRunning={state.isRunning}
          isPaused={state.isPaused}
          isCompleted={state.isCompleted}
          speed={speed}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onStep={step}
          onReset={reset}
          onChangeSpeed={setSpeed}
          currentStep={state.currentStep}
        />

        {/* 5. Network Visualization (Main Visual) */}
        <NetworkVisualization
          inFlight={state.inFlight}
          protocol={state.protocol}
          isRunning={state.isRunning}
          isPaused={state.isPaused}
          packetLossProb={config.packetLossProb}
          ackLossProb={config.ackLossProb}
        />

        {/* 6. Current Event Live Status */}
        <DynamicExplanationPanel
          currentExplanation={state.currentExplanation}
        />

        {/* 7. Sender & Receiver Stations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SenderPanel
            sender={state.sender}
            packets={state.packets}
            protocol={state.protocol}
            totalPackets={config.totalPackets}
          />
          <ReceiverPanel
            receiver={state.receiver}
            packets={state.packets}
            protocol={state.protocol}
            totalPackets={config.totalPackets}
          />
        </div>

        {/* 8. Event Log & Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-6">
          <div className="lg:col-span-7">
            <EventLog
              events={state.events}
              onClear={clearEvents}
            />
          </div>
          <div className="lg:col-span-5">
            <StatisticsPanel
              stats={state.stats}
            />
          </div>
        </div>
      </main>

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </div>
  );
}

export default App;
