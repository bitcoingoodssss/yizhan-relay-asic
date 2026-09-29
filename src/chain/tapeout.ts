import { encodeUint } from "./mint.ts";
import { relayNetlist } from "../circuit/netlist.ts";
import { CONFIG } from "../config.ts";

export const TAPEOUT_FEE = 1300000000000000n;
export const TAPE_SELECTOR = "0x7bd3ac1d";
export const TAPE_FEE_SELECTOR = "0xadfb2b69";
export const TAPED_OUT_TOPIC = "0xc11215e417669c143c8a07aeb778034c0a0a85ebdf305d64a629b19a7a9ce031";
const RPC = "https://rpc.xlayer.tech";

export function tapeoutCalldata(netlist: Uint8Array, nIn: number, nOut: number): string {
  const head = [96n, BigInt(nIn), BigInt(nOut), BigInt(netlist.length)].map((word) => encodeUint(word)).join("");
  let body = "";
  for (const byte of netlist) body += byte.toString(16).padStart(2, "0");
  const pad = (32 - (netlist.length % 32)) % 32;
  return TAPE_SELECTOR + head + body + "00".repeat(pad);
}

export function relayTapeTransaction(from: string) {
  const net = relayNetlist();
  return {
    from,
    to: CONFIG.processor,
    value: `0x${TAPEOUT_FEE.toString(16)}`,
    data: tapeoutCalldata(net.bytes, net.nIn, net.nOut),
    nand: net.nand,
  };
}

export async function readTapeFee(): Promise<bigint> {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: CONFIG.processor, data: TAPE_FEE_SELECTOR }, "latest"] }),
  });
  if (!response.ok) throw new Error("rpc");
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("result" in payload)) throw new Error("rpc");
  const result = (payload as { result?: unknown }).result;
  if (typeof result !== "string" || !result.startsWith("0x")) throw new Error("rpc");
  return BigInt(result);
}

export function circuitIdFromReceipt(receipt: unknown): string | null {
  if (!receipt || typeof receipt !== "object" || !("logs" in receipt)) return null;
  const logs = (receipt as { logs?: unknown }).logs;
  if (!Array.isArray(logs)) return null;
  for (const log of logs) {
    if (!log || typeof log !== "object" || !("topics" in log)) continue;
    const topics = (log as { topics?: unknown }).topics;
    if (!Array.isArray(topics) || topics[0] !== TAPED_OUT_TOPIC) continue;
    const id = topics[1];
    if (typeof id !== "string" || !id.startsWith("0x")) continue;
    return BigInt(id).toString();
  }
  return null;
}

export function tapeLabel(localId: string): string {
  return `${localId}.2.${CONFIG.cpuIndex}`;
}
