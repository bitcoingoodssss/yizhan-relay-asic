import type { RelayInput, RelayOutput } from "./types.ts";

export type NarrationId =
  | "riskLite"
  | "risk"
  | "unpaidFrontier"
  | "unpaidStd"
  | "degradeFrontier"
  | "degradeStd"
  | "liteBurst"
  | "lite"
  | "stdTicket"
  | "std"
  | "frontierTicket"
  | "frontier"
  | "computed";

export function narrate(i: RelayInput, o: RelayOutput): NarrationId {
  if (!o.allow && i.risk && i.model === 0) return "riskLite";
  if (!o.allow && i.risk) return "risk";
  if (!o.allow && i.model === 2) return "unpaidFrontier";
  if (!o.allow) return "unpaidStd";
  if (o.degrade && i.model === 2) return "degradeFrontier";
  if (o.degrade) return "degradeStd";
  if (o.action === "lite" && i.burst) return "liteBurst";
  if (o.action === "lite") return "lite";
  if (o.action === "std" && i.ticketOk && !i.paid) return "stdTicket";
  if (o.action === "std") return "std";
  if (o.action === "frontier" && i.ticketOk && !i.paid) return "frontierTicket";
  if (o.action === "frontier") return "frontier";
  return "computed";
}
