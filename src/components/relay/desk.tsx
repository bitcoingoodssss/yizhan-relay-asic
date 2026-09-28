import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Cable, Cpu, ListChecks, Ticket, TrainFront } from "lucide-react";
import { CONFIG } from "@/config";
import { chainEvalReady } from "@/chain/status";
import { enumerateRelay, explainRelay } from "@/circuit/explain";
import { narrate } from "@/circuit/narrate";
import { evalRelay, RELAY_TRUTH_CASES } from "@/circuit/relay";
import { evalTicket } from "@/circuit/ticket";
import type { ModelTier, RelayInput, RelayOutput } from "@/circuit/types";
import { COPY, type Locale } from "@/i18n/copy";
import { runMobileProof, type ProofProgress } from "@/pow/mobileProof";
import { useWallet } from "./use-wallet";
import { WalletBar } from "./wallet-bar";

const STORAGE_KEY = "yizhan-relay-word";
const LANG_KEY = "yizhan-relay-lang";

const OPEN_LOCKED: RelayInput = RELAY_TRUTH_CASES[1]!.in;
const TIERS: ModelTier[] = [0, 1, 2];
const TIER_NET = ["lite", "std", "frontier"] as const;

const LEVERS = [
  { key: "paid", net: "paid" },
  { key: "burst", net: "burst" },
  { key: "risk", net: "risk" },
  { key: "ticketOk", net: "ticket_ok" },
] as const;

const LAMPS: Array<{ key: keyof Pick<RelayOutput, "allow" | "degrade" | "refuse" | "tierHi">; net: string }> = [
  { key: "allow", net: "allow" },
  { key: "degrade", net: "degrade" },
  { key: "refuse", net: "refuse" },
  { key: "tierHi", net: "tier_hi" },
];

const TRACKS: Array<{ id: RelayOutput["action"]; en: string }> = [
  { id: "lite", en: "LITE" },
  { id: "std", en: "STD" },
  { id: "frontier", en: "FRONTIER" },
  { id: "degraded", en: "DEGRADED" },
  { id: "refuse", en: "REFUSE" },
];

type ProofView =
  | { phase: "idle" }
  | ({ phase: "running" } & ProofProgress)
  | {
      phase: "done";
      nonce: number;
      hash: string;
      ok: boolean;
      elapsed: number;
      ticket: boolean;
    };

function sameWord(a: RelayInput, b: RelayInput): boolean {
  return a.model === b.model && a.paid === b.paid && a.burst === b.burst && a.risk === b.risk && a.ticketOk === b.ticketOk;
}

function bit(v: boolean): "1" | "0" {
  return v ? "1" : "0";
}

function parseWord(raw: string): RelayInput | null {
  try {
    const v = JSON.parse(raw) as Partial<RelayInput>;
    if (v.model !== 0 && v.model !== 1 && v.model !== 2) return null;
    if (typeof v.paid !== "boolean" || typeof v.burst !== "boolean") return null;
    if (typeof v.risk !== "boolean" || typeof v.ticketOk !== "boolean") return null;
    return { model: v.model, paid: v.paid, burst: v.burst, risk: v.risk, ticketOk: v.ticketOk };
  } catch {
    return null;
  }
}

