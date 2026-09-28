import { CONFIG } from "../config.ts";

export const NAND_ID = 0n;
export const LATCH_ID = 1n;
export const MINT_AMOUNT = 1n;
export const MINT_SELECTOR = "0x1b2ef1ca";
const RPC = "https://rpc.xlayer.tech";

const SELECTOR = {
  mintPrice: "0x6817c76c",
  protocolFee: "0xb0e21e8a",
  minted: "0x4f02c420",
  supplyCap: "0x8f770ad0",
  balanceOf: "0x00fdd58e",
} as const;

export interface StationBooks {
  mintPrice: bigint;
  protocolFee: bigint;
  minted: bigint;
  supply: bigint;
  nand: bigint;
  latch: bigint;
}

export function encodeUint(value: bigint): string {
  if (value < 0n) throw new Error("uint");
  return value.toString(16).padStart(64, "0");
}

export function mintCalldata(id = NAND_ID, amount = MINT_AMOUNT): string {
  return MINT_SELECTOR + encodeUint(id) + encodeUint(amount);
}

export function mintValue(price: bigint, fee: bigint, amount = MINT_AMOUNT): bigint {
  return price * amount + fee;
}

export function mintTransaction(from: string, price: bigint, fee: bigint, amount = MINT_AMOUNT) {
  return {
    from,
    to: CONFIG.transistors,
    value: `0x${mintValue(price, fee, amount).toString(16)}`,
    data: mintCalldata(NAND_ID, amount),
  };
}

export function formatOkb(wei: bigint): string {
  const base = 10n ** 18n;
  const whole = wei / base;
  const frac = (wei % base).toString().padStart(18, "0").replace(/0+$/, "");
  return frac.length > 0 ? `${whole}.${frac}` : whole.toString();
}

export function receiptOk(receipt: unknown): boolean | null {
  if (!receipt || typeof receipt !== "object" || !("status" in receipt)) return null;
  const status = (receipt as { status?: unknown }).status;
  if (status === "0x1" || status === 1) return true;
  if (status === "0x0" || status === 0) return false;
  return null;
}

function balanceData(holder: string, id: bigint): string {
  const address = holder.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  return SELECTOR.balanceOf + address + encodeUint(id);
}

function uintResult(value: unknown): bigint {
  if (typeof value !== "string" || !value.startsWith("0x")) throw new Error("rpc");
  return BigInt(value);
}

export async function readStation(holder: string): Promise<StationBooks> {
  const calls = [
    SELECTOR.mintPrice,
    SELECTOR.protocolFee,
    SELECTOR.minted,
    SELECTOR.supplyCap,
    balanceData(holder, NAND_ID),
    balanceData(holder, LATCH_ID),
  ];
  const body = calls.map((data, index) => ({
    jsonrpc: "2.0",
    id: index + 1,
    method: "eth_call",
    params: [{ to: CONFIG.transistors, data }, "latest"],
  }));
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("rpc");
  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || payload.length !== calls.length) throw new Error("rpc");
  const byId = new Map<number, bigint>();
  for (const row of payload) {
    if (!row || typeof row !== "object" || !("id" in row) || !("result" in row)) throw new Error("rpc");
    byId.set(Number((row as { id: unknown }).id), uintResult((row as { result: unknown }).result));
  }
  const at = (id: number) => {
    const value = byId.get(id);
    if (value === undefined) throw new Error("rpc");
    return value;
  };
  return {
    mintPrice: at(1),
    protocolFee: at(2),
    minted: at(3),
    supply: at(4),
    nand: at(5),
    latch: at(6),
  };
}
