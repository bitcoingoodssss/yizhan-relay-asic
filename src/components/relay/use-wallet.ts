import { useCallback, useEffect, useRef, useState } from "react";
import {
  asAccounts,
  ensureXLayer,
  isUserRejected,
  parseChainId,
  pickProvider,
  readOkb,
  XLAYER_CHAIN_ID,
  type Eip1193,
} from "@/chain/wallet";

export type WalletError = "rejected" | "no-wallet" | "failed";

export interface WalletView {
  address: string | null;
  chainId: number | null;
  okb: string | null;
  busy: boolean;
  error: WalletError | null;
  framed: boolean;
  onXLayer: boolean;
  connect: () => void;
  disconnect: () => void;
  switchChain: () => void;
  openTab: () => void;
}

export function useWallet(): WalletView {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [okb, setOkb] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);
  const [framed, setFramed] = useState(false);
  const providerRef = useRef<Eip1193 | null>(null);

  const applyAccount = useCallback(async (provider: Eip1193, account: string | null) => {
    if (!account) {
      setAddress(null);
      setChainId(null);
      setOkb(null);
      return;
    }
    const id = parseChainId(await provider.request({ method: "eth_chainId" }));
    setAddress(account);
    setChainId(id);
    if (id !== XLAYER_CHAIN_ID) {
      setOkb(null);
      return;
    }
    try {
      setOkb(await readOkb(provider, account));
    } catch {
      setOkb(null);
    }
  }, []);

  useEffect(() => {
    try {
      setFramed(window.self !== window.top);
    } catch {
      setFramed(true);
    }
    const provider = pickProvider();
    providerRef.current = provider;
    if (!provider) return;
    let stop = false;
    const onAccounts = (...args: unknown[]) => {
      const next = asAccounts(args[0])[0] ?? null;
      if (!stop) void applyAccount(provider, next);
    };
    const onChain = () => {
      if (stop) return;
      void provider.request({ method: "eth_accounts" }).then((value) => {
        if (!stop) void applyAccount(provider, asAccounts(value)[0] ?? null);
      });
    };
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);
    void provider.request({ method: "eth_accounts" }).then((value) => {
      const account = asAccounts(value)[0] ?? null;
      if (!stop && account) void applyAccount(provider, account);
    });
    return () => {
      stop = true;
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [applyAccount]);

  async function connect() {
    setError(null);
    const provider = pickProvider();
    providerRef.current = provider;
    if (!provider) {
      setError("no-wallet");
      return;
    }
    setBusy(true);
    try {
      const account = asAccounts(await provider.request({ method: "eth_requestAccounts" }))[0];
      if (!account) throw new Error("no account");
      await ensureXLayer(provider);
      await applyAccount(provider, account);
    } catch (caught) {
      setError(isUserRejected(caught) ? "rejected" : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function switchChain() {
    const provider = providerRef.current ?? pickProvider();
    if (!provider || !address) return;
    setBusy(true);
    setError(null);
    try {
      await ensureXLayer(provider);
      await applyAccount(provider, address);
    } catch (caught) {
      setError(isUserRejected(caught) ? "rejected" : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    const provider = providerRef.current;
    setAddress(null);
    setChainId(null);
    setOkb(null);
    setError(null);
    try {
      await provider?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      // Injected wallets often cannot revoke. Clearing the desk is the disconnect.
    }
  }

  function openTab() {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  }

  return {
    address,
    chainId,
    okb,
    busy,
    error,
    framed,
    onXLayer: chainId === XLAYER_CHAIN_ID,
    connect: () => void connect(),
    disconnect: () => void disconnect(),
    switchChain: () => void switchChain(),
    openTab,
  };
}
