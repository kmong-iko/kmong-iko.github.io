// Soft synthesized sounds (Web Audio, no audio files): the glass clink for cup bounces, the light key tap for the
// dev-tool keys, and a small set of UI sounds (sound.sfx('open' | 'close' | 'nav' | ...)) used across every page.
// Everything goes through one master limiter + the on/off toggle, so sounds never pile up or play when muted.

const STORAGE_KEY = 'sound';
const MIN_GAP_MS = 70;                       // never retrigger faster than this
const BASE_PITCHES = [1568, 1760, 2093];     // Hz; one is picked per hit so it doesn't sound repetitive
const PITCH_JITTER = 0.05;                   // ± random detune
const MIN_VOLUME = 0.025;                    // gentlest tap
const MAX_VOLUME = 0.11;                     // hardest hit — deliberately quiet
const KEY_MIN_GAP_MS = 45;                   // key taps: never retrigger faster than this
const KEY_VOLUME = 0.04;                     // very soft
const MAX_VOICES = 4, VOICE_WINDOW_MS = 150; // master limiter (see claimSlot)
const PARTIALS = [                           // inharmonic overtones give the glassy ring
  { ratio: 1, gain: 1, decay: 0.3 },
  { ratio: 2.32, gain: 0.45, decay: 0.16 },
  { ratio: 4.25, gain: 0.2, decay: 0.08 },
];

