import {
  SimulationState,
  SimulationConfig,
  PacketInfo,
  InFlightItem,
  SimulationEvent,
  ProtocolType,
} from '../types/simulation';
import { calculateInitialStats, updateDerivedMetrics, formatTimestamp } from '../utils/metrics';
import { shouldDropPacket, shouldDropAck } from '../utils/random';

const DEFAULT_TIMEOUT_TICKS = 8; // Number of simulation step ticks for timeout

export function createInitialState(config: SimulationConfig): SimulationState {
  const packets: PacketInfo[] = [];
  for (let i = 1; i <= config.totalPackets; i++) {
    packets.push({
      id: i,
      seqNum: i,
      status: 'READY',
      transmissions: 0,
      attempts: 0,
      ackReceived: false,
      isBuffered: false,
      isDiscarded: false,
      errorInjected: config.manualErrors[i] || 'none',
    });
  }

  const effectiveWindowSize = config.protocol === 'stop-and-wait' ? 1 : config.windowSize;

  return {
    protocol: config.protocol,
    config: {
      ...config,
      windowSize: effectiveWindowSize,
    },
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    currentStep: 0,
    packets,
    inFlight: [],
    sender: {
      base: 1,
      nextSeqNum: 1,
      windowSize: effectiveWindowSize,
      status: 'WAITING',
      activeTimers: {},
    },
    receiver: {
      expectedSeqNum: 1,
      lastReceivedSeqNum: null,
      lastAckSent: null,
      buffer: {},
      delivered: [],
      status: 'IDLE',
    },
    stats: calculateInitialStats(config.totalPackets),
    events: [
      {
        id: `ev-0-${Date.now()}`,
        timestamp: formatTimestamp(),
        stepIndex: 0,
        type: 'INFO',
        message: `Simulator initialized for ${getProtocolName(config.protocol)}. Ready to transmit ${config.totalPackets} packets.`,
        detail: `Window Size: ${effectiveWindowSize}, Packet Loss: ${(config.packetLossProb * 100).toFixed(0)}%, ACK Loss: ${(config.ackLossProb * 100).toFixed(0)}%`,
        protocol: config.protocol,
      },
    ],
    currentExplanation: getInitialExplanation(config.protocol, effectiveWindowSize),
  };
}

export function getProtocolName(protocol: ProtocolType): string {
  switch (protocol) {
    case 'stop-and-wait':
      return 'Stop-and-Wait ARQ';
    case 'go-back-n':
      return 'Go-Back-N ARQ';
    case 'selective-repeat':
      return 'Selective Repeat ARQ';
  }
}

function getInitialExplanation(protocol: ProtocolType, windowSize: number): string {
  switch (protocol) {
    case 'stop-and-wait':
      return 'Stop-and-Wait ARQ: Sender transmits 1 packet and waits for acknowledgement before sending the next. If lost or timeout, retransmits.';
    case 'go-back-n':
      return `Go-Back-N ARQ: Sender transmits up to ${windowSize} packets in a sliding window. Receiver accepts only in-order packets. On timeout of base, ALL unacknowledged packets in the window are retransmitted.`;
    case 'selective-repeat':
      return `Selective Repeat ARQ: Sender transmits up to ${windowSize} packets. Receiver individually acknowledges and buffers out-of-order packets. On timeout, ONLY the lost packet is retransmitted.`;
  }
}

/**
 * Execute one atomic step of the simulation.
 * This guarantees discrete event explainability and step-by-step examination.
 */
