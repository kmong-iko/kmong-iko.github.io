// Soft synthesized "glass clink" for cup bounces (Web Audio, no audio files) plus the on/off toggle.

const STORAGE_KEY = 'sound';
const MIN_GAP_MS = 70;                       // never retrigger faster than this
const BASE_PITCHES = [1568, 1760, 2093];     // Hz; one is picked per hit so it doesn't sound repetitive
const PITCH_JITTER = 0.05;                   // ± random detune
const MIN_VOLUME = 0.025;                    // gentlest tap
const MAX_VOLUME = 0.11;                     // hardest hit — deliberately quiet
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

  const setEnabled = (value) => {
    enabled = value;
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
  };

  return { unlock, play, setEnabled, get enabled() { return enabled; } };
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
