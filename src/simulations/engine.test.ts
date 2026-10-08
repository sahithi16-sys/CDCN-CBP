import { createInitialState, stepSimulation, runHeadlessSimulation } from './engine';
import { SimulationConfig } from '../types/simulation';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ ${msg}`);
}

console.log('=== TEST 1: Stop-and-Wait Normal Transmission ===');
{
  const config: SimulationConfig = {
    protocol: 'stop-and-wait',
    totalPackets: 5,
    windowSize: 1,
    packetLossProb: 0,
    ackLossProb: 0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    propagationSpeed: 1,
    randomErrors: false,
    manualErrors: {},
  };

  let state = createInitialState(config);
  let steps = 0;
  while (!state.isCompleted && steps < 100) {
    state = stepSimulation(state);
    steps++;
  }

  assert(state.isCompleted, 'Stop-and-Wait normal completes');
  assert(state.stats.deliveredPackets === 5, 'Stop-and-Wait delivered all 5 packets');
  assert(state.stats.retransmissions === 0, 'Stop-and-Wait zero retransmissions with 0% loss');
  assert(state.stats.efficiency === 100, 'Stop-and-Wait 100% efficiency');
}

console.log('\n=== TEST 2: Stop-and-Wait with P3 Lost (Timeout & Retransmit) ===');
{
  const config: SimulationConfig = {
    protocol: 'stop-and-wait',
    totalPackets: 5,
    windowSize: 1,
    packetLossProb: 0,
    ackLossProb: 0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    propagationSpeed: 1,
    randomErrors: false,
    manualErrors: { 3: 'packet_loss' },
  };

  let state = createInitialState(config);
  let sawP3Lost = false;
  let sawP3Timeout = false;
  let steps = 0;

  while (!state.isCompleted && steps < 120) {
    state = stepSimulation(state);
    steps++;
    if (state.events.some((e) => e.type === 'PACKET_LOST' && e.seqNum === 3)) {
      sawP3Lost = true;
    }
    if (state.events.some((e) => e.type === 'TIMEOUT' && e.seqNum === 3)) {
      sawP3Timeout = true;
    }
  }

  console.log('Total steps taken in Test 2:', steps);
  console.log('Events in Test 2:', state.events.map(e => `[${e.type}] ${e.message}`).slice(0, 15));

  assert(sawP3Lost, 'P3 was lost in channel');
  assert(sawP3Timeout, 'Timeout occurred for P3');
  assert(state.stats.retransmissions >= 1, 'P3 was retransmitted');
  assert(state.stats.deliveredPackets === 5, 'All 5 packets eventually delivered');
}

console.log('\n=== TEST 3: Go-Back-N P2 Lost & Discard of P3 & Window Retransmit ===');
{
  const config: SimulationConfig = {
    protocol: 'go-back-n',
    totalPackets: 5,
    windowSize: 3,
    packetLossProb: 0,
    ackLossProb: 0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    propagationSpeed: 1,
    randomErrors: false,
    manualErrors: { 2: 'packet_loss' },
  };

  let state = createInitialState(config);
  let sawDiscard = false;
  let sawWindowRetransmit = false;
  let steps = 0;

  while (!state.isCompleted && steps < 150) {
    state = stepSimulation(state);
    steps++;
    if (state.events.some((e) => e.type === 'DISCARD')) {
      sawDiscard = true;
    }
    if (state.events.some((e) => e.type === 'TIMEOUT' && e.seqNum === 2)) {
      sawWindowRetransmit = true;
    }
  }

  assert(sawDiscard, 'Go-Back-N receiver discarded out-of-order packet P3');
  assert(sawWindowRetransmit, 'Go-Back-N timeout occurred on Base P2');
  assert(state.stats.packetsDiscarded >= 1, 'Discard counter incremented');
  assert(state.isCompleted, 'Go-Back-N completed delivery of all 5 packets');
}

console.log('\n=== TEST 4: Selective Repeat P2 Lost & P3 Buffering ===');
{
  const config: SimulationConfig = {
    protocol: 'selective-repeat',
    totalPackets: 5,
    windowSize: 3,
    packetLossProb: 0,
    ackLossProb: 0,
    packetSize: 'Medium',
    timeoutDuration: 8,
    propagationSpeed: 1,
    randomErrors: false,
    manualErrors: { 2: 'packet_loss' },
  };

  let state = createInitialState(config);
  let sawBuffer = false;
  let steps = 0;

  while (!state.isCompleted && steps < 150) {
    state = stepSimulation(state);
    steps++;
    if (state.events.some((e) => e.type === 'BUFFER')) {
      sawBuffer = true;
    }
  }

  assert(sawBuffer, 'Selective Repeat buffered out-of-order packet P3');
  assert(state.stats.packetsBuffered >= 1, 'Buffer counter incremented');
  assert(state.isCompleted, 'Selective Repeat completed delivery of all 5 packets');
}

console.log('\n=== TEST 5: Headless Benchmark Simulation ===');
{
  const swRes = runHeadlessSimulation('stop-and-wait', 10, 1, 0.2, 0.1);
  const gbnRes = runHeadlessSimulation('go-back-n', 10, 3, 0.2, 0.1);
  const srRes = runHeadlessSimulation('selective-repeat', 10, 3, 0.2, 0.1);

  assert(swRes.totalPackets === 10, 'Stop-and-Wait benchmark returned 10 packets');
  assert(gbnRes.windowSize === 3, 'Go-Back-N benchmark used window size 3');
  assert(srRes.windowSize === 3, 'Selective Repeat benchmark used window size 3');
  console.log('Benchmark efficiencies:', {
    'Stop-and-Wait': `${swRes.efficiency}%`,
    'Go-Back-N': `${gbnRes.efficiency}%`,
    'Selective Repeat': `${srRes.efficiency}%`,
  });
}

console.log('\n✨ ALL PROTOCOL TESTS PASSED WITH 100% SUCCESS!');
