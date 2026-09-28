export type ModelTier = 0 | 1 | 2; // lite std frontier

export interface RelayInput {
  model: ModelTier;
  paid: boolean;
  burst: boolean;
  risk: boolean;
  ticketOk: boolean;
}

export interface RelayOutput {
  allow: boolean;
  degrade: boolean;
  refuse: boolean;
  tierHi: boolean;
  action: "lite" | "std" | "frontier" | "degraded" | "refuse";
}

export interface TicketInput {
  ok: boolean;
  mobile: boolean;
}

export interface TicketOutput {
  valid: boolean;
}
