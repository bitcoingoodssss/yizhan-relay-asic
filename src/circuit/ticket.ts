import type { TicketInput, TicketOutput } from "./types.ts";

export function evalTicket(i: TicketInput): TicketOutput {
  return { valid: i.ok && i.mobile };
}
