import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationState,
  SimulationConfig,
  ProtocolType,
  SimulationSpeed,
  ErrorInjectionType,
  DemoScenario,
} from '../types/simulation';
import { createInitialState, stepSimulation } from '../simulations/engine';

const DEFAULT_CONFIG: SimulationConfig = {
  protocol: 'stop-and-wait',
  totalPackets: 5,
  windowSize: 3,
  packetLossProb: 0.2, // 20%
  ackLossProb: 0.1, // 10%
  packetSize: 'Medium',
  timeoutDuration: 8,
  propagationSpeed: 1,
  randomErrors: true,
  manualErrors: {},
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'normal-sw',
    title: 'Scenario 1: Normal Transmission (Stop-and-Wait)',
    description: 'Perfect transmission with 0% loss. 5 packets transmitted sequentially with alternating ACKs.',
    protocol: 'stop-and-wait',
    packets: 5,
    windowSize: 1,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    manualErrors: {},
    highlights: ['1 frame at a time', 'Zero packet loss', 'Highest link idle time'],
  },
  {
    id: 'loss-p3',
    title: 'Scenario 2: Packet P3 Lost (Stop-and-Wait Timeout)',
    description: 'Packet 3 is intentionally dropped in the channel. Watch the sender timeout and retransmit P3.',
    protocol: 'stop-and-wait',
    packets: 5,
    windowSize: 1,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    manualErrors: { 3: 'packet_loss' },
    highlights: ['P3 lost in transit', 'Sender timeout timer expires', 'Automatic retransmission of P3'],
  },
  {
    id: 'loss-ack',
    title: 'Scenario 3: ACK Lost in Return Channel',
    description: 'Packet 2 arrives, but ACK 2 is lost on return path. Sender times out and retransmits duplicate P2.',
    protocol: 'stop-and-wait',
    packets: 5,
    windowSize: 1,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    manualErrors: { 2: 'ack_loss' },
    highlights: ['Data reaches receiver', 'ACK2 lost', 'Sender timeout & duplicate frame'],
  },
  {
    id: 'gbn-p2-lost',
    title: 'Scenario 4: Go-Back-N P2 Lost & Discard',
    description: 'Window=3. P2 is lost. Receiver discards out-of-order P3. Sender times out on P2 and retransmits BOTH P2 and P3!',
    protocol: 'go-back-n',
    packets: 6,
    windowSize: 3,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    manualErrors: { 2: 'packet_loss' },
    highlights: ['P2 lost', 'P3 discarded by receiver', 'Window retransmission of [P2, P3]'],
  },
  {
    id: 'sr-p2-lost',
    title: 'Scenario 5: Selective Repeat Buffering & P2 Retransmit',
    description: 'Window=3. P2 is lost. P3 is received and BUFFERED. Only P2 is retransmitted on timeout!',
    protocol: 'selective-repeat',
    packets: 6,
    windowSize: 3,
    packetLossProb: 0.0,
    ackLossProb: 0.0,
    manualErrors: { 2: 'packet_loss' },
    highlights: ['P2 lost', 'P3 buffered', 'Only P2 retransmitted', 'Buffer flushes on P2 arrival'],
  },
  {
    id: 'high-loss',
    title: 'Scenario 6: High Noise Stress Test (40% Loss)',
    description: '10 packets with 40% random packet loss and 20% ACK loss under window size 4.',
    protocol: 'go-back-n',
    packets: 10,
    windowSize: 4,
    packetLossProb: 0.4,
    ackLossProb: 0.2,
    manualErrors: {},
    highlights: ['Heavy channel noise', 'Multiple timeouts', 'Dynamic window adaptation'],
  },
];

export function useSimulation() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<SimulationState>(() => createInitialState(DEFAULT_CONFIG));
  const [speed, setSpeed] = useState<SimulationSpeed>(1);
  const timerRef = useRef<number | null>(null);

  // Speed tick durations in milliseconds
  const getTickDuration = (s: SimulationSpeed) => {
    switch (s) {
      case 0.5:
        return 1200;
      case 1:
        return 650;
      case 2:
        return 320;
      case 4:
        return 140;
    }
  };

  // Step action (advances 1 atomic networking event)
  const step = useCallback(() => {
    setState((prev) => {
      if (prev.isCompleted) return prev;
      return stepSimulation(prev);
    });
  }, []);

  // Timer loop for auto-play
  useEffect(() => {
    if (state.isRunning && !state.isPaused && !state.isCompleted) {
      timerRef.current = window.setInterval(() => {
        setState((prev) => {
          if (prev.isCompleted || !prev.isRunning || prev.isPaused) {
            return prev;
          }
          return stepSimulation(prev);
        });
      }, getTickDuration(speed));
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isRunning, state.isPaused, state.isCompleted, speed]);

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.isCompleted) return prev;
      return {
        ...prev,
        isRunning: true,
        isPaused: false,
      };
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
  }, []);

  const reset = useCallback(
    (customConfig?: Partial<SimulationConfig>) => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const updatedConfig = { ...config, ...customConfig };
      setConfig(updatedConfig);
      setState(createInitialState(updatedConfig));
    },
    [config]
  );

  const setProtocol = useCallback(
    (protocol: ProtocolType) => {
      const updatedConfig = {
        ...config,
        protocol,
        windowSize: protocol === 'stop-and-wait' ? 1 : Math.max(2, config.windowSize),
      };
      reset(updatedConfig);
    },
    [config, reset]
  );

  const updateConfig = useCallback(
    (partial: Partial<SimulationConfig>) => {
      const updated = { ...config, ...partial };
      if (updated.protocol === 'stop-and-wait') {
        updated.windowSize = 1;
      }
      reset(updated);
    },
    [config, reset]
  );

  const injectManualError = useCallback((packetSeq: number, error: ErrorInjectionType) => {
    setConfig((prev) => {
      const manualErrors = { ...prev.manualErrors };
      if (error === 'none') {
        delete manualErrors[packetSeq];
      } else {
        manualErrors[packetSeq] = error;
      }
      return { ...prev, manualErrors };
    });

    setState((prev) => {
      const packets = prev.packets.map((p) =>
        p.seqNum === packetSeq ? { ...p, errorInjected: error } : p
      );
      const manualErrors = { ...prev.config.manualErrors };
      if (error === 'none') {
        delete manualErrors[packetSeq];
      } else {
        manualErrors[packetSeq] = error;
      }
      return {
        ...prev,
        packets,
        config: { ...prev.config, manualErrors },
      };
    });
  }, []);

  const loadScenario = useCallback(
    (scenario: DemoScenario) => {
      const updatedConfig: SimulationConfig = {
        protocol: scenario.protocol,
        totalPackets: scenario.packets,
        windowSize: scenario.windowSize,
        packetLossProb: scenario.packetLossProb,
        ackLossProb: scenario.ackLossProb,
        packetSize: config.packetSize,
        timeoutDuration: config.timeoutDuration,
        propagationSpeed: speed,
        randomErrors: scenario.packetLossProb > 0,
        manualErrors: scenario.manualErrors || {},
      };
      reset(updatedConfig);
    },
    [config, speed, reset]
  );

  const clearEvents = useCallback(() => {
    setState((prev) => ({ ...prev, events: [] }));
  }, []);

  return {
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
    injectManualError,
    loadScenario,
    clearEvents,
  };
}
