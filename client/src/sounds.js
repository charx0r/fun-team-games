// Simple Web Audio tone generator. No external audio files.
let ctx = null;
function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(freq, durMs, type = 'sine', gain = 0.15, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const start = c.currentTime + delay / 1000;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + durMs / 1000);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + durMs / 1000 + 0.05);
}

export const sounds = {
  tick() { tone(800, 60, 'sine', 0.08); },
  correct() {
    tone(523, 120, 'triangle', 0.18);
    tone(659, 150, 'triangle', 0.18, 100);
  },
  wrong() { tone(220, 260, 'sawtooth', 0.14); },
  roundDone() {
    tone(523, 140, 'triangle', 0.18);
    tone(659, 140, 'triangle', 0.18, 120);
    tone(784, 240, 'triangle', 0.2, 240);
  },
};