const readPreference = () => {
  try { return localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { return true; }
};

export function createSound() {
  let context = null, output = null, lastPlayed = 0, enabled = readPreference();

  // Master limiter: at most MAX_VOICES sounds started within VOICE_WINDOW_MS, so nothing ever turns into a pile-up.
  const recent = [];
  const claimSlot = (nowMs) => {
    while (recent.length && nowMs - recent[0] > VOICE_WINDOW_MS) recent.shift();
    if (recent.length >= MAX_VOICES) return false;
    recent.push(nowMs);
    return true;
  };

  // Browsers only allow audio after a user gesture, so the context is created lazily from one.
  const unlock = async () => {
    if (!enabled) return;
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      context = new AudioContextClass();
      const tone = context.createBiquadFilter(); // rolls off the harsh highs
      tone.type = 'lowpass';
      tone.frequency.value = 5000;
      tone.connect(context.destination);
      output = tone;
    }
    if (context.state === 'suspended') await context.resume();
  };

  /** @param {number} intensity 0–1 */
  const play = (intensity = 0.5) => {
    if (!enabled || !context || context.state !== 'running') return;
    const nowMs = performance.now();
    if (nowMs - lastPlayed < MIN_GAP_MS) return;
    if (!claimSlot(nowMs)) return;
    lastPlayed = nowMs;

    const start = context.currentTime;
    const pitch = BASE_PITCHES[Math.floor(Math.random() * BASE_PITCHES.length)] * (1 + (Math.random() - 0.5) * 2 * PITCH_JITTER);
    const volume = context.createGain();
    volume.gain.value = MIN_VOLUME + (MAX_VOLUME - MIN_VOLUME) * intensity;
    volume.connect(output);

    for (const { ratio, gain, decay } of PARTIALS) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.frequency.value = pitch * ratio;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(gain, start + 0.002);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + decay);
      oscillator.connect(envelope).connect(volume);
      oscillator.start(start);
      oscillator.stop(start + decay + 0.02);
    }
  };

  /** Light, soft typing tap: a very short high-passed noise "tick" plus a tiny mid-high blip. No low "thock". */
  let noise = null, lastKey = 0;
  const playKey = () => {
    if (!enabled || !context || context.state !== 'running') return;
    const nowMs = performance.now();
    if (nowMs - lastKey < KEY_MIN_GAP_MS || !claimSlot(nowMs)) return;
    lastKey = nowMs;

    const start = context.currentTime;
    if (!noise) { // 18 ms of white noise, created once
      noise = context.createBuffer(1, Math.round(context.sampleRate * 0.018), context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    const tick = context.createBufferSource();
    const band = context.createBiquadFilter();
    const tickGain = context.createGain();
    tick.buffer = noise;
    band.type = 'bandpass';
    band.frequency.value = 3600 + Math.random() * 900; // bright and papery, nothing below ~2 kHz
    band.Q.value = 1.4;
    tickGain.gain.setValueAtTime(KEY_VOLUME * 0.8, start);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.018);
    tick.connect(band).connect(tickGain).connect(output);
    tick.start(start);

    const blip = context.createOscillator();
    const blipGain = context.createGain();
    blip.type = 'sine';
    blip.frequency.value = 1500 + Math.random() * 400;
    blipGain.gain.setValueAtTime(KEY_VOLUME * 0.35, start);
    blipGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);
    blip.connect(blipGain).connect(output);
    blip.start(start);
    blip.stop(start + 0.04);
  };

  /* ---- UI sounds: each is a short sequence of soft sine notes [startHz, endHz, delaySec, durationSec, relativeGain] ---- */
  const UI_SOUNDS = {
    hover:    { gap: 140, volume: 0.022, notes: [[1180, 1420, 0, 0.05, 1]] },                      // soft bubble pop
    tile:     { gap: 120, volume: 0.03,  notes: [[880, 1320, 0, 0.07, 1], [1760, 1760, 0.02, 0.05, 0.3]] },
    click:    { gap: 90,  volume: 0.04,  notes: [[740, 620, 0, 0.06, 1]] },
    nav:      { gap: 200, volume: 0.045, notes: [[520, 700, 0, 0.09, 1], [780, 940, 0.07, 0.1, 0.8]] },  // switching pages
    open:     { gap: 200, volume: 0.045, notes: [[560, 760, 0, 0.1, 1], [840, 1120, 0.07, 0.14, 0.8]] }, // popup opens
    close:    { gap: 200, volume: 0.04,  notes: [[820, 640, 0, 0.09, 1], [600, 440, 0.07, 0.12, 0.7]] }, // popup closes
    maximize: { gap: 200, volume: 0.035, notes: [[520, 880, 0, 0.12, 1]] },
    restore:  { gap: 200, volume: 0.035, notes: [[880, 520, 0, 0.12, 1]] },
    slide:    { gap: 120, volume: 0.03,  notes: [[960, 1100, 0, 0.06, 1]] },
    'theme-light': { gap: 300, volume: 0.045, notes: [[660, 660, 0, 0.12, 1], [880, 880, 0.08, 0.12, 0.9], [1320, 1320, 0.16, 0.18, 0.7]] },
    'theme-dark':  { gap: 300, volume: 0.045, notes: [[1100, 1100, 0, 0.12, 1], [830, 830, 0.09, 0.12, 0.9], [560, 560, 0.18, 0.2, 0.7]] },
    success:  { gap: 300, volume: 0.05,  notes: [[660, 660, 0, 0.12, 1], [830, 830, 0.09, 0.12, 0.9], [990, 990, 0.18, 0.2, 0.9], [1320, 1320, 0.27, 0.26, 0.6]] },
    error:    { gap: 300, volume: 0.04,  notes: [[520, 480, 0, 0.12, 1], [440, 400, 0.12, 0.16, 0.9]] },
  };
  let lastUi = 0;
  const lastByName = {};

  /** @param {keyof typeof UI_SOUNDS} name */
  const sfx = (name) => {
    const def = UI_SOUNDS[name];
    if (!def || !enabled || !context || context.state !== 'running') return;
    const nowMs = performance.now();
    if (nowMs - (lastByName[name] ?? 0) < def.gap) return;       // no machine-gunning the same sound…
    if (name !== 'hover' && name !== 'tile' && nowMs - lastUi < 60) return; // …or stacking different ones
    if (!claimSlot(nowMs)) return;
    lastByName[name] = lastUi = nowMs;

    const start = context.currentTime;
    for (const [from, to, delay, length, rel] of def.notes) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const at = start + delay;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(from, at);
      if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, at + length);
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.linearRampToValueAtTime(def.volume * rel, at + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + length + 0.05);
      oscillator.connect(envelope).connect(output);
      oscillator.start(at);
      oscillator.stop(at + length + 0.08);
    }
  };

  const setEnabled = (value) => {
    enabled = value;
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
  };

  return { unlock, play, playKey, sfx, setEnabled, get enabled() { return enabled; } };
}

export function initSoundToggle(button, sound) {
  const sync = () => {
    button.setAttribute('aria-pressed', String(sound.enabled));
    button.setAttribute('aria-label', sound.enabled ? 'Mute sound' : 'Turn sound on');
  };

  button.addEventListener('click', async () => {
    sound.setEnabled(!sound.enabled);
    sync();
    if (sound.enabled) { await sound.unlock(); sound.sfx('click'); } // a soft preview confirms it's on
  });

  sync();
}
