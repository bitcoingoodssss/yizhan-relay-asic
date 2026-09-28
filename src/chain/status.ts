import { CONFIG } from "../config.ts";

export type ChainEvalStatus =
  | { status: "unconfigured" }
  | { status: "todo"; processor: string; circuitId: string };

/**
 * On-chain eval is intentionally unread until a real processor address exists.
 * Never invent a lamp state from the chain.
 */
export function chainEvalReady(): ChainEvalStatus {
  const pending =
    CONFIG.processor.includes("YOUR_") ||
    CONFIG.relayCircuitId === "PENDING" ||
    CONFIG.relayTx.includes("PENDING");
  if (pending) return { status: "unconfigured" };
  return {
    status: "todo",
    processor: CONFIG.processor,
    circuitId: CONFIG.relayCircuitId,
  };
}
