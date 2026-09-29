import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONFIG } from "@/config";
import { chainEvalReady } from "@/chain/status";
import { enumerateRelay, explainRelay } from "@/circuit/explain";
import { narrate } from "@/circuit/narrate";
import { evalRelay, RELAY_TRUTH_CASES } from "@/circuit/relay";
import { evalTicket } from "@/circuit/ticket";
import type { ModelTier, RelayInput, RelayOutput } from "@/circuit/types";
import { COPY, type Locale } from "@/i18n/copy";
import { runMobileProof, type ProofProgress } from "@/pow/mobileProof";
import { playHorn, setHornMuted, unlockHorn } from "@/audio/whistle";
import { Foundry } from "./foundry";
import { useTheme } from "./use-theme";
import { useWallet } from "./use-wallet";
import { VehiclePanel } from "./vehicle";
import { WalletBar } from "./wallet-bar";

const STORAGE_KEY = "yizhan-relay-word";
const LANG_KEY = "yizhan-relay-lang";
const SOUND_KEY = "yizhan-sound";

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

const TABS = ["net", "truth", "ticket", "wafer", "plate"] as const;
type TabId = (typeof TABS)[number];

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
  const [nand, setNand] = useState(CONFIG.heldNand);
  const [blocked, setBlocked] = useState(false);
  const [sound, setSound] = useState(true);
  const [tab, setTab] = useState<TabId>("net");
  const [source, setSource] = useState<"hand" | "road" | "car">("hand");
  const playRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const heardRef = useRef<string | null>(null);
  const copy = COPY[locale];
  const wallet = useWallet();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang === "en" || savedLang === "zh") setLocale(savedLang);
    const saved = parseWord(localStorage.getItem(STORAGE_KEY) ?? "");
    if (saved) setInput(saved);
    if (localStorage.getItem(SOUND_KEY) === "off") setSound(false);
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
    localStorage.setItem(SOUND_KEY, sound ? "on" : "off");
    setHornMuted(!sound);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [input, locale, ready, sound]);

  const out = evalRelay(input);
  const explained = explainRelay(input);
  const line = copy.narration[narrate(input, out)];
  const chain = chainEvalReady();
  const rows = useMemo(() => (showAll ? enumerateRelay() : []), [showAll]);

  useEffect(() => {
    if (!ready) return;
    if (heardRef.current === null) {
      heardRef.current = out.action;
      return;
    }
    if (heardRef.current === out.action) return;
    heardRef.current = out.action;
    playHorn(out.action);
  }, [out.action, ready]);

  function stopPlay() {
    if (playRef.current != null) {
      window.clearInterval(playRef.current);
      playRef.current = null;
    }
    setPlaying(false);
  }

  function apply(next: RelayInput, keepCar = false) {
    stopPlay();
    if (!keepCar) setSource("hand");
    setInput(next);
  }

  const pushVehicle = useCallback((word: RelayInput) => {
    if (playRef.current != null) {
      window.clearInterval(playRef.current);
      playRef.current = null;
    }
    setPlaying(false);
    setInput(word);
  }, []);

  const reportNand = useCallback((next: number) => setNand(next), []);

  function playSpec() {
    if (nand < 1) {
      setBlocked(true);
      setTab("wafer");
      return;
    }
    setBlocked(false);
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

  const tabLabel: Record<TabId, string> = {
    net: copy.netlist,
    truth: copy.truth,
    ticket: copy.ticket,
    wafer: copy.foundry,
    plate: copy.plaque,
  };

  return (
    <div className="min-h-screen bg-bg text-fg" onPointerDown={unlockHorn}>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
          <img src={`${import.meta.env.BASE_URL}yizhan-seal.webp`} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0">
            <h1 className="truncate text-base leading-tight">{copy.title}</h1>
            <p className="font-mono text-xs text-muted">X Layer · {CONFIG.relayCircuitId}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <div className="flex h-10 overflow-hidden rounded-full border border-line bg-surface">
              {(["zh", "en"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={locale === id}
                  aria-label={copy.langSwitch}
                  className={
                    "tap grid min-w-11 place-items-center px-3 text-xs " +
                    (locale === id ? "bg-copper text-ink" : "text-muted")
                  }
                  onClick={() => setLocale(id)}
                >
                  {id === "zh" ? "中文" : "EN"}
                </button>
              ))}
            </div>
            <div className="flex h-10 overflow-hidden rounded-full border border-line bg-surface">
              {(["night", "day"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={theme === id}
                  aria-label={id === "day" ? copy.day : copy.night}
                  className={"tap grid size-10 place-items-center " + (theme === id ? "bg-copper text-ink" : "text-muted")}
                  onClick={() => setTheme(id)}
                >
                  {id === "day" ? <SunMark /> : <MoonMark />}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={sound}
                aria-label={copy.sound}
                className={"tap grid size-10 place-items-center border-l border-line " + (sound ? "text-fg" : "text-muted")}
                onClick={() => {
                  const next = !sound;
                  setSound(next);
                  setHornMuted(!next);
                  if (next) {
                    unlockHorn();
                    playHorn(out.action);
                  }
                }}
              >
                <SoundMark on={sound} />
              </button>
            </div>
            <WalletBar copy={copy} wallet={wallet} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <VehiclePanel
          copy={copy.vehicle}
          source={source}
          paid={input.paid}
          ticketOk={input.ticketOk}
          requested={input.model}
          onSource={setSource}
          onWord={pushVehicle}
        />
        <section className="mt-4 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <article className="flex flex-col rounded-panel border border-line bg-surface p-5" aria-live="polite">
            <p className="font-mono text-xs tracking-widest text-muted">{copy.route}</p>
            <h2 className="stamp mt-3 text-4xl leading-none sm:text-5xl" data-action={out.action}>
              {copy.actions[out.action]}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{line}</p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LAMPS.map((lamp) => {
                const on = out[lamp.key];
                return (
                  <div key={lamp.key} className="rounded-panel border border-line bg-bg px-3 py-2.5" role="status">
                    <div className="flex items-center gap-2">
                      <span className={"lamp " + (on ? "lamp-on" : "")} data-lamp={lamp.key} aria-hidden />
                      <span className="font-mono text-xs text-muted">{lamp.net}</span>
                    </div>
                    <p className="mt-2 text-sm">
                      {copy.lamps[lamp.key]}
                      <span className="ml-1 font-mono text-xs text-muted">{on ? copy.hi : copy.lo}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 font-mono text-xs tabular-nums text-muted">
              M{input.model} P{bit(input.paid)} B{bit(input.burst)} R{bit(input.risk)} T{bit(input.ticketOk)}
              <span className="mx-2 text-line">/</span>
              A{bit(out.allow)} D{bit(out.degrade)} R{bit(out.refuse)} H{bit(out.tierHi)}
              <span className="ml-2 text-copper">{out.action}</span>
            </p>
          </article>

          <article className="rounded-panel border border-line bg-surface p-5">
            <p className="font-mono text-xs tracking-widest text-muted">{copy.request}</p>
            <div role="radiogroup" aria-label={copy.modelGroup} className="mt-3 grid grid-cols-3 overflow-hidden rounded-full border border-line">
              {TIERS.map((tier) => {
                const on = input.model === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={
                      "tap min-h-12 border-l border-line px-2 first:border-l-0 " + (on ? "bg-copper text-ink" : "bg-bg text-muted")
                    }
                    onClick={() => apply({ ...input, model: tier }, source === "car")}
                  >
                    <span className="block text-sm">{copy.models[tier]}</span>
                    <span className={"block font-mono text-xs " + (on ? "text-ink" : "text-muted")}>{TIER_NET[tier]}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LEVERS.map((lever) => {
                const on = input[lever.key];
                return (
                  <button
                    key={lever.key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    title={copy.levers[lever.key].detail}
                    className="tap flex min-h-12 items-center justify-between gap-2 rounded-panel border border-line bg-bg px-3 text-left"
                    onClick={() =>
                      apply(
                        { ...input, [lever.key]: !on } as RelayInput,
                        source === "car" && (lever.key === "paid" || lever.key === "ticketOk"),
                      )
                    }
                  >
                    <span className="min-w-0">
                      <span className="block text-sm">{copy.levers[lever.key].label}</span>
                      <span className="block font-mono text-xs text-muted">{lever.net}</span>
                    </span>
                    <span className={"lever " + (on ? "lever-on" : "")} aria-hidden>
                      <span className="lever-knob" />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-muted">{copy.walk}</p>
              <button
                type="button"
                className="tap min-h-10 rounded-full bg-copper px-4 text-sm text-ink"
                onClick={playing ? stopPlay : playSpec}
              >
                {playing ? copy.stop : copy.walkPlay}
              </button>
            </div>
          </article>
        </section>

        <section className="mt-4" aria-label={copy.tracks}>
          <ul className="grid grid-cols-5 gap-2">
            {TRACKS.map((track) => {
              const on = out.action === track.id;
              return (
                <li key={track.id}>
                  <div
                    className={
                      "flex min-h-16 flex-col justify-between rounded-panel border px-2 py-2 sm:px-3 " +
                      (on ? "border-copper bg-surface" : "border-line bg-surface/60")
                    }
                  >
                    <span className={"bead " + (on ? "bead-on" : "")} data-track={track.id} aria-hidden />
                    <span className={"mt-2 text-xs sm:text-sm " + (on ? "text-fg" : "text-muted")}>{copy.trackNames[track.id]}</span>
                    <span className="font-mono text-xs tracking-wide text-muted">{track.en}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm text-muted">
            {copy.trackNotes[out.action]}
            <span className="mx-2 text-line">·</span>
            {copy.horns[out.action]}
          </p>
        </section>

        <div className="mt-6">
          <div role="tablist" aria-label={copy.plaque} className="flex gap-1 overflow-x-auto border-b border-line">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={
                  "tap shrink-0 border-b-2 px-3 py-2.5 text-sm " +
                  (tab === id ? "border-copper text-fg" : "border-transparent text-muted")
                }
                onClick={() => setTab(id)}
              >
                {tabLabel[id]}
              </button>
            ))}
          </div>

          {tab === "net" ? (
            <section className="py-4" role="tabpanel">
              <p className="max-w-2xl text-sm text-muted">{copy.netlistLead}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="rounded-panel border border-line bg-surface p-3">
                  <p className="font-mono text-xs text-copper">{copy.priority}</p>
                  <ol className="mt-2 grid gap-1 text-sm">
                    {copy.priorityLines.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "truth" ? (
            <section className="py-4" role="tabpanel">
              <p className="max-w-2xl text-sm text-muted">{copy.truthLead}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {RELAY_TRUTH_CASES.map((item) => {
                  const row = evalRelay(item.in);
                  const active = sameWord(input, item.in);
                  return (
                    <li key={item.note}>
                      <button
                        type="button"
                        className={
                          "tap w-full rounded-panel border px-3 py-2.5 text-left " +
                          (active ? "border-copper bg-surface" : "border-line bg-bg")
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
                className="tap mt-3 min-h-10 rounded-full border border-line px-3 text-sm"
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
                            (active ? "bg-surface text-fg" : "text-muted")
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
          ) : null}

          {tab === "ticket" ? (
            <section className="max-w-xl py-4" role="tabpanel">
              <p className="text-sm leading-relaxed text-muted">{copy.ticketLead}</p>
              <p className="mt-2 font-mono text-xs text-muted">valid = ok ∧ mobile</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tap min-h-11 rounded-full bg-copper px-4 text-sm text-ink disabled:opacity-60"
                  disabled={proof.phase === "running"}
                  onClick={() => void startProof()}
                >
                  {proof.phase === "running" ? copy.proofRunning : copy.proofStart}
                </button>
                {proof.phase === "running" ? (
                  <button type="button" className="tap min-h-11 rounded-full border border-line px-4 text-sm" onClick={stopProof}>
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
                <div className="mt-3 rounded-panel border border-line bg-surface p-3 font-mono text-xs break-all">
                  <p>{proof.ticket ? copy.proofOk : copy.proofFail}</p>
                  <p className="mt-2 text-muted">
                    nonce {proof.nonce} · {proof.elapsed} ms · ok {String(proof.ok)} · ticket {String(proof.ticket)}
                  </p>
                  <p className="mt-2 text-muted">{proof.hash || "—"}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === "wafer" ? (
            <div className="py-4" role="tabpanel">
              <Foundry
                copy={copy}
                wallet={wallet}
                running={playing}
                out={out}
                pass={explained.pass}
                lite={explained.lite}
                blocked={blocked}
                onNand={reportNand}
                onRun={playSpec}
              />
            </div>
          ) : null}

          {tab === "plate" ? (
            <section className="py-4" role="tabpanel">
              <p className="max-w-2xl text-sm text-muted">{chain.status === "unconfigured" ? copy.chainPending : copy.chainTodo}</p>
              <div className="mt-4 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2">
                <Fact label="Processor" value={CONFIG.processor} note={copy.processorNote} />
                <Fact label="Relay" value={CONFIG.relayCircuitId} note="6 in / 4 out / 27 NAND" />
                <Fact label="Deployer" value={CONFIG.deployer} note={copy.deployerNote} />
                <Fact
                  label="Minted"
                  value={`${CONFIG.minted} / ${CONFIG.supply}`}
                  note={`NAND ${CONFIG.heldNand} · LATCH ${CONFIG.heldLatch}`}
                />
                <Fact label="Create tx" value={CONFIG.processorTx} />
                <Fact label="Relay tx" value={CONFIG.relayTx} />
                <Fact label="Sample" value={CONFIG.sampleCircuitId} note="100 + 50 = 150" />
                <Fact label="NAND gate" value={CONFIG.nandCircuitId} note="2 in / 1 out" />
              </div>
              <ul className="mt-4 grid gap-1 text-sm text-muted">
                <li>{copy.gateScene}</li>
                <li>{copy.gateDemo}</li>
                <li>{copy.gateProcessor}</li>
                <li>{copy.gateTape}</li>
              </ul>
              <a
                className="tap mt-4 inline-flex min-h-11 items-center rounded-full bg-copper px-4 text-sm text-ink"
                href={CONFIG.tapeoutProcessorUrl}
                target="_blank"
                rel="noreferrer"
              >
                {copy.tapeout}
              </a>
              <p className="mt-4 text-sm text-muted">{copy.disclaimer}</p>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function MoonMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M15.2 3.1a8.4 8.4 0 1 0 6.2 13.4A7.2 7.2 0 0 1 15.2 3.1z" />
    </svg>
  );
}

function SunMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <circle cx="12" cy="12" r="3.4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
      </g>
    </svg>
  );
}

function SoundMark({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M4 9.5h3.2L11 6.2v11.6L7.2 14.5H4z" />
      {on ? (
        <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M14.2 9.2a3.6 3.6 0 0 1 0 5.6M16.6 7a6.4 6.4 0 0 1 0 10" />
      ) : (
        <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M15 9.5l5 5M20 9.5l-5 5" />
      )}
    </svg>
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
    <div className={"rounded-panel border bg-surface p-3 " + edge}>
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
    <div className="bg-bg px-3 py-3">
      <p className="font-mono text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm break-all">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}
