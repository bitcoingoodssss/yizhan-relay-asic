export const XLAYER_CHAIN_ID = 196;

export const XLAYER_ADD_PARAMS = {
  chainId: "0xc4",
  chainName: "X Layer mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"],
  blockExplorerUrls: ["https://www.okx.com/web3/explorer/xlayer"],
};

export interface Eip1193 {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

type Announced = { info: { name: string; rdns: string; uuid: string }; provider: Eip1193 };

const announced: Announced[] = [];

function listenForWallets(): void {
  if (typeof window === "undefined") return;
  const host = window as Window & { __yizhanWallets?: boolean };
  if (host.__yizhanWallets) return;
  host.__yizhanWallets = true;
  window.addEventListener("eip6963:announceProvider", (event) => {
    const detail = (event as CustomEvent<Announced>).detail;
    if (!detail?.info?.uuid || !detail.provider) return;
    if (announced.some((item) => item.info.uuid === detail.info.uuid)) return;
    announced.push(detail);
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function pickProvider(): Eip1193 | null {
  listenForWallets();
  if (typeof window === "undefined") return null;
  const host = window as Window & { okxwallet?: Eip1193; ethereum?: Eip1193 };
  const okx = announced.find((item) => /okx|okex/i.test(`${item.info.rdns} ${item.info.name}`));
  return okx?.provider ?? host.okxwallet ?? host.ethereum ?? announced[0]?.provider ?? null;
}

export function shortenAddress(address: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function parseChainId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value !== "string") return null;
  if (/^0x[0-9a-fA-F]+$/.test(value)) return Number.parseInt(value, 16);
  if (/^\d+$/.test(value)) return Number(value);
  return null;
}

export function parseWei(hex: string): bigint {
  if (!/^0x[0-9a-fA-F]+$/.test(hex)) return 0n;
  return BigInt(hex);
}

export function formatOkb(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n) / 10n ** 14n;
  return `${whole}.${frac.toString().padStart(4, "0")}`;
}

export function asAccounts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && /^0x[0-9a-fA-F]{40}$/.test(item));
}

export function errorCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const code = (error as { code: unknown }).code;
  if (typeof code === "number") return code;
  if (typeof code === "string" && /^-?\d+$/.test(code)) return Number(code);
  return null;
}

export function isUserRejected(error: unknown): boolean {
  return errorCode(error) === 4001;
}

export async function ensureXLayer(provider: Eip1193): Promise<number> {
  const current = parseChainId(await provider.request({ method: "eth_chainId" }));
  if (current === XLAYER_CHAIN_ID) return current;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: XLAYER_ADD_PARAMS.chainId }] });
  } catch (error) {
    if (isUserRejected(error)) throw error;
    await provider.request({ method: "wallet_addEthereumChain", params: [XLAYER_ADD_PARAMS] });
  }
  const next = parseChainId(await provider.request({ method: "eth_chainId" }));
  if (next == null) throw new Error("missing chain id");
  return next;
}

export async function readOkb(provider: Eip1193, address: string): Promise<string> {
  const hex = await provider.request({ method: "eth_getBalance", params: [address, "latest"] });
  if (typeof hex !== "string") throw new Error("balance");
  return formatOkb(parseWei(hex));
}
