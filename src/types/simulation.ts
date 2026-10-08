export type ProtocolType = 'stop-and-wait' | 'go-back-n' | 'selective-repeat';

export type PacketStatus =
  | 'READY'
  | 'SENT'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'ACKED'
  | 'LOST'
  | 'TIMEOUT'
  | 'RETRANSMITTING'
  | 'BUFFERED'
  | 'DISCARDED'
  | 'COMPLETED';

export type PacketSize = 'Small' | 'Medium' | 'Large';

export type SimulationSpeed = 0.5 | 1 | 2 | 4;

export type ErrorInjectionType = 'none' | 'packet_loss' | 'ack_loss' | 'delay';

export interface PacketInfo {
  id: number;
  seqNum: number;
  status: PacketStatus;
  transmissions: number;
  attempts: number;
  ackReceived: boolean;
  isBuffered?: boolean;
  isDiscarded?: boolean;
  sendTime?: number;
  ackTime?: number;
  lastEvent?: string;
  errorInjected?: ErrorInjectionType;
}

export interface InFlightItem {
  id: string; // unique item id
  packetId: number;
  seqNum: number;
  type: 'DATA' | 'ACK';
  progress: number; // 0 to 100%
  status: 'flying' | 'lost' | 'delivered';
  isLost: boolean;
  createdAt: number;
  ackCumulative?: number; // for GBN cumulative ACK
  isDelayed?: boolean;
}

export type EventType =
  | 'SEND'
  | 'RECEIVE'
  | 'ACK_SEND'
  | 'ACK_RECEIVE'
  | 'PACKET_LOST'
  | 'ACK_LOST'
  | 'TIMEOUT'
  | 'RETRANSMIT'
  | 'BUFFER'
  | 'DISCARD'
  | 'WINDOW_SLIDE'
  | 'COMPLETE'
  | 'INFO';

export interface SimulationEvent {
  id: string;
  timestamp: string;
  stepIndex: number;
  type: EventType;
  packetId?: number;
  seqNum?: number;
  message: string;
  detail?: string;
  protocol: ProtocolType;
}

export interface SimulationConfig {
  protocol: ProtocolType;
  totalPackets: number;
  windowSize: number; // 1 for S&W, 2-5 for GBN and SR
  packetLossProb: number; // 0 to 0.5 (0% to 50%)
  ackLossProb: number; // 0 to 0.3 (0% to 30%)
  packetSize: PacketSize;
  timeoutDuration: number; // ticks or ms equivalent
  propagationSpeed: SimulationSpeed;
  randomErrors: boolean;
  manualErrors: Record<number, ErrorInjectionType>; // packetSeq -> error
}

export interface SimulationStats {
  totalPackets: number;
  deliveredPackets: number;
  packetsLost: number;
  acksSent: number;
  acksLost: number;
  retransmissions: number;
  timeouts: number;
  packetsDiscarded: number;
  packetsBuffered: number;
  totalAttempts: number;
  efficiency: number; // delivered / totalAttempts * 100
  retransmissionRate: number; // retransmissions / totalAttempts * 100
  deliveryRate: number; // delivered / totalPackets * 100
  avgAttemptsPerPacket: number;
  elapsedSteps: number;
  elapsedSeconds: number;
}

export interface SenderState {
  base: number;
  nextSeqNum: number;
  windowSize: number;
  status: 'WAITING' | 'TRANSMITTING' | 'WAITING_FOR_ACK' | 'TIMEOUT' | 'RETRANSMITTING' | 'COMPLETED';
  activeTimers: Record<number, number>; // packetSeq -> remaining ticks
}

export interface ReceiverState {
  expectedSeqNum: number;
  lastReceivedSeqNum: number | null;
  lastAckSent: number | null;
  buffer: Record<number, boolean>; // packetSeq -> boolean (for SR)
  delivered: number[];
  status: 'IDLE' | 'RECEIVING' | 'SENDING_ACK' | 'BUFFERING' | 'DISCARDING';
}

export interface SimulationState {
  protocol: ProtocolType;
  config: SimulationConfig;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  currentStep: number;
  packets: PacketInfo[];
  inFlight: InFlightItem[];
  sender: SenderState;
  receiver: ReceiverState;
  stats: SimulationStats;
  events: SimulationEvent[];
  currentExplanation: string;
}

export interface ComparisonResult {
  protocol: ProtocolType;
  name: string;
  totalPackets: number;
  windowSize: number;
  transmissions: number;
  retransmissions: number;
  timeouts: number;
  packetsLost: number;
  acksLost: number;
  efficiency: number;
  deliveryRate: number;
  stepsToComplete: number;
  discardedCount: number;
  bufferedCount: number;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  protocol: ProtocolType;
  packets: number;
  windowSize: number;
  packetLossProb: number;
  ackLossProb: number;
  manualErrors?: Record<number, ErrorInjectionType>;
  highlights: string[];
}
