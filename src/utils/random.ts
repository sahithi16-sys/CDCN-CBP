import { ErrorInjectionType } from '../types/simulation';

export function shouldDropPacket(
  packetSeq: number,
  lossProbability: number,
  manualErrors: Record<number, ErrorInjectionType>
): boolean {
  // Check manual injection first
  const manual = manualErrors[packetSeq];
  if (manual === 'packet_loss') {
    return true;
  }
  if (manual === 'delay') {
    return false; // delayed, not dropped directly
  }

  // Random probability
  if (lossProbability <= 0) return false;
  return Math.random() < lossProbability;
}

export function shouldDropAck(
  packetSeq: number,
  ackLossProbability: number,
  manualErrors: Record<number, ErrorInjectionType>
): boolean {
  const manual = manualErrors[packetSeq];
  if (manual === 'ack_loss') {
    return true;
  }
  if (ackLossProbability <= 0) return false;
  return Math.random() < ackLossProbability;
}
