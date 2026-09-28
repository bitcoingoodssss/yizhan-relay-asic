import { evalRelay } from "./relay.ts";
import type { RelayInput, RelayOutput } from "./types.ts";

export interface RelayExplain {
  lite: boolean;
  std: boolean;
  frontier: boolean;
  pass: boolean;
  riskClear: boolean;
  notLite: boolean;
  out: RelayOutput;
}

/** Intermediate nets for the desk. Outputs still come only from evalRelay. */
export function explainRelay(i: RelayInput): RelayExplain {
  const lite = i.model === 0;
  const std = i.model === 1;
  const frontier = i.model === 2;
  const pass = i.paid || lite || i.ticketOk;
  const riskClear = !i.risk;
  const notLite = i.model !== 0;
  return { lite, std, frontier, pass, riskClear, notLite, out: evalRelay(i) };
}

export function enumerateRelay(): Array<{ in: RelayInput; out: RelayOutput }> {
  const models = [0, 1, 2] as const;
  const bits = [false, true] as const;
  const rows: Array<{ in: RelayInput; out: RelayOutput }> = [];
  for (const model of models) {
    for (const paid of bits) {
      for (const burst of bits) {
        for (const risk of bits) {
          for (const ticketOk of bits) {
            const input: RelayInput = { model, paid, burst, risk, ticketOk };
            rows.push({ in: input, out: evalRelay(input) });
          }
        }
      }
    }
  }
  return rows;
}

/** True when the drawn nets equal evalRelay. Guards the diagram against drift. */
export function wiresMatch(i: RelayInput): boolean {
  const e = explainRelay(i);
  const allow = e.riskClear && e.pass;
  const degrade = allow && i.burst && e.notLite;
  const refuse = !allow;
  const tierHi = allow && !degrade && e.frontier;
  const o = e.out;
  return o.allow === allow && o.degrade === degrade && o.refuse === refuse && o.tierHi === tierHi;
}
