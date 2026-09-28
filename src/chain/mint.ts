export const MINT_BATCH = 8;
export const MINT_OKB = "0.001";
export const MINT_VALUE_WEI = 10n ** 15n;
export const MINT_TO = "0x000000000000000000000000000000000000dEaD";

export function mintCalldata(batch = MINT_BATCH): string {
  const bytes = new TextEncoder().encode(`YIZHAN:MINT:${batch}`);
  let hex = "0x";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

export function mintTransaction(from: string, batch = MINT_BATCH) {
  return {
    from,
    to: MINT_TO,
    value: `0x${MINT_VALUE_WEI.toString(16)}`,
    data: mintCalldata(batch),
  };
}

export function receiptOk(receipt: unknown): boolean | null {
  if (!receipt || typeof receipt !== "object" || !("status" in receipt)) return null;
  const status = (receipt as { status?: unknown }).status;
  if (status === "0x1" || status === 1) return true;
  if (status === "0x0" || status === 0) return false;
  return null;
}
