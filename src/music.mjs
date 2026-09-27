// Original ambient piece: "Orbital Drift", 64 BPM, eight-bar harmonic cycle.
// Generated locally; no streaming service or audio download is required.
const chords = [
  [48, 55, 59, 64],
  [45, 52, 59, 60],
  [41, 48, 55, 57],
  [43, 50, 55, 60],
  [48, 55, 62, 64],
  [45, 52, 55, 59],
  [41, 48, 52, 57],
  [43, 50, 57, 62],
];
const melody = [0, 2, 3, 2, 1, 2, 0, 3, 2, 1, 3, 2, 0, 1, 2, 1];
export function createSoundtrack({
  volume = 0.25,
  muted = false,
  onState = () => {},
} = {}) {
  let context,
    master,
    filter,
    delay,
    feedback,
    wet,
    timer,
    nextBar = 0,
    bar = 0,
    ducked = false,
    hidden = false,
    failed = false,
    started = false;
  const voices = new Set(),
    beat = 60 / 64,
    barTime = beat * 4;
  const state = () => ({ volume, muted, started, supported: !failed });
  function level() {
    if (master && context) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(
        muted || hidden ? 0 : volume * (ducked ? 0.28 : 1),
        context.currentTime,
        0.25,
      );
    }
  }
  function note(midi, when, duration, amplitude, type = "sine", pan = 0) {
    const osc = context.createOscillator(),
      gain = context.createGain(),
      panner = context.createStereoPanner();
    osc.type = type;
    osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    panner.pan.value = pan;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(
      amplitude,
      when + Math.min(0.9, duration * 0.2),
    );
    gain.gain.setTargetAtTime(amplitude * 0.55, when + duration * 0.35, 0.5);
    gain.gain.linearRampToValueAtTime(0, when + duration);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(filter);
    voices.add(osc);
    osc.onended = () => {
      voices.delete(osc);
      osc.disconnect();
      gain.disconnect();
      panner.disconnect();
    };
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }
  function schedule() {
    if (!context || context.state !== "running") return;
    if (nextBar < context.currentTime - 0.2)
      nextBar = context.currentTime + 0.05;
    while (nextBar < context.currentTime + 0.4) {
      const chord = chords[bar % chords.length];
      chord.forEach((midi, i) =>
        note(midi, nextBar, barTime * 1.9, 0.032, "sine", (i - 1.5) * 0.32),
      );
      note(chord[0] - 12, nextBar, barTime * 1.8, 0.055, "sine", 0);
      for (let i = 0; i < 4; i++)
        note(
          chord[melody[(bar * 4 + i) % melody.length]] + 12,
          nextBar + i * beat,
          beat * 2.8,
          0.026,
          "triangle",
          Math.sin(bar + i) * 0.6,
        );
      nextBar += barTime;
      bar++;
    }
  }
  async function start() {
    if (failed) return false;
    try {
      if (!context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) {
          failed = true;
          throw new Error("Audio unavailable");
        }
        context = new Audio();
        master = context.createGain();
        filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2300;
        delay = context.createDelay(3);
        delay.delayTime.value = beat * 0.75;
        feedback = context.createGain();
        feedback.gain.value = 0.32;
        wet = context.createGain();
        wet.gain.value = 0.24;
        filter.connect(master);
        filter.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wet);
        wet.connect(master);
        master.connect(context.destination);
        master.gain.value = 0;
        nextBar = context.currentTime + 0.08;
        timer = setInterval(schedule, 150);
      }
      await context.resume();
      started = true;
      level();
      schedule();
      onState(state());
      return true;
    } catch {
      onState(state());
      return false;
    }
  }
  function setVolume(value) {
    volume = Math.max(0, Math.min(0.7, Number.isFinite(value) ? value : 0.25));
    level();
    onState(state());
  }
  function setMuted(value) {
    muted = Boolean(value);
    level();
    onState(state());
  }
  function setDucked(value) {
    ducked = Boolean(value);
    level();
  }
  async function setHidden(value) {
    hidden = Boolean(value);
    level();
    if (!context) return;
    try {
      if (hidden) await context.suspend();
      else await context.resume();
    } catch {}
  }
  function dispose() {
    if (timer) clearInterval(timer);
    for (const voice of voices)
      try {
        voice.stop();
      } catch {}
    voices.clear();
    if (context) context.close();
  }
  return {
    start,
    setVolume,
    setMuted,
    setDucked,
    setHidden,
    dispose,
    getState: state,
  };
}
