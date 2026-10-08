import { SimulationStats } from '../types/simulation';

export function calculateInitialStats(totalPackets: number): SimulationStats {
  return {
    totalPackets,
    deliveredPackets: 0,
    packetsLost: 0,
    acksSent: 0,
    acksLost: 0,
    retransmissions: 0,
    timeouts: 0,
    packetsDiscarded: 0,
    packetsBuffered: 0,
    totalAttempts: 0,
    efficiency: 100,
    retransmissionRate: 0,
    deliveryRate: 0,
    avgAttemptsPerPacket: 0,
    elapsedSteps: 0,
    elapsedSeconds: 0,
  };
}

export function updateDerivedMetrics(stats: SimulationStats): SimulationStats {
  const attempts = Math.max(1, stats.totalAttempts);
  const total = Math.max(1, stats.totalPackets);

  const efficiency = Number(((stats.deliveredPackets / attempts) * 100).toFixed(1));
  const retransmissionRate = Number(((stats.retransmissions / attempts) * 100).toFixed(1));
  const deliveryRate = Number(((stats.deliveredPackets / total) * 100).toFixed(1));
  const avgAttemptsPerPacket = Number((stats.totalAttempts / total).toFixed(2));

  return {
    ...stats,
    efficiency: Math.min(100, Math.max(0, efficiency)),
    retransmissionRate: Math.min(100, Math.max(0, retransmissionRate)),
    deliveryRate: Math.min(100, Math.max(0, deliveryRate)),
    avgAttemptsPerPacket,
  };
}

export function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const ms = date.getMilliseconds().toString().padStart(3, '0').slice(0, 2);
  return `${h}:${m}:${s}.${ms}`;
}

export const METRIC_TOOLTIPS = {
  efficiency: 'Efficiency = (Packets Successfully Delivered / Total Transmission Attempts) × 100%. Measures link utilization without overhead.',
  retransmissionRate: 'Retransmission Rate = (Retransmissions / Total Transmission Attempts) × 100%. Indicates channel reliability cost.',
  deliveryRate: 'Delivery Rate = (Packets Delivered / Total Packet Pool) × 100%. Progress towards completing the entire stream.',
  avgAttempts: 'Average Attempts = Total Transmissions / Total Packets. Value of 1.0 represents perfect zero-loss transmission.',
  slidingWindow: 'The range of sequence numbers permitted to be sent or received simultaneously without waiting for an immediate acknowledgement.',
  cumulativeAck: 'Cumulative ACK (used in Go-Back-N): ACK n confirms receipt of packet n and ALL preceding packets.',
  selectiveAck: 'Individual/Selective ACK (used in Selective Repeat): ACK n confirms receipt of packet n ONLY.',
  timeout: 'Countdown timer started when packet is dispatched. If unacknowledged when timer hits 0, retransmission triggers.',
};
