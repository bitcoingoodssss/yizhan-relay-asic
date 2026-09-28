import type { RelayOutput } from "./types.ts";

export const DIE_PADS = 32;

function shiftOf(action: RelayOutput["action"]): number {
  if (action === "lite") return 0;
  if (action === "std") return 1;
  if (action === "frontier") return 2;
  if (action === "degraded") return 3;
  return 4;
}

export function diePads(out: RelayOutput, pass: boolean, lite: boolean): boolean[] {
  const bits = [out.allow, pass, lite, out.degrade, out.tierHi, out.action === "frontier", out.action === "std", !out.refuse];
  const shift = shiftOf(out.action);
  return Array.from({ length: DIE_PADS }, (_, index) => {
    const bit = bits[(index + shift) % bits.length]!;
    return bit && (index + shift) % 2 === 0;
  });
}
