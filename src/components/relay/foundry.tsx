import { useState } from "react";
import { Cpu } from "lucide-react";
import { MINT_BATCH, mintTransaction, receiptOk } from "@/chain/mint";
import { ensureXLayer, isUserRejected, pickProvider } from "@/chain/wallet";
import { diePads } from "@/circuit/die";
import type { RelayOutput } from "@/circuit/types";
import type { Copy } from "@/i18n/copy";
import type { WalletView } from "./use-wallet";

type Phase = "idle" | "confirm" | "pending" | "done" | "fail";

export function Foundry({
  copy,
  wallet,
  stock,
  running,
  out,
  pass,
  lite,
  blocked,
  onMinted,
  onRun,
}: {
  copy: Copy;
  wallet: WalletView;
  stock: number;
  running: boolean;
  out: RelayOutput;
  pass: boolean;
  lite: boolean;
  blocked: boolean;
  onMinted: (batch: number) => void;
  onRun: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<"rejected" | "failed" | null>(null);
  const pads = diePads(out, pass, lite);
  const busy = phase === "confirm" || phase === "pending";

  async function mint() {
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
      const sent = await provider.request({ method: "eth_sendTransaction", params: [mintTransaction(wallet.address)] });
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
      onMinted(MINT_BATCH);
      setPhase("done");
    } catch (caught) {
      setPhase("fail");
      setError(isUserRejected(caught) ? "rejected" : "failed");
    }
  }

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
            {copy.stock} <span className="text-2xl text-copper">{stock}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{copy.horns[out.action]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="tap min-h-11 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60" disabled={busy} onClick={() => void mint()}>
              {phase === "confirm" ? copy.minting : phase === "pending" ? copy.mintWait : copy.mint}
            </button>
            <button type="button" className="tap min-h-11 rounded-full border border-line px-4 text-sm disabled:opacity-60" disabled={running || stock < 1} onClick={onRun}>
              {running ? copy.running : copy.run}
            </button>
          </div>
          {stock < 1 || blocked ? <p className="mt-3 text-sm text-fg">{copy.runNeed}</p> : null}
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