export function stepSimulation(state: SimulationState): SimulationState {
  if (state.isCompleted) return state;

  const currentStep = state.currentStep + 1;
  const newEvents: SimulationEvent[] = [];
  let explanation = state.currentExplanation;

  // Clone mutable structures
  const packets = state.packets.map((p) => ({ ...p }));
  let inFlight = state.inFlight.map((item) => ({ ...item }));
  const sender = {
    ...state.sender,
    activeTimers: { ...state.sender.activeTimers },
  };
  const receiver = {
    ...state.receiver,
    buffer: { ...state.receiver.buffer },
    delivered: [...state.receiver.delivered],
  };
  const stats = { ...state.stats, elapsedSteps: currentStep };

  // =========================================================================
  // PRIORITY 1: Advance any flying items in the channel
  // =========================================================================
  const flyingItem = inFlight.find((item) => item.status === 'flying');

  if (flyingItem) {
    // If packet/ack is mid-flight, advance it towards destination
    if (flyingItem.progress < 100) {
      flyingItem.progress = Math.min(100, flyingItem.progress + 50); // 2 steps across channel for crisp step-by-step

      if (flyingItem.progress < 100) {
        // Still flying
        return {
          ...state,
          currentStep,
          inFlight,
          currentExplanation: `${flyingItem.type} P${flyingItem.seqNum} is in-transit across the channel (${flyingItem.progress}%)...`,
        };
      }
    }

    // Now flyingItem has reached 100% (arrived at destination)
    if (flyingItem.type === 'DATA') {
      const pIndex = packets.findIndex((p) => p.seqNum === flyingItem.seqNum);
      const packet = pIndex !== -1 ? packets[pIndex] : null;

      if (flyingItem.isLost) {
        // DATA PACKET LOST IN CHANNEL
        flyingItem.status = 'lost';
        stats.packetsLost++;
        if (packet) packet.status = 'LOST';
        if (state.config.manualErrors[flyingItem.seqNum] === 'packet_loss') {
          delete state.config.manualErrors[flyingItem.seqNum];
        }

        const ev: SimulationEvent = {
          id: `ev-${currentStep}-${Date.now()}`,
          timestamp: formatTimestamp(),
          stepIndex: currentStep,
          type: 'PACKET_LOST',
          seqNum: flyingItem.seqNum,
          message: `Packet P${flyingItem.seqNum} LOST in transmission channel!`,
          detail: `The packet did not reach the receiver due to channel noise/error injection. Sender will wait for timeout.`,
          protocol: state.protocol,
        };
        newEvents.push(ev);
        explanation = `Packet P${flyingItem.seqNum} was LOST in the channel! Receiver is unaware, and sender timer will eventually expire.`;
      } else {
        // DATA PACKET REACHED RECEIVER
        flyingItem.status = 'delivered';

        if (state.protocol === 'stop-and-wait') {
          // STOP-AND-WAIT RECEIVER LOGIC
          if (packet) packet.status = 'RECEIVED';
          receiver.lastReceivedSeqNum = flyingItem.seqNum;
          receiver.delivered.push(flyingItem.seqNum);
          stats.deliveredPackets++;

          const ev: SimulationEvent = {
            id: `ev-${currentStep}-${Date.now()}`,
            timestamp: formatTimestamp(),
            stepIndex: currentStep,
            type: 'RECEIVE',
            seqNum: flyingItem.seqNum,
            message: `Receiver accepted packet P${flyingItem.seqNum}.`,
            detail: `Packet verified. Preparing ACK${flyingItem.seqNum} back to sender.`,
            protocol: state.protocol,
          };
          newEvents.push(ev);

          // Dispatch ACK
          const ackLost = shouldDropAck(flyingItem.seqNum, state.config.ackLossProb, state.config.manualErrors);
          const ackItem: InFlightItem = {
            id: `ack-${flyingItem.seqNum}-${Date.now()}`,
            packetId: flyingItem.packetId,
            seqNum: flyingItem.seqNum,
            type: 'ACK',
            progress: 0,
            status: 'flying',
            isLost: ackLost,
            createdAt: Date.now(),
          };
          inFlight.push(ackItem);
          stats.acksSent++;
          receiver.lastAckSent = flyingItem.seqNum;

          const ackEv: SimulationEvent = {
            id: `ev-ack-${currentStep}-${Date.now()}`,
            timestamp: formatTimestamp(),
            stepIndex: currentStep,
            type: 'ACK_SEND',
            seqNum: flyingItem.seqNum,
            message: `Receiver sent ACK${flyingItem.seqNum} → Sender.`,
            detail: ackLost ? `(Will be lost in return channel)` : `(Returning successfully)`,
            protocol: state.protocol,
          };
          newEvents.push(ackEv);
          explanation = `Receiver successfully received P${flyingItem.seqNum} and dispatched ACK${flyingItem.seqNum}.`;
        } else if (state.protocol === 'go-back-n') {
          // GO-BACK-N RECEIVER LOGIC
          if (flyingItem.seqNum === receiver.expectedSeqNum) {
            // IN-ORDER PACKET ACCEPTED!
            if (packet) {
              packet.status = 'RECEIVED';
              packet.isDiscarded = false;
            }
            receiver.lastReceivedSeqNum = flyingItem.seqNum;
            receiver.delivered.push(flyingItem.seqNum);
            receiver.expectedSeqNum = flyingItem.seqNum + 1;
            stats.deliveredPackets++;

            const ev: SimulationEvent = {
              id: `ev-${currentStep}-${Date.now()}`,
              timestamp: formatTimestamp(),
              stepIndex: currentStep,
              type: 'RECEIVE',
              seqNum: flyingItem.seqNum,
              message: `Go-Back-N Receiver accepted in-order packet P${flyingItem.seqNum}.`,
              detail: `Next expected sequence number updated to P${receiver.expectedSeqNum}. Cumulative ACK${flyingItem.seqNum} generated.`,
              protocol: state.protocol,
            };
            newEvents.push(ev);

            // Send cumulative ACK
            const ackLost = shouldDropAck(flyingItem.seqNum, state.config.ackLossProb, state.config.manualErrors);
            const ackItem: InFlightItem = {
              id: `ack-${flyingItem.seqNum}-${Date.now()}`,
              packetId: flyingItem.packetId,
              seqNum: flyingItem.seqNum,
              type: 'ACK',
              progress: 0,
              status: 'flying',
              isLost: ackLost,
              createdAt: Date.now(),
              ackCumulative: flyingItem.seqNum,
            };
            inFlight.push(ackItem);
            stats.acksSent++;
            receiver.lastAckSent = flyingItem.seqNum;

            const ackEv: SimulationEvent = {
              id: `ev-ack-${currentStep}-${Date.now()}`,
              timestamp: formatTimestamp(),
              stepIndex: currentStep,
              type: 'ACK_SEND',
              seqNum: flyingItem.seqNum,
              message: `Receiver sent cumulative ACK${flyingItem.seqNum} → Sender.`,
              detail: `Acknowledges all packets up to P${flyingItem.seqNum}.`,
              protocol: state.protocol,
            };
            newEvents.push(ackEv);
            explanation = `Go-Back-N: Received in-order packet P${flyingItem.seqNum}. Expected is now P${receiver.expectedSeqNum}. Cumulative ACK${flyingItem.seqNum} sent.`;
          } else {
            // OUT-OF-ORDER PACKET IN GO-BACK-N -> DISCARD!
            if (packet) {
              packet.status = 'DISCARDED';
              packet.isDiscarded = true;
            }
            stats.packetsDiscarded++;

            const ev: SimulationEvent = {
              id: `ev-${currentStep}-${Date.now()}`,
              timestamp: formatTimestamp(),
              stepIndex: currentStep,
              type: 'DISCARD',
              seqNum: flyingItem.seqNum,
              message: `OUT-OF-ORDER! Packet P${flyingItem.seqNum} DISCARDED by Go-Back-N receiver!`,
              detail: `Receiver is expecting P${receiver.expectedSeqNum}. Go-Back-N receiver has NO buffer for out-of-order packets.`,
              protocol: state.protocol,
            };
            newEvents.push(ev);

            // Resend cumulative ACK for the last in-order received packet if any
            if (receiver.lastReceivedSeqNum !== null) {
              const ackItem: InFlightItem = {
                id: `dup-ack-${receiver.lastReceivedSeqNum}-${Date.now()}`,
                packetId: receiver.lastReceivedSeqNum,
                seqNum: receiver.lastReceivedSeqNum,
                type: 'ACK',
                progress: 0,
                status: 'flying',
                isLost: false,
                createdAt: Date.now(),
                ackCumulative: receiver.lastReceivedSeqNum,
              };
              inFlight.push(ackItem);
              stats.acksSent++;
            }

            explanation = `Go-Back-N Discard: P${flyingItem.seqNum} arrived out-of-order (expected P${receiver.expectedSeqNum}). It was discarded! Sender will timeout and retransmit window.`;
          }
        } else if (state.protocol === 'selective-repeat') {
          // SELECTIVE REPEAT RECEIVER LOGIC
          const recvBase = receiver.expectedSeqNum;
          const recvWindowEnd = recvBase + state.config.windowSize - 1;

          if (flyingItem.seqNum >= recvBase && flyingItem.seqNum <= recvWindowEnd) {
            // Send individual ACK for this packet regardless
            const ackLost = shouldDropAck(flyingItem.seqNum, state.config.ackLossProb, state.config.manualErrors);
            const ackItem: InFlightItem = {
              id: `ack-${flyingItem.seqNum}-${Date.now()}`,
              packetId: flyingItem.packetId,
              seqNum: flyingItem.seqNum,
              type: 'ACK',
              progress: 0,
              status: 'flying',
              isLost: ackLost,
              createdAt: Date.now(),
            };
            inFlight.push(ackItem);
            stats.acksSent++;
            receiver.lastAckSent = flyingItem.seqNum;

            if (flyingItem.seqNum === recvBase) {
              // Expected packet arrived!
              if (packet) packet.status = 'RECEIVED';
              receiver.delivered.push(flyingItem.seqNum);
              stats.deliveredPackets++;

              // Check consecutive buffered packets to slide receiver window
              let nextExpected = recvBase + 1;
              const freedPackets: number[] = [flyingItem.seqNum];

              while (receiver.buffer[nextExpected]) {
                delete receiver.buffer[nextExpected];
                receiver.delivered.push(nextExpected);
                stats.deliveredPackets++;
                freedPackets.push(nextExpected);
                const bufP = packets.find((p) => p.seqNum === nextExpected);
                if (bufP) {
                  bufP.status = 'RECEIVED';
                  bufP.isBuffered = false;
                }
                nextExpected++;
              }

              receiver.expectedSeqNum = nextExpected;

              const ev: SimulationEvent = {
                id: `ev-${currentStep}-${Date.now()}`,
                timestamp: formatTimestamp(),
                stepIndex: currentStep,
                type: 'RECEIVE',
                seqNum: flyingItem.seqNum,
                message: `Receiver accepted P${flyingItem.seqNum} and released buffered packets [${freedPackets.join(', ')}].`,
                detail: `Receiver base advanced to P${nextExpected}. Sent individual ACK${flyingItem.seqNum}.`,
                protocol: state.protocol,
              };
              newEvents.push(ev);
              explanation = `Selective Repeat: Missing packet P${flyingItem.seqNum} arrived! Delivered packets ${freedPackets.map((n) => `P${n}`).join(', ')} to application layer.`;
            } else {
              // Out-of-order but within receiver window -> BUFFER IT!
              receiver.buffer[flyingItem.seqNum] = true;
              stats.packetsBuffered++;
              if (packet) {
                packet.status = 'BUFFERED';
                packet.isBuffered = true;
              }

              const ev: SimulationEvent = {
                id: `ev-${currentStep}-${Date.now()}`,
                timestamp: formatTimestamp(),
                stepIndex: currentStep,
                type: 'BUFFER',
                seqNum: flyingItem.seqNum,
                message: `P${flyingItem.seqNum} arrived out-of-order → BUFFERED in Receiver Buffer!`,
                detail: `P${recvBase} is missing. Sent ACK${flyingItem.seqNum}. Will deliver P${flyingItem.seqNum} once P${recvBase} arrives.`,
                protocol: state.protocol,
              };
              newEvents.push(ev);
              explanation = `Selective Repeat: Out-of-order P${flyingItem.seqNum} buffered! Sent ACK${flyingItem.seqNum}. Waiting for missing P${recvBase}.`;
            }
          } else {
            // Already received / below window: re-send ACK so sender can clear
            const ackItem: InFlightItem = {
              id: `ack-dup-${flyingItem.seqNum}-${Date.now()}`,
              packetId: flyingItem.packetId,
              seqNum: flyingItem.seqNum,
              type: 'ACK',
              progress: 0,
              status: 'flying',
              isLost: false,
              createdAt: Date.now(),
            };
            inFlight.push(ackItem);
            stats.acksSent++;
          }
        }
      }
    } else if (flyingItem.type === 'ACK') {
      // ACK ARRIVED AT SENDER
      if (flyingItem.isLost) {
        flyingItem.status = 'lost';
        stats.acksLost++;
        if (state.config.manualErrors[flyingItem.seqNum] === 'ack_loss') {
          delete state.config.manualErrors[flyingItem.seqNum];
        }

        const ev: SimulationEvent = {
          id: `ev-ack-lost-${currentStep}-${Date.now()}`,
          timestamp: formatTimestamp(),
          stepIndex: currentStep,
          type: 'ACK_LOST',
          seqNum: flyingItem.seqNum,
          message: `ACK${flyingItem.seqNum} was LOST in the channel!`,
          detail: `Sender does not know the receiver received P${flyingItem.seqNum}. Sender timeout will trigger retransmission.`,
          protocol: state.protocol,
        };
        newEvents.push(ev);
        explanation = `ACK${flyingItem.seqNum} was lost on the return path! The sender will timeout and retransmit.`;
      } else {
        flyingItem.status = 'delivered';

        if (state.protocol === 'stop-and-wait') {
          // Stop-and-wait ACK received
          const packet = packets.find((p) => p.seqNum === flyingItem.seqNum);
          if (packet) {
            packet.status = 'ACKED';
            packet.ackReceived = true;
          }
          delete sender.activeTimers[flyingItem.seqNum];
          sender.base = flyingItem.seqNum + 1;
          sender.nextSeqNum = sender.base;
          sender.status = sender.base > state.config.totalPackets ? 'COMPLETED' : 'WAITING';

          const ev: SimulationEvent = {
            id: `ev-ack-recv-${currentStep}-${Date.now()}`,
            timestamp: formatTimestamp(),
            stepIndex: currentStep,
            type: 'ACK_RECEIVE',
            seqNum: flyingItem.seqNum,
            message: `Sender received ACK${flyingItem.seqNum}. Base advanced to P${sender.base}.`,
            detail: `Packet P${flyingItem.seqNum} completed. Ready to send next packet.`,
            protocol: state.protocol,
          };
          newEvents.push(ev);
          explanation = `Sender received ACK${flyingItem.seqNum}. Window advanced to P${sender.base}.`;
        } else if (state.protocol === 'go-back-n') {
          // Go-Back-N cumulative ACK received
          const ackSeq = flyingItem.ackCumulative ?? flyingItem.seqNum;

          if (ackSeq >= sender.base) {
            for (let i = sender.base; i <= ackSeq; i++) {
              const p = packets.find((pk) => pk.seqNum === i);
              if (p) {
                p.status = 'ACKED';
                p.ackReceived = true;
              }
              delete sender.activeTimers[i];
            }

            const oldBase = sender.base;
            sender.base = ackSeq + 1;
            sender.status = sender.base > state.config.totalPackets ? 'COMPLETED' : 'WAITING';

            // Restart timer for remaining in-flight packets if any
            if (sender.base < sender.nextSeqNum) {
              sender.activeTimers[sender.base] = DEFAULT_TIMEOUT_TICKS;
            }

            const ev: SimulationEvent = {
              id: `ev-ack-recv-${currentStep}-${Date.now()}`,
              timestamp: formatTimestamp(),
              stepIndex: currentStep,
              type: 'ACK_RECEIVE',
              seqNum: ackSeq,
              message: `Cumulative ACK${ackSeq} received! Sender sliding window moved from [${oldBase}] to [${sender.base}].`,
              detail: `All packets up to P${ackSeq} are confirmed. New window is [P${sender.base}..P${Math.min(sender.base + sender.windowSize - 1, state.config.totalPackets)}].`,
              protocol: state.protocol,
            };
            newEvents.push(ev);
            explanation = `Cumulative ACK${ackSeq} received. Sender sliding window advanced to base P${sender.base}.`;
          }
        } else if (state.protocol === 'selective-repeat') {
          // Selective Repeat individual ACK received
          const packet = packets.find((p) => p.seqNum === flyingItem.seqNum);
          if (packet) {
            packet.status = 'ACKED';
            packet.ackReceived = true;
          }
          delete sender.activeTimers[flyingItem.seqNum];

          // Advance sender base past all consecutively acknowledged packets
          const oldBase = sender.base;
          let newBase = sender.base;
          while (newBase <= state.config.totalPackets) {
            const p = packets.find((pk) => pk.seqNum === newBase);
            if (p && p.ackReceived) {
              newBase++;
            } else {
              break;
            }
          }
          sender.base = newBase;
          sender.status = sender.base > state.config.totalPackets ? 'COMPLETED' : 'WAITING';

          const ev: SimulationEvent = {
            id: `ev-ack-recv-${currentStep}-${Date.now()}`,
            timestamp: formatTimestamp(),
            stepIndex: currentStep,
            type: 'ACK_RECEIVE',
            seqNum: flyingItem.seqNum,
            message: `Sender received individual ACK${flyingItem.seqNum}.`,
            detail:
              newBase > oldBase
                ? `Sender window base slid from P${oldBase} to P${newBase}!`
                : `Packet P${flyingItem.seqNum} marked ACKED. Base remains at P${sender.base}.`,
            protocol: state.protocol,
          };
          newEvents.push(ev);
          explanation = `Selective Repeat: Individual ACK${flyingItem.seqNum} confirmed. Window base is P${sender.base}.`;
        }
      }
    }

    // Clean up finished flying items that are no longer active
    inFlight = inFlight.filter((item) => item.status === 'flying');

    // Check completion after ACK processing
    const isCompleted = sender.base > state.config.totalPackets;
    if (isCompleted) {
      newEvents.push({
        id: `ev-comp-${currentStep}-${Date.now()}`,
        timestamp: formatTimestamp(),
        stepIndex: currentStep,
        type: 'COMPLETE',
        message: `Transmission Completed Successfully! All ${state.config.totalPackets} packets acknowledged.`,
        detail: `Efficiency: ${stats.efficiency}%, Retransmissions: ${stats.retransmissions}, Total Attempts: ${stats.totalAttempts}.`,
        protocol: state.protocol,
      });
      explanation = `All ${state.config.totalPackets} packets successfully transferred and acknowledged! Mission accomplished.`;
    }

    return {
      ...state,
      currentStep,
      inFlight,
      packets,
      sender,
      receiver,
      stats: updateDerivedMetrics(stats),
      events: [...newEvents, ...state.events].slice(0, 150),
      currentExplanation: explanation,
      isCompleted,
      isRunning: isCompleted ? false : state.isRunning,
    };
  }

  // =========================================================================
  // PRIORITY 2: Check for Timeouts and decrement active timers
  // =========================================================================
  let timedOutPacketSeq: number | null = null;
  for (const seqStr of Object.keys(sender.activeTimers)) {
    const seq = Number(seqStr);
    sender.activeTimers[seq] -= 1;
    if (sender.activeTimers[seq] <= 0 && timedOutPacketSeq === null) {
      timedOutPacketSeq = seq;
    }
  }

  if (timedOutPacketSeq !== null) {
    // TIMEOUT OCCURRED!
    stats.timeouts++;
    sender.status = 'TIMEOUT';

    if (state.protocol === 'stop-and-wait') {
      const p = packets.find((pk) => pk.seqNum === timedOutPacketSeq);
      if (p) {
        p.status = 'TIMEOUT';
        p.attempts++;
        p.transmissions++;
        stats.totalAttempts++;
        stats.retransmissions++;
      }

      const isLost = shouldDropPacket(timedOutPacketSeq, state.config.packetLossProb, state.config.manualErrors);
      inFlight.push({
        id: `retransmit-${timedOutPacketSeq}-${Date.now()}`,
        packetId: timedOutPacketSeq,
        seqNum: timedOutPacketSeq,
        type: 'DATA',
        progress: 0,
        status: 'flying',
        isLost,
        createdAt: Date.now(),
      });

      sender.activeTimers[timedOutPacketSeq] = DEFAULT_TIMEOUT_TICKS;
      sender.status = 'RETRANSMITTING';

      const ev: SimulationEvent = {
        id: `ev-timeout-${currentStep}-${Date.now()}`,
        timestamp: formatTimestamp(),
        stepIndex: currentStep,
        type: 'TIMEOUT',
        seqNum: timedOutPacketSeq,
        message: `TIMEOUT for P${timedOutPacketSeq}! Retransmitting packet P${timedOutPacketSeq}...`,
        detail: `No ACK received before timer expired. Retransmission attempt #${p ? p.attempts : 1}.`,
        protocol: state.protocol,
      };
      newEvents.push(ev);
      explanation = `Timeout expired for P${timedOutPacketSeq}! Stop-and-Wait retransmits P${timedOutPacketSeq}.`;
    } else if (state.protocol === 'go-back-n') {
      // GO-BACK-N TIMEOUT ON BASE: RETRANSMIT BASE AND ALL SUBSEQUENT SENT PACKETS IN WINDOW!
      const baseSeq = sender.base;
      const packetsToRetransmit: number[] = [];

      for (let s = baseSeq; s < sender.nextSeqNum; s++) {
        packetsToRetransmit.push(s);
        const p = packets.find((pk) => pk.seqNum === s);
        if (p) {
          p.status = 'RETRANSMITTING';
          p.attempts++;
          p.transmissions++;
          stats.totalAttempts++;
          stats.retransmissions++;
        }

        const isLost = shouldDropPacket(s, state.config.packetLossProb, state.config.manualErrors);
        inFlight.push({
          id: `gbn-retransmit-${s}-${Date.now()}`,
          packetId: s,
          seqNum: s,
          type: 'DATA',
          progress: 0,
          status: 'flying',
          isLost,
          createdAt: Date.now(),
        });
      }

      // Reset base timer
      sender.activeTimers[baseSeq] = DEFAULT_TIMEOUT_TICKS;
      sender.status = 'RETRANSMITTING';

      const ev: SimulationEvent = {
        id: `ev-timeout-${currentStep}-${Date.now()}`,
        timestamp: formatTimestamp(),
        stepIndex: currentStep,
        type: 'TIMEOUT',
        seqNum: baseSeq,
        message: `TIMEOUT for Base packet P${baseSeq}! Go-Back-N retransmits unacknowledged window [${packetsToRetransmit.map((n) => `P${n}`).join(', ')}]!`,
        detail: `GBN hallmark: When base times out, sender goes back to base and retransmits all packets up to nextSeqNum-1.`,
        protocol: state.protocol,
      };
      newEvents.push(ev);
      explanation = `Go-Back-N Timeout on Base P${baseSeq}: Retransmitting all ${packetsToRetransmit.length} packets in the window: [${packetsToRetransmit.map((n) => `P${n}`).join(', ')}]!`;
    } else if (state.protocol === 'selective-repeat') {
      // SELECTIVE REPEAT TIMEOUT: RETRANSMIT ONLY THE TIMED-OUT PACKET!
      const p = packets.find((pk) => pk.seqNum === timedOutPacketSeq);
      if (p) {
        p.status = 'RETRANSMITTING';
        p.attempts++;
        p.transmissions++;
        stats.totalAttempts++;
        stats.retransmissions++;
      }

      const isLost = shouldDropPacket(timedOutPacketSeq, state.config.packetLossProb, state.config.manualErrors);
      inFlight.push({
        id: `sr-retransmit-${timedOutPacketSeq}-${Date.now()}`,
        packetId: timedOutPacketSeq,
        seqNum: timedOutPacketSeq,
        type: 'DATA',
        progress: 0,
        status: 'flying',
        isLost,
        createdAt: Date.now(),
      });

      sender.activeTimers[timedOutPacketSeq] = DEFAULT_TIMEOUT_TICKS;
      sender.status = 'RETRANSMITTING';

      const ev: SimulationEvent = {
        id: `ev-timeout-${currentStep}-${Date.now()}`,
        timestamp: formatTimestamp(),
        stepIndex: currentStep,
        type: 'TIMEOUT',
        seqNum: timedOutPacketSeq,
        message: `TIMEOUT for P${timedOutPacketSeq}! Selective Repeat retransmits ONLY P${timedOutPacketSeq}.`,
        detail: `Selective Repeat hallmark: Only the lost packet is retransmitted. Already buffered/acked packets are untouched.`,
        protocol: state.protocol,
      };
      newEvents.push(ev);
      explanation = `Selective Repeat Timeout: Retransmitting ONLY lost packet P${timedOutPacketSeq}. Other packets remain preserved in buffer.`;
    }

    return {
      ...state,
      currentStep,
      inFlight,
      packets,
      sender,
      receiver,
      stats: updateDerivedMetrics(stats),
      events: [...newEvents, ...state.events].slice(0, 150),
      currentExplanation: explanation,
    };
  }

  // =========================================================================
  // PRIORITY 3: Dispatch New Packet within Sender Window
  // =========================================================================
  const canSend =
    sender.nextSeqNum < sender.base + sender.windowSize &&
    sender.nextSeqNum <= state.config.totalPackets;

  if (canSend) {
    const seq = sender.nextSeqNum;
    const pIndex = packets.findIndex((pk) => pk.seqNum === seq);
    if (pIndex !== -1) {
      packets[pIndex].status = 'SENT';
      packets[pIndex].attempts++;
      packets[pIndex].transmissions++;
      packets[pIndex].sendTime = Date.now();
    }

    stats.totalAttempts++;
    sender.nextSeqNum = seq + 1;
    sender.status = 'TRANSMITTING';
    sender.activeTimers[seq] = DEFAULT_TIMEOUT_TICKS;

    const isLost = shouldDropPacket(seq, state.config.packetLossProb, state.config.manualErrors);
    inFlight.push({
      id: `data-${seq}-${Date.now()}`,
      packetId: seq,
      seqNum: seq,
      type: 'DATA',
      progress: 0,
      status: 'flying',
      isLost,
      createdAt: Date.now(),
    });

    const ev: SimulationEvent = {
      id: `ev-send-${currentStep}-${Date.now()}`,
      timestamp: formatTimestamp(),
      stepIndex: currentStep,
      type: 'SEND',
      seqNum: seq,
      message: `Sender transmitted packet P${seq} → Network.`,
      detail: `Window: [Base: P${sender.base}, Next: P${sender.nextSeqNum}, Size: ${sender.windowSize}]. ${
        isLost ? '(Simulated packet loss injected)' : '(Channel normal)'
      }`,
      protocol: state.protocol,
    };
    newEvents.push(ev);
    explanation = `Sender transmitted P${seq}. Sliding window: [${sender.base} .. ${Math.min(sender.base + sender.windowSize - 1, state.config.totalPackets)}].`;

    return {
      ...state,
      currentStep,
      inFlight,
      packets,
      sender,
      receiver,
      stats: updateDerivedMetrics(stats),
      events: [...newEvents, ...state.events].slice(0, 150),
      currentExplanation: explanation,
    };
  }

  // No active transmission, no flying item, but timers may still tick down
  return {
    ...state,
    currentStep,
    sender,
    packets,
    inFlight,
    receiver,
    stats: updateDerivedMetrics(stats),
    currentExplanation:
      sender.base > state.config.totalPackets
        ? 'Simulation complete!'
        : `Sender waiting for ACKs or timeout expiration for window [P${sender.base}..P${Math.min(sender.base + sender.windowSize - 1, state.config.totalPackets)}]...`,
  };
}

