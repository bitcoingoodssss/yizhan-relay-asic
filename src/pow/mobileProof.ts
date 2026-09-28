const HEX = "0123456789abcdef";

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += HEX[bytes[i]! >> 4]! + HEX[bytes[i]! & 15]!;
  }
  return hex;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return toHex(buf);
}

export interface ProofProgress {
  nonce: number;
  hash: string;
  elapsed: number;
}

export interface ProofHooks {
  onProgress?: (progress: ProofProgress) => void;
  signal?: AbortSignal;
}

/** Demo qualification: hash(prefix:nonce) starts with 000, and finishes under 15s. Not mining. */
export async function runMobileProof(
  prefix = "yizhan",
  hooks?: ProofHooks,
): Promise<{ nonce: number; hash: string; ok: boolean }> {
  const started = Date.now();
  const encoder = new TextEncoder();
  for (let nonce = 0; nonce < 2_000_000; nonce++) {
    if (hooks?.signal?.aborted) return { nonce: -1, hash: "", ok: false };
    const buf = await crypto.subtle.digest("SHA-256", encoder.encode(`${prefix}:${nonce}`));
    const hash = toHex(buf);
    if (nonce % 32 === 0) {
      hooks?.onProgress?.({ nonce, hash, elapsed: Date.now() - started });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (hash.startsWith("000")) {
      return { nonce, hash, ok: Date.now() - started < 15_000 };
    }
  }
  return { nonce: -1, hash: "", ok: false };
}

export { sha256Hex };
