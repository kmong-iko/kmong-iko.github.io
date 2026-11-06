// Soft synthesized sounds (Web Audio, no audio files): the glass clink for cup bounces, the keyboard click
// for the dev-tool keys, and the on/off toggle.

const STORAGE_KEY = 'sound';
const MIN_GAP_MS = 70;                       // never retrigger faster than this
const BASE_PITCHES = [1568, 1760, 2093];     // Hz; one is picked per hit so it doesn't sound repetitive
const PITCH_JITTER = 0.05;                   // ± random detune
const MIN_VOLUME = 0.025;                    // gentlest tap
const MAX_VOLUME = 0.11;                     // hardest hit — deliberately quiet
const KEY_MIN_GAP_MS = 35;                   // keyboard clicks: never retrigger faster than this
const KEY_VOLUME = 0.05;                     // very soft
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

  /** Soft mechanical key press: a short filtered-noise tick plus a low "thock". */
  let noise = null, lastKey = 0;
  const playKey = () => {
    if (!enabled || !context || context.state !== 'running') return;
    const nowMs = performance.now();
    if (nowMs - lastKey < KEY_MIN_GAP_MS) return;
    lastKey = nowMs;

    const start = context.currentTime;
    if (!noise) { // 30 ms of white noise, created once
      noise = context.createBuffer(1, Math.round(context.sampleRate * 0.03), context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    const tick = context.createBufferSource();
    const band = context.createBiquadFilter();
    const tickGain = context.createGain();
    tick.buffer = noise;
    band.type = 'bandpass';
    band.frequency.value = 2200 + Math.random() * 700;
    band.Q.value = 0.9;
    tickGain.gain.setValueAtTime(KEY_VOLUME, start);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);
    tick.connect(band).connect(tickGain).connect(output);
    tick.start(start);

    const thock = context.createOscillator();
    const thockGain = context.createGain();
    thock.frequency.setValueAtTime(190, start);
    thock.frequency.exponentialRampToValueAtTime(110, start + 0.05);
    thockGain.gain.setValueAtTime(KEY_VOLUME * 0.9, start);
    thockGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
    thock.connect(thockGain).connect(output);
    thock.start(start);
    thock.stop(start + 0.08);
  };

  const setEnabled = (value) => {
    enabled = value;
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
  };

  return { unlock, play, playKey, setEnabled, get enabled() { return enabled; } };
}

export function initSoundToggle(button, sound) {
  const sync = () => {
    button.setAttribute('aria-pressed', String(sound.enabled));
    button.setAttribute('aria-label', sound.enabled ? 'Mute sound' : 'Turn sound on');
  };

  button.addEventListener('click', async () => {
    sound.setEnabled(!sound.enabled);
    sync();
    if (sound.enabled) { await sound.unlock(); sound.play(0.3); } // a soft preview confirms it's on
  });

  sync();
}