/**
 * Run a complete headless simulation with given parameters for comparison table/charts.
 * Runs deterministically to completion or max 300 steps.
 */
export function runHeadlessSimulation(
  protocol: ProtocolType,
  totalPackets: number,
  windowSize: number,
  packetLossProb: number,
  ackLossProb: number
) {
  const config: SimulationConfig = {
    protocol,
    totalPackets,
    windowSize: protocol === 'stop-and-wait' ? 1 : windowSize,
    packetLossProb,
    ackLossProb,
    packetSize: 'Medium',
    timeoutDuration: 8,
    propagationSpeed: 2,
    randomErrors: true,
    manualErrors: {},
  };

  let simState = createInitialState(config);
  simState.isRunning = true;

  let steps = 0;
  const maxSteps = 250;

  while (!simState.isCompleted && steps < maxSteps) {
    simState = stepSimulation(simState);
    steps++;
  }

  return {
    protocol,
    name: getProtocolName(protocol),
    totalPackets,
    windowSize: config.windowSize,
    transmissions: simState.stats.totalAttempts,
    retransmissions: simState.stats.retransmissions,
    timeouts: simState.stats.timeouts,
    packetsLost: simState.stats.packetsLost,
    acksLost: simState.stats.acksLost,
    efficiency: simState.stats.efficiency,
    deliveryRate: simState.stats.deliveryRate,
    stepsToComplete: steps,
    discardedCount: simState.stats.packetsDiscarded,
    bufferedCount: simState.stats.packetsBuffered,
  };
}
