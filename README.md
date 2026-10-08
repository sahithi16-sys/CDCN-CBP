# Reliable Data Transfer — ARQ Protocol Simulator

**Course:** Computer Networks  
**Topic:** Topic 1 — Reliable Data Transfer / ARQ Simulator  
**Technology Stack:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts  

---

## 1. Project Title & Overview
**"Reliable Data Transfer — ARQ Protocol Simulator"** is a client-side interactive networking laboratory designed to visually demonstrate the foundational mechanisms of Reliable Data Transfer (RDT) and Automatic Repeat reQuest (ARQ) protocols.

The simulator models the physical behavior of three classical ARQ architectures:
1. **Stop-and-Wait ARQ**
2. **Go-Back-N ARQ (GBN)**
3. **Selective Repeat ARQ (SR)**

---

## 2. Problem Statement
Physical transmission channels (copper cables, optical fibers, and radio links) are intrinsically unreliable. Signal attenuation, electromagnetic interference, collisions, and buffer exhaustion cause packets or acknowledgements (ACKs) to be dropped, delayed, corrupted, or reordered. Upper-layer applications, however, mandate a lossless, sequential byte stream. Designing reliable data transfer protocols requires robust state-machine logic involving sliding sequence windows, positive acknowledgements, countdown timers, and retransmission strategies.

---

## 3. Objective
To construct an interactive simulation environment that enables students and evaluators to:
- Visually observe frame propagation and return path ACKs in real time.
- Comprehend the mathematical and operational differences among Stop-and-Wait, Go-Back-N, and Selective Repeat.
- Deterministically inject packet loss, ACK loss, and propagation delay to inspect recovery algorithms.
- Advance simulations **one discrete networking event at a time (Step Mode)** for step-by-step viva voce explanation.
- Compare protocol transmission efficiency, retransmission counts, and timeouts under identical link conditions.

---

## 4. Key Networking Concepts
- **Error Control:** Detecting frame drops and recovering data via retransmissions.
- **Flow Control:** Restricting the volume of unacknowledged data on the wire using window size $W$.
- **Sliding Window:** Dynamic sequence number tracking that advances base boundaries upon receipt of valid ACKs.
- **Acknowledgements (ACK):** Feedback signaling; cumulative in Go-Back-N, individual in Selective Repeat.
- **Timeout / Countdown Timer:** An timer started when a frame is dispatched; upon expiration without ACK, retransmission triggers.
- **Retransmission:** The resending of lost or unacknowledged frames.
- **Receiver Buffering:** Temporarily holding out-of-order frames in Selective Repeat until missing preceding frames arrive.
- **Rejection / Discarding:** Go-Back-N's policy of discarding all out-of-order frames due to the absence of a receive buffer.

---

## 5. Features
- **Full-Duplex Horizontal Network Channel:** Real-time Framer Motion visualization of DATA frames ($\rightarrow$) and ACK signals ($\leftarrow$).
- **Sliding Window Indicators:** Active visual framing showing Base, Next Sequence Number, and unACKed frames with individual countdown ticks.
- **Selective Repeat Receiver Buffer:** Clear display of delivered, buffered, and expected sequence slots (`[P1 ✓] [P2 ?] [P3 ✓]`).
- **Manual Fault Injection:** Deterministic injection of Data Packet Loss, ACK Loss, or Delay on specific sequence numbers ($P_1 \dots P_N$).
- **1-Click Demo Scenarios:** Presets covering Normal Transmission, P3 Drop, ACK Drop, GBN Discard, and Selective Retransmission.
- **Discrete Step Mode (⏭):** Single-click advancement of one atomic event at a time for viva demonstration.
- **Telemetry & Statistics:** Live computation of Efficiency (%), Retransmission Rate, Delivery Rate, Timeouts, and Attempts.
- **Headless Protocol Benchmark:** Side-by-side execution comparing all three protocols under identical channel parameters with Recharts bar graphs.
- **Viva Voce Mode:** 15 comprehensive examination questions with direct concise answers and technical deep-dives.
- **Editorial Laboratory Design:** Clean white & near-black layout, bold typography, electric lime accents, and minimal borders.

