import type { ModelTier, RelayInput } from "@/circuit/types";

/** Hard brake or a sharp yaw, in m/s² and rad/s. Above this, risk locks the car. */
export const RISK_ACCEL = 6;
export const RISK_YAW = 0.8;

/** Highway requested below this speed is treated as congestion. City cruise uses the lower number. */
export const JAM_HIGHWAY_KMH = 50;
export const JAM_CITY_KMH = 15;

export interface VehicleSense {
  speedKmh: number | null;
  accel: number;
  yaw: number;
  requested: ModelTier;
  paid: boolean;
  ticketOk: boolean;
}

export type RoadScene = "park" | "city" | "highway" | "jam" | "hazard" | "recover";

export interface RoadFrame {
  /** Milliseconds from the start of the road test. Holds until the next frame. */
  t: number;
  scene: RoadScene;
  sense: VehicleSense;
}

export function senseToRelay(sense: VehicleSense): RelayInput {
  const risk = Math.abs(sense.accel) >= RISK_ACCEL || Math.abs(sense.yaw) >= RISK_YAW;
  const speed = sense.speedKmh;
  const jamLine = sense.requested === 2 ? JAM_HIGHWAY_KMH : JAM_CITY_KMH;
  const burst = !risk && sense.requested !== 0 && speed != null && speed < jamLine;
  return {
    model: sense.requested,
    paid: sense.paid,
    burst,
    risk,
    ticketOk: sense.ticketOk,
  };
}

export const ROAD_TEST: RoadFrame[] = [
  { t: 0, scene: "park", sense: { speedKmh: 0, accel: 0, yaw: 0, requested: 0, paid: false, ticketOk: false } },
  { t: 4_000, scene: "city", sense: { speedKmh: 46, accel: 0.4, yaw: 0.05, requested: 1, paid: true, ticketOk: false } },
  { t: 9_000, scene: "highway", sense: { speedKmh: 108, accel: 0.2, yaw: 0.02, requested: 2, paid: true, ticketOk: false } },
  { t: 14_000, scene: "jam", sense: { speedKmh: 16, accel: -0.8, yaw: 0.1, requested: 2, paid: true, ticketOk: false } },
  { t: 19_000, scene: "hazard", sense: { speedKmh: 36, accel: -7.4, yaw: 0.2, requested: 2, paid: true, ticketOk: false } },
  { t: 24_000, scene: "recover", sense: { speedKmh: 12, accel: 0.3, yaw: 0.04, requested: 0, paid: true, ticketOk: false } },
];

export const ROAD_MS = 28_000;

export function frameAt(elapsed: number): RoadFrame {
  let current = ROAD_TEST[0]!;
  for (const frame of ROAD_TEST) {
    if (frame.t <= elapsed) current = frame;
  }
  return current;
}
