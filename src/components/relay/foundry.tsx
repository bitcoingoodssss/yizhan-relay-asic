import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import { formatOkb, mintTransaction, mintValue, readStation, receiptOk, type StationBooks } from "@/chain/mint";
import { TAPEOUT_FEE, circuitIdFromReceipt, readTapeFee, relayTapeTransaction, tapeLabel } from "@/chain/tapeout";
import { relayNetlist } from "@/circuit/netlist";
import { ensureXLayer, isUserRejected, pickProvider } from "@/chain/wallet";
import { CONFIG } from "@/config";
import { diePads } from "@/circuit/die";
import type { RelayOutput } from "@/circuit/types";
import type { Copy } from "@/i18n/copy";
import type { WalletView } from "./use-wallet";

type Phase = "idle" | "confirm" | "pending" | "done" | "fail";

export function Foundry({
  copy,
  wallet,
  running,
  out,
  pass,
  lite,
  blocked,
  onNand,
  onRun,
}: {
  copy: Copy;
  wallet: WalletView;
  running: boolean;
  out: RelayOutput;
  pass: boolean;
  lite: boolean;
  blocked: boolean;
  onNand: (nand: number) => void;
  onRun: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [tapePhase, setTapePhase] = useState<Phase>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [tapeId, setTapeId] = useState<string | null>(null);
  const [error, setError] = useState<"rejected" | "failed" | "read" | "fee" | null>(null);
  const [books, setBooks] = useState<StationBooks | null>(null);
  const pads = diePads(out, pass, lite);
  const busy = phase === "confirm" || phase === "pending" || tapePhase === "confirm" || tapePhase === "pending";
  const holder = wallet.address ?? CONFIG.deployer;
  const relayGates = BigInt(relayNetlist().nand);

  useEffect(() => {
    let stop = false;
    setBooks(null);
    setError((current) => (current === "read" ? null : current));
    readStation(holder)
      .then((next) => {
        if (stop) return;
        setBooks(next);
        onNand(Number(next.nand));
      })
      .catch(() => {
        if (stop) return;
        setError("read");
        onNand(0);
      });
    return () => {
      stop = true;
    };
  }, [holder, onNand]);

  async function mint() {
    if (!books) return;
    if (!wallet.address) {
      wallet.connect();
      return;
    }
    const provider = pickProvider();
    if (!provider) {
      wallet.connect();
      return;
    }
    setError(null);
    setPhase("confirm");
    try {
      await ensureXLayer(provider);
      const fresh = await readStation(wallet.address);
      setBooks(fresh);
      const sent = await provider.request({
        method: "eth_sendTransaction",
        params: [mintTransaction(wallet.address, fresh.mintPrice, fresh.protocolFee)],
      });
      if (typeof sent !== "string" || !sent.startsWith("0x")) throw new Error("hash");
      setHash(sent);
      setPhase("pending");
      let ok: boolean | null = null;
      for (let i = 0; i < 30 && ok === null; i += 1) {
        ok = receiptOk(await provider.request({ method: "eth_getTransactionReceipt", params: [sent] }));
        if (ok === null) await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      if (ok !== true) {
        setPhase("fail");
        setError("failed");
        return;
      }
      const after = await readStation(wallet.address);
      setBooks(after);
      onNand(Number(after.nand));
      setPhase("done");
    } catch (caught) {
      setPhase("fail");
      setError(isUserRejected(caught) ? "rejected" : "failed");
    }
  }

  async function waitReceipt(provider: ReturnType<typeof pickProvider>, sent: string) {
    if (!provider) return false;
    for (let i = 0; i < 30; i += 1) {
      const receipt = await provider.request({ method: "eth_getTransactionReceipt", params: [sent] });
      const ok = receiptOk(receipt);
      if (ok === true) return receipt;
      if (ok === false) return false;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return false;
  }

  async function tape() {
    if (!books) return;
    if (!wallet.address) {
      wallet.connect();
      return;
    }
    const provider = pickProvider();
    if (!provider) {
      wallet.connect();
      return;
    }
    setError(null);
    setTapePhase("confirm");
    try {
      await ensureXLayer(provider);
      const fee = await readTapeFee();
      if (fee !== TAPEOUT_FEE) {
        setTapePhase("fail");
        setError("fee");
        return;
      }
      const fresh = await readStation(wallet.address);
      setBooks(fresh);
      const missing = relayGates - fresh.nand;
      if (missing > 0n) {
        const minted = await provider.request({
          method: "eth_sendTransaction",
          params: [mintTransaction(wallet.address, fresh.mintPrice, fresh.protocolFee, missing)],
        });
        if (typeof minted !== "string" || !minted.startsWith("0x")) throw new Error("hash");
        setHash(minted);
        setTapePhase("pending");
        if ((await waitReceipt(provider, minted)) === false) {
          setTapePhase("fail");
          setError("failed");
          return;
        }
      }
      const tx = relayTapeTransaction(wallet.address);
      const sent = await provider.request({
        method: "eth_sendTransaction",
        params: [{ from: tx.from, to: tx.to, value: tx.value, data: tx.data }],
      });
      if (typeof sent !== "string" || !sent.startsWith("0x")) throw new Error("hash");
      setHash(sent);
      setTapePhase("pending");
      const receipt = await waitReceipt(provider, sent);
      if (receipt === false) {
        setTapePhase("fail");
        setError("failed");
        return;
      }
      const id = circuitIdFromReceipt(receipt);
      setTapeId(id ? tapeLabel(id) : null);
      const after = await readStation(wallet.address);
      setBooks(after);
      onNand(Number(after.nand));
      setTapePhase("done");
    } catch (caught) {
      setTapePhase("fail");
      setError(isUserRejected(caught) ? "rejected" : "failed");
    }
  }

  const due = books ? mintValue(books.mintPrice, books.protocolFee) : null;

  return (
    <section className="min-w-0 rounded-panel border border-line bg-surface p-4 lg:col-span-2">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg">
          <Cpu className="size-4 text-copper" />
          {copy.foundry}
        </h2>
        <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted">
          <span className="okx-mark" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          {copy.okx}
        </p>
      </div>
      <p className="text-sm text-muted">{copy.foundryLead}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className={"die " + (running ? "die-live" : "")} aria-hidden>
          {pads.map((on, index) => (
            <span key={index} className={on ? "pad pad-on" : "pad"} />
          ))}
        </div>
        <div className="min-w-0">
          <p className="font-mono text-sm text-fg">
            {copy.stock} <span className="text-2xl text-copper">{books ? books.nand.toString() : "…"}</span>
            <span className="ml-3 text-muted">LATCH {books ? books.latch.toString() : "…"}</span>
          </p>
          <p className="mt-2 font-mono text-xs text-muted">
            {copy.mintedLabel} {books ? `${books.minted} / ${books.supply}` : "…"}
            <span className="mx-2">·</span>
            {copy.priceLabel} {books ? formatOkb(books.mintPrice) : "…"} OKB
            <span className="mx-2">·</span>
            {copy.feeLabel} {books ? formatOkb(books.protocolFee) : "…"} OKB
          </p>
          <p className="mt-1 font-mono text-xs text-fg">
            {copy.payLabel} {due ? formatOkb(due) : "…"} OKB
          </p>
          <p className="mt-1 text-sm text-muted">{copy.horns[out.action]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="tap min-h-11 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60" disabled={busy || !books} onClick={() => void mint()}>
              {phase === "confirm" ? copy.minting : phase === "pending" ? copy.mintWait : copy.mint}
            </button>
            <button type="button" className="tap min-h-11 rounded-full border border-line px-4 text-sm disabled:opacity-60" disabled={running || !books || books.nand < 1n} onClick={onRun}>
              {running ? copy.running : copy.run}
            </button>
          </div>
          {books && books.nand < 1n || blocked ? <p className="mt-3 text-sm text-fg">{copy.runNeed}</p> : null}
          {error === "read" ? <p className="mt-3 text-sm text-fg">{copy.readFail}</p> : null}
          {error === "fee" ? <p className="mt-3 text-sm text-fg">{copy.tapeRelayFee}</p> : null}
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-sm text-muted">{copy.tapeRelayLead}</p>
            <button type="button" className="tap mt-3 min-h-11 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60" disabled={busy || !books} onClick={() => void tape()}>
              {tapePhase === "confirm" ? copy.tapeRelayMint : tapePhase === "pending" ? copy.tapeRelayWait : copy.tapeRelay}
            </button>
            {tapePhase === "done" && tapeId ? <p className="mt-3 text-sm text-fg">{copy.tapeRelayOk} {tapeId}</p> : null}
          </div>
          {phase === "pending" ? <div className="scan mt-3" /> : null}
          {phase === "done" ? <p className="mt-3 text-sm text-fg">{copy.mintOk}</p> : null}
          {phase === "fail" ? <p className="mt-3 text-sm text-fg">{error === "rejected" ? copy.mintRejected : copy.mintFail}</p> : null}
          {hash ? (
            <a className="mt-2 block font-mono text-xs break-all text-copper" href={`https://www.oklink.com/xlayer/tx/${hash}`} target="_blank" rel="noreferrer">
              {hash}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
