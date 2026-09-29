import type { RelayInput } from "./types.ts";

type Op = { a: number; b: number; out: number };

function builder(nIn: number) {
  const ops: Op[] = [];
  let next = 2 + nIn;
  const nand = (a: number, b: number) => {
    const out = next;
    next += 1;
    ops.push({ a, b, out });
    return out;
  };
  return { ops, nand, input: (index: number) => 2 + index };
}

function withBuffers(ops: Op[], nand: (a: number, b: number) => number, outs: number[]) {
  const inverted = outs.map((signal) => nand(signal, signal));
  const buffered = inverted.map((signal) => nand(signal, signal));
  return { ops, buffered };
}

function bytesOf(ops: Op[]): Uint8Array {
  const raw = new Uint8Array(ops.length * 7);
  ops.forEach((op, index) => {
    const at = index * 7;
    raw[at + 1] = (op.a >> 16) & 255;
    raw[at + 2] = (op.a >> 8) & 255;
    raw[at + 3] = op.a & 255;
    raw[at + 4] = (op.b >> 16) & 255;
    raw[at + 5] = (op.b >> 8) & 255;
    raw[at + 6] = op.b & 255;
  });
  return raw;
}

export function hexOf(bytes: Uint8Array): string {
  let hex = "0x";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

function relayOps() {
  const { ops, nand, input } = builder(6);
  const paid = input(0);
  const burst = input(1);
  const risk = input(2);
  const ticket = input(3);
  const lite = input(4);
  const frontier = input(5);
  const notPaid = nand(paid, paid);
  const notLite = nand(lite, lite);
  const notTicket = nand(ticket, ticket);
  const paidOrLite = nand(notPaid, notLite);
  const pass = nand(nand(paidOrLite, paidOrLite), notTicket);
  const notRisk = nand(risk, risk);
  const allowGate = nand(notRisk, pass);
  const allow = nand(allowGate, allowGate);
  const burstGate = nand(allow, burst);
  const allowBurst = nand(burstGate, burstGate);
  const degradeGate = nand(allowBurst, notLite);
  const degrade = nand(degradeGate, degradeGate);
  const refuse = nand(allow, allow);
  const notDegrade = nand(degrade, degrade);
  const clearGate = nand(allow, notDegrade);
  const clear = nand(clearGate, clearGate);
  const tierGate = nand(clear, frontier);
  const tierHi = nand(tierGate, tierGate);
  return withBuffers(ops, nand, [allow, degrade, refuse, tierHi]);
}

export function sampleNandNetlist(): Uint8Array {
  const { ops, nand, input } = builder(2);
  return bytesOf(withBuffers(ops, nand, [nand(input(0), input(1))]).ops);
}

export function relayNetlist(): { bytes: Uint8Array; nIn: number; nOut: number; nand: number } {
  const built = relayOps();
  return { bytes: bytesOf(built.ops), nIn: 6, nOut: 4, nand: built.ops.length };
}

function levels(ops: Op[], bits: number[]): number[] {
  const signal = [0, 1, ...bits];
  for (const op of ops) signal[op.out] = signal[op.a] && signal[op.b] ? 0 : 1;
  return signal;
}

export function simulateRelay(input: RelayInput): { allow: boolean; degrade: boolean; refuse: boolean; tierHi: boolean } {
  const built = relayOps();
  const bits = [
    input.paid ? 1 : 0,
    input.burst ? 1 : 0,
    input.risk ? 1 : 0,
    input.ticketOk ? 1 : 0,
    input.model === 0 ? 1 : 0,
    input.model === 2 ? 1 : 0,
  ];
  const signal = levels(built.ops, bits);
  const [allow, degrade, refuse, tierHi] = built.buffered.map((index) => signal[index] === 1);
  return { allow: allow!, degrade: degrade!, refuse: refuse!, tierHi: tierHi! };
}
