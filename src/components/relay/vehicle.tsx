import { useEffect, useRef, useState } from "react";
import type { ModelTier, RelayInput } from "@/circuit/types";
import type { Copy } from "@/i18n/copy";
import { RISK_ACCEL, ROAD_MS, ROAD_TEST, frameAt, senseToRelay, type RoadScene, type VehicleSense } from "@/vehicle/map";

type Source = "hand" | "road" | "car";

const SCENES: RoadScene[] = ["park", "city", "highway", "jam", "hazard", "recover"];

export function VehiclePanel({
  copy,
  source,
  paid,
  ticketOk,
  requested,
  onSource,
  onWord,
}: {
  copy: Copy["vehicle"];
  source: Source;
  paid: boolean;
  ticketOk: boolean;
  requested: ModelTier;
  onSource: (next: Source) => void;
  onWord: (word: RelayInput) => void;
}) {
  const [roadRun, setRoadRun] = useState(false);
  const [runId, setRunId] = useState(0);
  const [sense, setSense] = useState<VehicleSense>(ROAD_TEST[0]!.sense);
  const [scene, setScene] = useState<RoadScene>("park");
  const [carNote, setCarNote] = useState<"idle" | "live" | "denied">("idle");
  const paidRef = useRef(paid);
  const ticketRef = useRef(ticketOk);
  const requestedRef = useRef(requested);
  paidRef.current = paid;
  ticketRef.current = ticketOk;
  requestedRef.current = requested;

  useEffect(() => {
    if (source !== "road" || !roadRun) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const frame = frameAt(elapsed);
      setScene(frame.scene);
      setSense(frame.sense);
      onWord(senseToRelay(frame.sense));
      if (elapsed >= ROAD_MS) setRoadRun(false);
    }, 200);
    return () => window.clearInterval(id);
  }, [source, roadRun, runId, onWord]);

  useEffect(() => {
    if (source !== "car") return;
    let stop = false;
    let speed: number | null = null;
    let accel = 0;
    let yaw = 0;
    let riskUntil = 0;
    const watch = navigator.geolocation?.watchPosition?.(
      (pos) => {
        const meters = pos.coords.speed;
        speed = meters == null || Number.isNaN(meters) ? null : meters * 3.6;
      },
      () => {
        speed = null;
      },
      { enableHighAccuracy: true, maximumAge: 1000 },
    );
    const onMotion = (event: DeviceMotionEvent) => {
      const linear = event.acceleration;
      const gravity = event.accelerationIncludingGravity;
      let mag = 0;
      if (linear && linear.x != null && linear.y != null) mag = Math.hypot(linear.x, linear.y, linear.z ?? 0);
      else if (gravity && gravity.x != null && gravity.y != null) {
        mag = Math.abs(Math.hypot(gravity.x, gravity.y, gravity.z ?? 0) - 9.81);
      }
      const rate = event.rotationRate;
      const nextYaw = rate?.alpha == null ? 0 : Math.abs(rate.alpha) * (Math.PI / 180);
      accel = mag;
      yaw = nextYaw;
      if (mag >= RISK_ACCEL || nextYaw >= 0.8) riskUntil = Date.now() + 2000;
    };
    window.addEventListener("devicemotion", onMotion);
    const id = window.setInterval(() => {
      if (stop) return;
      const held = Date.now() < riskUntil;
      const live: VehicleSense = {
        speedKmh: speed,
        accel: held ? Math.max(accel, RISK_ACCEL) : accel,
        yaw: held ? Math.max(yaw, 0.8) : yaw,
        requested: requestedRef.current,
        paid: paidRef.current,
        ticketOk: ticketRef.current,
      };
      setSense(live);
      onWord(senseToRelay(live));
    }, 200);
    return () => {
      stop = true;
      window.clearInterval(id);
      window.removeEventListener("devicemotion", onMotion);
      if (watch != null) navigator.geolocation.clearWatch(watch);
    };
  }, [source, onWord]);

  async function armCar() {
    const motion = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (motion.requestPermission) {
        const state = await motion.requestPermission();
        if (state !== "granted") {
          setCarNote("denied");
          return;
        }
      }
      setCarNote("live");
      onSource("car");
    } catch {
      setCarNote("denied");
    }
  }

  const speed = sense.speedKmh == null ? "—" : Math.round(sense.speedKmh).toString();

  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs tracking-widest text-muted">{copy.kicker}</p>
        <div className="flex h-10 overflow-hidden rounded-full border border-line">
          {(
            [
              ["hand", copy.hand],
              ["road", copy.road],
              ["car", copy.car],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={source === id}
              className={"tap min-h-10 px-3 text-sm " + (source === id ? "bg-copper text-ink" : "text-muted")}
              onClick={() => {
                setRoadRun(false);
                if (id === "car") {
                  void armCar();
                  return;
                }
                onSource(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
        <div>
          <p className="font-mono text-xs text-muted">{copy.speed}</p>
          <p className="font-mono text-5xl leading-none tabular-nums">
            {source === "hand" ? "—" : speed}
            <span className="ml-2 text-base text-muted">km/h</span>
          </p>
        </div>
        <div className="min-w-0">
          <div className="h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full bg-copper"
              style={{ width: `${source === "hand" ? 0 : Math.max(0, Math.min(100, ((sense.speedKmh ?? 0) / 120) * 100))}%` }}
            />
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SCENES.map((id) => (
              <li
                key={id}
                className={
                  "rounded-full border px-2 py-1 text-center text-xs " +
                  (source === "road" && scene === id ? "border-copper text-fg" : "border-line text-muted")
                }
              >
                {copy.scenes[id]}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{copy.rule}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {source !== "car" ? (
          <button
            type="button"
            className="tap min-h-11 rounded-full bg-copper px-4 text-sm text-ink"
            onClick={() => {
              onSource("road");
              setRunId((n) => n + 1);
              setRoadRun(true);
            }}
          >
            {roadRun && source === "road" ? copy.playing : copy.play}
          </button>
        ) : (
          <p className="text-sm">{copy.armed}</p>
        )}
      </div>
      {carNote === "denied" ? <p className="mt-2 text-sm">{copy.denied}</p> : null}
      {source === "hand" ? <p className="mt-2 text-xs text-muted">{copy.handNote}</p> : null}
    </section>
  );
}
