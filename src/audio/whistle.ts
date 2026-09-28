import type { RelayOutput } from "../circuit/types.ts";

export type HornId = RelayOutput["action"];

export const hornIds: HornId[] = ["lite", "std", "frontier", "degraded", "refuse"];

/** One blast. `freqs` is a chord, not a melody. First note names the train. */
export interface HornVoice {
  freqs: number[];
  ms: number;
  blasts: number;
  gap: number;
  type: OscillatorType;
  gain: number;
  slide: number;
  air: number;
}

export const HORN: Record<HornId, HornVoice> = {
  lite: { freqs: [255, 311, 370], ms: 680, blasts: 1, gap: 0, type: "sawtooth", gain: 0.045, slide: -40, air: 0.04 },
  std: { freqs: [311, 415, 494], ms: 260, blasts: 2, gap: 110, type: "sawtooth", gain: 0.04, slide: -18, air: 0.03 },
  frontier: { freqs: [523, 659, 784], ms: 150, blasts: 3, gap: 45, type: "square", gain: 0.028, slide: 30, air: 0.02 },
  degraded: { freqs: [196, 233], ms: 160, blasts: 2, gap: 220, type: "triangle", gain: 0.035, slide: -10, air: 0.12 },
  refuse: { freqs: [98], ms: 80, blasts: 1, gap: 0, type: "sawtooth", gain: 0.03, slide: -80, air: 0.85 },
};

let ctx: AudioContext | null = null;
let muted = false;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

export function setHornMuted(next: boolean): void {
  muted = next;
}

export function unlockHorn(): void {
  const audio = context();
  if (audio?.state === "suspended") void audio.resume();
}

function airBurst(audio: AudioContext, when: number, ms: number, amount: number): void {
  if (amount <= 0) return;
  const length = Math.max(1, Math.floor(audio.sampleRate * (ms / 1000)));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(amount, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + ms / 1000);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start(when);
  source.stop(when + ms / 1000);
}

export function playHorn(id: HornId): void {
  if (muted) return;
  const audio = context();
  if (!audio || audio.state === "suspended") return;
  const voice = HORN[id];
  const t0 = audio.currentTime + 0.02;
  for (let blast = 0; blast < voice.blasts; blast += 1) {
    const start = t0 + blast * ((voice.ms + voice.gap) / 1000);
    const end = start + voice.ms / 1000;
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = id === "frontier" ? 2400 : 1400;
    filter.connect(audio.destination);
    for (const freq of voice.freqs) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = voice.type;
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 2 ** (voice.slide / 1200)), end);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(voice.gain, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(start);
      osc.stop(end + 0.02);
    }
    airBurst(audio, start, voice.ms, voice.air * 0.2);
  }
}
