/** Lightweight Web Audio synth — no asset files, shared across arcade games. */

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.07,
  slide?: number,
  delay = 0
) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(slide, 40), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol = 0.04) {
  const c = ac();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  src.connect(g);
  g.connect(c.destination);
  src.start();
}

export const sfx = {
  jump: () => tone(220, 0.09, "square", 0.045, 520),
  land: () => tone(120, 0.05, "triangle", 0.04, 80),
  coin: () => tone(740, 0.07, "sine", 0.055, 1180),
  combo: (n: number) => tone(400 + n * 60, 0.1, "sine", 0.05, 800 + n * 40),
  powerup: () => {
    tone(330, 0.12, "sine", 0.05, 660);
    tone(660, 0.14, "sine", 0.04, 990, 0.06);
  },
  nearMiss: () => tone(500, 0.08, "sawtooth", 0.035, 700),
  milestone: () => {
    tone(440, 0.15, "sine", 0.05, 880);
    tone(660, 0.2, "sine", 0.04, 990, 0.1);
  },
  hit: () => {
    noise(0.12, 0.06);
    tone(90, 0.2, "sawtooth", 0.06, 40);
  },
  tap: () => tone(600, 0.05, "square", 0.04, 900),
  miss: () => tone(180, 0.1, "triangle", 0.035, 100),
  holdPulse: () => tone(55, 0.06, "sine", 0.03),
  diamond: () => {
    tone(523, 0.18, "sine", 0.05);
    tone(659, 0.2, "sine", 0.045, 0, 0.08);
    tone(784, 0.25, "sine", 0.04, 0, 0.16);
  },
  paper: () => {
    noise(0.15, 0.05);
    tone(200, 0.25, "sawtooth", 0.05, 60);
  },
};