import type { RelayInput, RelayOutput } from "./types.ts";

export function evalRelay(i: RelayInput): RelayOutput {
  const allow = !i.risk && (i.paid || i.model === 0 || i.ticketOk);

  const degrade = allow && i.burst && i.model !== 0;
  const refuse = !allow;
  const tierHi = allow && !degrade && i.model === 2;

  let action: RelayOutput["action"] = "refuse";
  if (allow && degrade) action = "degraded";
  else if (allow && i.model === 0) action = "lite";
  else if (allow && i.model === 1) action = "std";
  else if (allow && i.model === 2) action = "frontier";

  return { allow, degrade, refuse, tierHi, action };
}

export const RELAY_TRUTH_CASES: Array<{ in: RelayInput; note: string }> = [
  { in: { model: 0, paid: false, burst: false, risk: false, ticketOk: false }, note: "unpaid lite -> allow lite" },
  { in: { model: 2, paid: false, burst: false, risk: false, ticketOk: false }, note: "unpaid frontier -> refuse" },
  { in: { model: 2, paid: true, burst: false, risk: false, ticketOk: false }, note: "paid frontier -> allow" },
  { in: { model: 2, paid: true, burst: true, risk: false, ticketOk: false }, note: "burst -> degrade" },
  { in: { model: 2, paid: true, burst: false, risk: true, ticketOk: false }, note: "risk -> refuse" },
  { in: { model: 2, paid: false, burst: false, risk: false, ticketOk: true }, note: "ticket unlocks frontier" },
];