export function RelayDesk() {
  const [input, setInput] = useState<RelayInput>(OPEN_LOCKED);
  const [locale, setLocale] = useState<Locale>("zh");
  const [ready, setReady] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [proof, setProof] = useState<ProofView>({ phase: "idle" });
  const playRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const copy = COPY[locale];
  const wallet = useWallet();

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang === "en" || savedLang === "zh") setLocale(savedLang);
    const saved = parseWord(localStorage.getItem(STORAGE_KEY) ?? "");
    if (saved) setInput(saved);
    setReady(true);
    return () => {
      if (playRef.current != null) window.clearInterval(playRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    localStorage.setItem(LANG_KEY, locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [input, locale, ready]);

  const out = evalRelay(input);
  const explained = explainRelay(input);
  const line = copy.narration[narrate(input, out)];
  const chain = chainEvalReady();
  const rows = useMemo(() => (showAll ? enumerateRelay() : []), [showAll]);

  function stopPlay() {
    if (playRef.current != null) {
      window.clearInterval(playRef.current);
      playRef.current = null;
    }
    setPlaying(false);
  }

  function apply(next: RelayInput) {
    stopPlay();
    setInput(next);
  }

  function playSpec() {
    stopPlay();
    let step = 0;
    setPlaying(true);
    setInput(RELAY_TRUTH_CASES[0]!.in);
    playRef.current = window.setInterval(() => {
      step += 1;
      if (step >= RELAY_TRUTH_CASES.length) {
        stopPlay();
        return;
      }
      setInput(RELAY_TRUTH_CASES[step]!.in);
    }, 900);
  }

  async function startProof() {
    stopPlay();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const started = Date.now();
    setProof({ phase: "running", nonce: 0, hash: "", elapsed: 0 });
    const result = await runMobileProof("yizhan", {
      signal: controller.signal,
      onProgress: (progress) => {
        if (!controller.signal.aborted) setProof({ phase: "running", ...progress });
      },
    });
    if (controller.signal.aborted) return;
    const ticket = evalTicket({ ok: result.ok, mobile: true });
    setInput((word) => ({ ...word, ticketOk: ticket.valid }));
    setProof({
      phase: "done",
      nonce: result.nonce,
      hash: result.hash,
      ok: result.ok,
      elapsed: Date.now() - started,
      ticket: ticket.valid,
    });
  }

  function stopProof() {
    abortRef.current?.abort();
    setProof({ phase: "idle" });
  }

  return (
    <div className="min-h-screen text-fg">
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-panel border border-copper text-lg text-copper" aria-hidden>
            驿
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-widest text-copper">YIZHAN RELAY · CHAIN 196</p>
            <h1 className="text-2xl leading-tight sm:text-3xl">{copy.title}</h1>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
            <div role="group" aria-label={copy.langSwitch} className="flex overflow-hidden rounded-full border border-line">
              {(["zh", "en"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={locale === id}
                  className={"tap min-h-11 border-l border-line px-3 text-sm first:border-l-0 " + (locale === id ? "bg-copper text-ink" : "bg-bg text-muted")}
                  onClick={() => setLocale(id)}
                >
                  {id === "zh" ? "中文" : "EN"}
                </button>
              ))}
            </div>
            <p className="hidden text-right font-mono text-xs text-muted sm:block">
              {CONFIG.symbol} · {CONFIG.supply}
              <span className="mt-1 block">{CONFIG.chainName}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-surface">
        <p className="mx-auto max-w-5xl px-4 py-3 text-sm text-muted">{copy.lead}</p>
      </div>
      <WalletBar copy={copy} wallet={wallet} />

      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-4 lg:grid-cols-2">
        <section className="min-w-0 rounded-panel border border-line bg-surface p-4 max-lg:order-2">
          <PanelHead icon={<Cpu className="size-4 text-copper" />} title={copy.request} en="REQUEST" />
          <div role="radiogroup" aria-label={copy.modelGroup} className="grid grid-cols-3 overflow-hidden rounded-full border border-line">
            {TIERS.map((tier) => {
              const on = input.model === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={
                    "tap min-h-12 border-l border-line px-2 first:border-l-0 " +
                    (on ? "bg-copper text-ink" : "bg-bg text-muted")
                  }
                  onClick={() => apply({ ...input, model: tier })}
                >
                  <span className="block text-sm">{copy.models[tier]}</span>
                  <span className={"block font-mono text-xs " + (on ? "text-ink" : "text-muted")}>{TIER_NET[tier]}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2">
            {LEVERS.map((lever) => {
              const on = input[lever.key];
              return (
                <button
                  key={lever.key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  className="tap flex min-h-12 items-center justify-between gap-3 rounded-panel border border-line bg-bg px-3 py-2 text-left hover:border-copper"
                  onClick={() => apply({ ...input, [lever.key]: !on } as RelayInput)}
                >
                  <span className="min-w-0">
                    <span className="block text-sm">{copy.levers[lever.key].label}</span>
                    <span className="block font-mono text-xs text-muted">
                      {lever.net} · {copy.levers[lever.key].detail}
                    </span>
                  </span>
                  <span className={"lever " + (on ? "lever-on" : "")} aria-hidden>
                    <span className="lever-knob" />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <h3 className="font-mono text-xs tracking-widest text-muted">{copy.walk}</h3>
            <button type="button" className="tap min-h-11 rounded-full border border-line px-3 text-sm text-fg" onClick={playing ? stopPlay : playSpec}>
              {playing ? copy.stop : copy.walkPlay}
            </button>
          </div>
          <div className="mt-2 min-w-0 overflow-x-auto">
            <div className="flex w-max gap-2 pb-1">
              {RELAY_TRUTH_CASES.map((item) => {
                const active = sameWord(input, item.in);
                return (
                  <button
                    key={item.note}
                    type="button"
                    title={item.note}
                    className={
                      "tap min-h-11 shrink-0 rounded-full border px-3 text-sm " +
                      (active ? "border-copper bg-surface-2 text-fg" : "border-line bg-bg text-muted")
                    }
                    onClick={() => apply(item.in)}
                  >
                    {copy.cases[item.note as keyof typeof copy.cases] ?? item.note}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-panel border border-line bg-surface p-4 max-lg:order-1" aria-live="polite">
          <PanelHead icon={<TrainFront className="size-4 text-copper" />} title={copy.route} en="ROUTE" />
          <div className="grid grid-cols-4 gap-2">
            {LAMPS.map((lamp) => {
              const on = out[lamp.key];
              return (
                <div key={lamp.key} className="flex flex-col items-center gap-2">
                  <div
                    className={"lamp " + (on ? "lamp-on" : "")}
                    data-lamp={lamp.key}
                    role="status"
                    aria-label={`${lamp.net} ${on ? copy.hi : copy.lo}`}
                  />
                  <span className="w-full text-center font-mono text-xs break-all text-fg">{lamp.net}</span>
                  <span className="text-center text-xs text-muted">
                    {on ? copy.hi : copy.lo} · {copy.lamps[lamp.key]}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="stamp mt-4 text-3xl leading-none" data-action={out.action}>
            {copy.actions[out.action]}
          </p>
          <p className="mt-1 font-mono text-sm text-muted">{out.action}</p>
          <p className="mt-3 text-sm text-fg">{line}</p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 rounded-panel bg-bg px-3 py-3 font-mono text-xs tabular-nums text-fg">
            <span>
              <span className="text-muted">REQ </span>
              M{input.model} P{bit(input.paid)} B{bit(input.burst)} R{bit(input.risk)} T{bit(input.ticketOk)}
            </span>
            <span>
              <span className="text-muted">ROUTE </span>
              A{bit(out.allow)} D{bit(out.degrade)} R{bit(out.refuse)} H{bit(out.tierHi)}
            </span>
            <span className="text-copper">{out.action}</span>
          </div>
        </section>

        <section className="rounded-panel border border-line bg-surface p-4 lg:col-span-2">
          <PanelHead icon={<TrainFront className="size-4 text-copper" />} title={copy.tracks} en="TRACKS" />
          <ul>
            {TRACKS.map((track) => {
              const on = out.action === track.id;
              return (
                <li key={track.id} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
                  <span className="w-20 shrink-0">
                    <span className={"block text-sm " + (on ? "text-fg" : "text-muted")}>{copy.trackNames[track.id]}</span>
                    <span className="font-mono text-xs text-muted">{track.en}</span>
                  </span>
                  <span className="relative h-px flex-1 bg-line" aria-hidden>
                    <span
                      className={"bead absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 " + (on ? "bead-on" : "")}
                      data-track={track.id}
                    />
                  </span>
                  <span className={"hidden max-w-64 shrink-0 text-right text-xs sm:block " + (on ? "text-fg" : "text-muted")}>
                    {copy.trackNotes[track.id]}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted sm:hidden">{copy.trackNotes[out.action]}</p>
        </section>

        <section className="rounded-panel border border-line bg-surface p-4 lg:col-span-2">
          <PanelHead icon={<Cpu className="size-4 text-copper" />} title={copy.netlist} en="NETLIST" />
          <p className="mb-3 text-sm text-muted">{copy.netlistLead}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Gate
              name="pass"
              formula="paid ∨ lite ∨ ticket_ok"
              hot={explained.pass}
              tone="go"
              inputs={[
                ["paid", input.paid],
                ["lite", explained.lite],
                ["ticket_ok", input.ticketOk],
              ]}
            />
            <Gate
              name="allow"
              formula="¬risk ∧ pass"
              hot={out.allow}
              tone="go"
              inputs={[
                ["¬risk", explained.riskClear],
                ["pass", explained.pass],
              ]}
            />
            <Gate
              name="degrade"
              formula="allow ∧ burst ∧ ¬lite"
              hot={out.degrade}
              tone="warn"
              inputs={[
                ["allow", out.allow],
                ["burst", input.burst],
                ["¬lite", explained.notLite],
              ]}
            />
            <Gate name="refuse" formula="¬allow" hot={out.refuse} tone="stop" inputs={[["allow", out.allow]]} />
            <Gate
              name="tier_hi"
              formula="allow ∧ ¬degrade ∧ frontier"
              hot={out.tierHi}
              tone="go"
              inputs={[
                ["allow", out.allow],
                ["¬degrade", !out.degrade],
                ["frontier", explained.frontier],
              ]}
            />
            <div className="rounded-panel border border-line bg-bg p-3">
              <p className="font-mono text-xs text-copper">{copy.priority}</p>
              <ol className="mt-2 grid gap-1 text-sm text-fg">
                {copy.priorityLines.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="rounded-panel border border-line bg-surface p-4">
          <PanelHead icon={<ListChecks className="size-4 text-copper" />} title={copy.truth} en="TRUTH" />
          <p className="text-sm text-muted">{copy.truthLead}</p>
          <ul className="mt-3 grid gap-2">
            {RELAY_TRUTH_CASES.map((item) => {
              const row = evalRelay(item.in);
              const active = sameWord(input, item.in);
              return (
                <li key={item.note}>
                  <button
                    type="button"
                    className={
                      "tap w-full rounded-panel border px-3 py-2 text-left " +
                      (active ? "border-copper bg-surface-2" : "border-line bg-bg")
                    }
                    onClick={() => apply(item.in)}
                  >
                    <span className="block text-sm">{copy.cases[item.note as keyof typeof copy.cases] ?? item.note}</span>
                    <span className="mt-1 block font-mono text-xs text-muted">
                      M{item.in.model} P{bit(item.in.paid)} B{bit(item.in.burst)} R{bit(item.in.risk)} T{bit(item.in.ticketOk)} → {row.action}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="tap mt-3 min-h-11 rounded-full border border-line px-3 text-sm"
            aria-expanded={showAll}
            onClick={() => setShowAll((open) => !open)}
          >
            {showAll ? copy.hideAll : copy.showAll}
          </button>
          {showAll ? (
            <ul className="mt-3 max-h-80 overflow-y-auto rounded-panel border border-line">
              {rows.map((row) => {
                const active = sameWord(input, row.in);
                return (
                  <li key={`${row.in.model}${bit(row.in.paid)}${bit(row.in.burst)}${bit(row.in.risk)}${bit(row.in.ticketOk)}`}>
                    <button
                      type="button"
                      className={
                        "tap flex min-h-11 w-full items-center justify-between gap-3 border-b border-line px-3 text-left font-mono text-xs last:border-b-0 " +
                        (active ? "bg-surface-2 text-fg" : "text-muted")
                      }
                      onClick={() => apply(row.in)}
                    >
                      <span>
                        M{row.in.model} P{bit(row.in.paid)} B{bit(row.in.burst)} R{bit(row.in.risk)} T{bit(row.in.ticketOk)}
                      </span>
                      <span className={active ? "text-copper" : ""}>{row.out.action}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <section className="rounded-panel border border-line bg-surface p-4">
          <PanelHead icon={<Ticket className="size-4 text-copper" />} title={copy.ticket} en="TICKET" />
          <p className="text-sm text-muted">{copy.ticketLead}</p>
          <p className="mt-2 font-mono text-xs text-muted">valid = ok ∧ mobile</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="tap min-h-12 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60"
              disabled={proof.phase === "running"}
              onClick={() => void startProof()}
            >
              {proof.phase === "running" ? copy.proofRunning : copy.proofStart}
            </button>
            {proof.phase === "running" ? (
              <button type="button" className="tap min-h-12 rounded-full border border-line px-4 text-sm" onClick={stopProof}>
                {copy.stop}
              </button>
            ) : null}
          </div>
          {proof.phase === "running" ? (
            <div className="mt-3">
              <div className="scan" />
              <p className="mt-2 font-mono text-xs tabular-nums text-muted">
                nonce {proof.nonce} · {proof.elapsed} ms
              </p>
            </div>
          ) : null}
          {proof.phase === "done" ? (
            <div className="mt-3 rounded-panel bg-bg p-3 font-mono text-xs break-all text-fg">
              <p>{proof.ticket ? copy.proofOk : copy.proofFail}</p>
              <p className="mt-2 text-muted">
                nonce {proof.nonce} · {proof.elapsed} ms · ok {String(proof.ok)} · ticket {String(proof.ticket)}
              </p>
              <p className="mt-2 text-muted">{proof.hash || "—"}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-panel border border-line bg-surface p-4 lg:col-span-2">
          <PanelHead icon={<Cable className="size-4 text-copper" />} title={copy.plaque} en="TAPE-OUT" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Fact
              label={copy.walletFact}
              value={wallet.address ?? "—"}
              note={wallet.address ? (wallet.onXLayer ? `X Layer · ${wallet.okb ?? "—"} OKB` : copy.wrongChain) : copy.walletFactNote}
            />
            <Fact label="Processor" value={CONFIG.processor} note={copy.processorNote} />
            <Fact label="Deployer" value={CONFIG.deployer} note={copy.deployerNote} />
            <Fact label="Relay circuit" value={CONFIG.relayCircuitId || "—"} />
            <Fact label="Tape-out tx" value={CONFIG.relayTx || "—"} />
            <Fact label="Ticket circuit" value={CONFIG.ticketCircuitId || "—"} />
            <Fact label="Unit price" value={CONFIG.unitPriceLabel === "set after deploy" ? copy.pricePending : CONFIG.unitPriceLabel} />
          </div>
          <p className="mt-3 text-sm text-fg">{chain.status === "unconfigured" ? copy.chainPending : copy.chainTodo}</p>
          <p className="mt-2 text-sm text-muted">{copy.disclaimer}</p>
          <p className="mt-3 font-mono text-xs text-muted">{copy.motto}</p>
        </section>
      </main>
    </div>
  );
}

function PanelHead({ icon, title, en }: { icon: ReactNode; title: string; en: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg">
        {icon}
        {title}
      </h2>
      <span className="font-mono text-xs tracking-widest text-muted">{en}</span>
    </div>
  );
}

function Gate({
  name,
  formula,
  hot,
  tone,
  inputs,
}: {
  name: string;
  formula: string;
  hot: boolean;
  tone: "go" | "warn" | "stop";
  inputs: Array<[string, boolean]>;
}) {
  const edge = !hot ? "border-line" : tone === "warn" ? "border-amber" : tone === "stop" ? "border-signal" : "border-phosphor";
  const ink = !hot ? "text-muted" : tone === "warn" ? "text-amber" : tone === "stop" ? "text-signal" : "text-phosphor";
  return (
    <div className={"rounded-panel border bg-bg p-3 " + edge}>
      <div className="flex flex-wrap gap-1.5">
        {inputs.map(([label, on]) => (
          <span
            key={label}
            className={
              "rounded-full border px-2 py-1 font-mono text-xs " +
              (on ? "border-phosphor bg-phosphor-dim text-phosphor" : "border-line text-muted")
            }
          >
            {label}
          </span>
        ))}
      </div>
      <p className="mt-2 font-mono text-xs text-muted">{formula}</p>
      <p className={"mt-2 font-mono text-sm " + ink}>
        {name} = {hot ? "1" : "0"}
      </p>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm break-all text-fg">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}