---

## 6. Technologies Used
- **React 19:** Component state architecture and reactive rendering.
- **TypeScript:** Strict type contracts (`ProtocolType`, `PacketStatus`, `InFlightItem`, `SimulationEvent`).
- **Vite:** High-performance frontend build tooling.
- **Tailwind CSS:** Responsive layout, glassmorphism, and custom animations.
- **Framer Motion:** Smooth packet travel, loss explosions, and buffer transitions.
- **Lucide React:** Visual iconography for packet states and controls.
- **Recharts:** Interactive comparison bar charts.
- **TSX:** Fast TypeScript testing harness for headless simulation tests.

---

## 7. How to Install
Clone or navigate to the project directory:

```bash
cd cdcn
npm install
```

---

## 8. How to Run
Start the local development server:

```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

To verify production build and type checking:

```bash
npm run build
```

To run the automated protocol test suite:

```bash
npm test
```

---

## 9. How the Simulation Engine Works
The simulator uses a discrete-event state machine (`src/simulations/engine.ts`). Each tick or manual step evaluates three prioritized phases:
1. **Physical Propagation Phase:** Advances in-flight frames across the channel.
   - If frame reaches destination intact: Receiver accepts, updates sequence state, and dispatches return ACK.
   - If frame is lost: Packet status set to `LOST`, loss event recorded, and sender awaits timeout.
   - If ACK arrives at sender: Window base slides forward, timers reset.
2. **Timeout & Retransmission Phase:** Active countdown timers decrement. When timer hits 0:
   - **Stop-and-Wait:** Retransmits $P_{\text{base}}$.
   - **Go-Back-N:** Retransmits $P_{\text{base}}$ AND all subsequent sent packets in the window ($P_{\text{base}} \dots P_{\text{next}-1}$).
   - **Selective Repeat:** Retransmits ONLY the specific timed-out packet.
3. **Pipelined Dispatch Phase:** If space remains in sender window ($nextSeqNum < base + W$), dispatches the next sequential packet.

---

## 10. Protocol Breakdown & Comparison

| Protocol | Sender Window Size ($W_s$) | Receiver Window Size ($W_r$) | ACK Type | Out-of-Order Behavior | Retransmission on Timeout |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stop-and-Wait** | $1$ | $1$ | Individual | N/A (Only 1 packet on wire) | Retransmit current packet |
| **Go-Back-N** | $N$ (e.g. 3–5) | $1$ | Cumulative | **Discarded** (Receiver has no buffer) | Retransmit **entire window** from base |
| **Selective Repeat** | $N$ (e.g. 3–5) | $N$ (e.g. 3–5) | Individual | **Buffered** (Stored until missing frame arrives) | Retransmit **only the lost frame** |

---

## 11. How Packet Loss is Simulated
1. **Random Probabilistic Loss:** Each frame transmission generates a pseudo-random value $r \in [0, 1)$. If $r < \text{LossProbability}$, the packet is marked `isLost = true`.
2. **Deterministic Manual Injection:** If the user configures "Packet Loss on P2", frame P2 is flagged to drop on its first transmission regardless of probability, demonstrating protocol recovery for examiners.

---

## 12. Recommended Demonstration Flow for Evaluation

### Step A: Stop-and-Wait Baseline
1. Click **Stop-and-Wait**.
2. Select **Scenario 1: Normal Transmission** (5 packets, 0% loss).
3. Click **▶ Start**. Observe alternating: `P1 Sent → P1 Delivered → ACK1 Sent → ACK1 Received → P2 Sent`.

### Step B: Stop-and-Wait Timeout Recovery
1. Select **Scenario 2: Packet P3 Lost**.
2. Click **⏭ Step** iteratively.
3. Observe P1 and P2 succeed.
4. Observe P3 drop with a red explosion indicator.
5. Step until the timer hits 0. Notice `TIMEOUT for P3!` event and automatic retransmission.

### Step C: Go-Back-N Retransmit Window Demonstration
1. Click **Go-Back-N** (Window Size = 3).
2. Select **Scenario 4: Go-Back-N P2 Lost & Discard**.
3. Click **⏭ Step**.
4. Observe P1 arrive and ACK1 generated.
5. Observe P2 drop in the channel.
6. Observe P3 arrive at receiver: **Receiver explicitly discards P3** because it expects P2!
7. Step until timeout on P2 expires: **Sender retransmits BOTH P2 and P3**!

### Step D: Selective Repeat Buffering & Selective Recovery
1. Click **Selective Repeat** (Window Size = 3).
2. Select **Scenario 5: Selective Repeat Buffering**.
3. Click **⏭ Step**.
4. Observe P2 drop in the channel.
5. Observe P3 arrive at receiver: **Receiver stores P3 in its buffer and sends ACK3**!
6. Step until timeout on P2: **Sender retransmits ONLY P2**.
7. When P2 arrives, receiver releases P2 and the buffered P3 together to the application layer.

### Step E: Benchmark Comparison & Viva Review
1. Click **Compare Protocols** in the navbar &rarr; Click **Run Benchmark** to view the metrics table and Recharts bar graph.
2. Click **Viva** in the navbar to review all 15 exam questions and model technical answers.

---

## 13. Real-World Applications
- **TCP (Transmission Control Protocol):** End-to-end sliding window with cumulative ACKs and Selective Acknowledgements (SACK).
- **IEEE 802.11 Wi-Fi:** Immediate Layer-2 MAC frame ACKs to overcome high radio frequency error rates.
- **5G / LTE Cellular:** Hybrid ARQ (HARQ) combining forward error correction (FEC) with selective retransmission.
- **Satellite Communications:** Deep-space links with massive round-trip propagation times requiring large-window Selective Repeat.

---

## 14. Future Enhancements
- Congestion control emulation (TCP Tahoe/Reno additive increase, multiplicative decrease).
- Dynamic Round-Trip Time (RTT) estimation graphs with Jacobson's algorithm ($RTO$).
- Bit-level CRC-32 checksum corruption simulation.

---

## 15. Verification & Test Suite
The repository includes an automated regression test suite:

```bash
npm test
```

Output:
```
=== TEST 1: Stop-and-Wait Normal Transmission ===
✅ Stop-and-Wait normal completes
✅ Stop-and-Wait delivered all 5 packets
✅ Stop-and-Wait zero retransmissions with 0% loss
✅ Stop-and-Wait 100% efficiency

=== TEST 2: Stop-and-Wait with P3 Lost (Timeout & Retransmit) ===
✅ P3 was lost in channel
✅ Timeout occurred for P3
✅ P3 was retransmitted
✅ All 5 packets eventually delivered

=== TEST 3: Go-Back-N P2 Lost & Discard of P3 & Window Retransmit ===
✅ Go-Back-N receiver discarded out-of-order packet P3
✅ Go-Back-N timeout occurred on Base P2
✅ Discard counter incremented
✅ Go-Back-N completed delivery of all 5 packets

=== TEST 4: Selective Repeat P2 Lost & P3 Buffering ===
✅ Selective Repeat buffered out-of-order packet P3
✅ Buffer counter incremented
✅ Selective Repeat completed delivery of all 5 packets

=== TEST 5: Headless Benchmark Simulation ===
✅ Stop-and-Wait benchmark returned 10 packets
✅ Go-Back-N benchmark used window size 3
✅ Selective Repeat benchmark used window size 3
✨ ALL PROTOCOL TESTS PASSED WITH 100% SUCCESS!
```
