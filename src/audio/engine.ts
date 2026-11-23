// Procedural music and sound, entirely synthesised with the Web Audio API.
//
//  * Tanpura-style drone (Pa–Sa–Sa–Sa cycle with a buzzing "jawari" bridge),
//    retuned by era: the misl era sits on C, the Sarkar era rises to D, the
//    twilight after 1839 sinks to B♭.
//  * A sarangi-like bowed voice: band-passed sawtooth with slow-onset vibrato and
//    meend (glides) between notes, playing raga-inflected phrases. See AUDIO.md for
//    why each raga was chosen.
//  * Nagara (war kettledrum), dhol (victory, Vaisakhi), dhadd (under narration).
//  * UI sounds: paper rustle, quill stroke, gold ting.
// Kirtan and Gurbani recitation are never imitated.

export type Mood = 'title' | 'explore' | 'monsoon' | 'war' | 'mourning' | 'celebration' | 'diwali' | 'twilight';

interface Raga {
  name: string;
  /** Scale degrees in semitones above Sa, ascending. */
  aroha: number[];
  /** Characteristic phrases (pakad-like), as semitone offsets; 12 = upper Sa. */
  phrases: number[][];
  tempo: number; // seconds per note (base)
}

/** Raga choices (documented in AUDIO.md). */
export const RAGAS: Record<Mood, Raga> = {
  title: { name: 'Bilaval (dawn brightness)', aroha: [0, 2, 4, 5, 7, 9, 11], phrases: [[0, 4, 7, 9, 7, 5, 4], [7, 9, 11, 12, 11, 9, 7], [4, 5, 7, 4, 2, 0]], tempo: 0.62 },
  explore: { name: 'Pahadi (hill folk colour)', aroha: [0, 2, 4, 7, 9], phrases: [[0, 2, 4, 7, 4, 2, 0], [7, 9, 12, 9, 7, 4], [-3, 0, 2, 4, 2, 0, -3, 0]], tempo: 0.55 },
  monsoon: { name: 'Desh (the raga of the rains)', aroha: [0, 2, 5, 7, 11], phrases: [[0, 2, 5, 7, 11, 12], [12, 10, 9, 7, 5, 4, 2, 4, 0], [7, 9, 10, 9, 7, 5, 4, 2]], tempo: 0.6 },
  war: { name: 'Maru (valour)', aroha: [0, 4, 5, 6, 7, 11], phrases: [[0, 4, 7, 11, 12], [12, 11, 7, 6, 7, 4], [7, 6, 4, 2, 0]], tempo: 0.42 },
  mourning: { name: 'Bhairavi (pathos)', aroha: [0, 1, 3, 5, 7, 8, 10], phrases: [[0, 1, 3, 1, 0], [5, 3, 1, 0, -2, 0], [7, 8, 7, 5, 3, 1, 0]], tempo: 0.95 },
  celebration: { name: 'Khamaj (festive)', aroha: [0, 4, 5, 7, 9, 10, 11], phrases: [[4, 5, 7, 9, 10, 9, 7], [12, 10, 9, 7, 5, 4], [0, 4, 5, 7, 4, 5, 4, 2, 0]], tempo: 0.4 },
  diwali: { name: 'Yaman (evening lamps)', aroha: [0, 2, 4, 6, 7, 9, 11], phrases: [[-1, 2, 4, 6, 7], [7, 6, 4, 2, 0], [4, 6, 9, 11, 12, 11, 9, 7]], tempo: 0.6 },
  twilight: { name: 'Marwa (dusk, unease)', aroha: [0, 1, 4, 6, 9, 11], phrases: [[0, 1, 4, 6, 9, 6, 4, 1], [11, 9, 6, 4, 1, 0], [-1, 1, 4, 1, 0]], tempo: 0.75 },
};

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private droneBus!: GainNode;
  private melodyBus!: GainNode;
  private reverb!: ConvolverNode;
  private noise!: AudioBuffer;
  private mood: Mood = 'title';
  private tonic = 130.81; // C3
  private timers: number[] = [];
  private running = false;
  settings: AudioSettings = { master: 0.8, music: 0.6, sfx: 0.8, muted: false };

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.music = ctx.createGain();
    this.sfx = ctx.createGain();
    this.droneBus = ctx.createGain();
    this.melodyBus = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    this.droneBus.connect(this.music);
    this.melodyBus.connect(this.music);
    this.melodyBus.connect(this.reverb);
    this.droneBus.connect(this.reverb);
    this.reverb.connect(wet).connect(this.music);
    this.music.connect(this.master);
    this.sfx.connect(this.master);
    this.master.connect(ctx.destination);
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.droneBus.gain.value = 0.5;
    this.melodyBus.gain.value = 0.55;
    this.applySettings();
    this.running = true;
    this.loopDrone();
    this.loopMelody();
  }

  private makeImpulse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  applySettings() {
    if (!this.ctx) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.1);
    this.music.gain.setTargetAtTime(s.music * 0.5, t, 0.1);
    this.sfx.gain.setTargetAtTime(s.sfx, t, 0.1);
  }

  setEra(year: number) {
    const next = year >= 1839 ? 116.54 : year >= 1799 ? 146.83 : 130.81; // B♭, D, C
    this.tonic = next;
  }

  setMood(m: Mood) {
    if (m === this.mood) return;
    this.mood = m;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Mourning: the drone drops and slows.
    this.droneBus.gain.setTargetAtTime(m === 'mourning' ? 0.22 : 0.5, t, 1.5);
    this.melodyBus.gain.setTargetAtTime(m === 'mourning' ? 0.4 : 0.55, t, 1.5);
  }

  getMood() {
    return this.mood;
  }

  /* ── Drone ───────────────────────────────────────────────────────────── */

  private pluck(freq: number, when: number, gain: number) {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, when);
    out.gain.linearRampToValueAtTime(gain, when + 0.02);
    out.gain.exponentialRampToValueAtTime(gain * 0.35, when + 1.2);
    out.gain.exponentialRampToValueAtTime(0.0001, when + 4.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, when);
    lp.frequency.exponentialRampToValueAtTime(700, when + 3);
    // Jawari: the buzzing bridge, approximated with a soft waveshaper and a swept band.
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 2.4);
    }
    shaper.curve = curve;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(freq * 8, when);
    bp.frequency.exponentialRampToValueAtTime(freq * 3, when + 3.5);
    const bpGain = ctx.createGain();
    bpGain.gain.value = 0.35;
    for (const [mult, amp] of [[1, 0.5], [2, 0.25], [3, 0.12], [4, 0.08]] as const) {
      const o = ctx.createOscillator();
      o.type = mult === 1 ? 'sawtooth' : 'sine';
      o.frequency.value = freq * mult * (1 + (Math.random() - 0.5) * 0.0015);
      const g = ctx.createGain();
      g.gain.value = amp;
      o.connect(g).connect(shaper);
      o.start(when);
      o.stop(when + 4.4);
    }
    shaper.connect(lp).connect(out);
    shaper.connect(bp).connect(bpGain).connect(out);
    out.connect(this.droneBus);
  }

  private loopDrone() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.05;
    const sa = this.tonic;
    const slow = this.mood === 'mourning' ? 1.5 : 1;
    const gap = 1.15 * slow;
    // Pa (fifth below upper Sa), Sa', Sa', Sa (lower)
    this.pluck(sa * 0.75, t, 0.16);
    this.pluck(sa, t + gap, 0.13);
    this.pluck(sa, t + gap * 2, 0.13);
    this.pluck(sa / 2, t + gap * 3, 0.18);
    this.timers.push(window.setTimeout(() => this.loopDrone(), gap * 4 * 1000));
  }

  /* ── Sarangi voice ───────────────────────────────────────────────────── */

  private bowedNote(freqFrom: number, freqTo: number, when: number, dur: number, gain: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freqFrom, when);
    // Meend: a glide into the note.
    o.frequency.exponentialRampToValueAtTime(freqTo, when + Math.min(0.18, dur * 0.35));
    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(freqFrom * 1.003, when);
    o2.frequency.exponentialRampToValueAtTime(freqTo * 1.003, when + Math.min(0.18, dur * 0.35));
    // Vibrato that deepens through the note.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.2 + Math.random() * 0.6;
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0, when);
    lfoGain.gain.linearRampToValueAtTime(freqTo * 0.007, when + dur * 0.8);
    lfo.connect(lfoGain);
    lfoGain.connect(o.frequency);
    lfoGain.connect(o2.frequency);
    // Body: band-pass formants of a skin-bellied fiddle.
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 900;
    f1.Q.value = 1.4;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'peaking';
    f2.frequency.value = 2600;
    f2.gain.value = 6;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3800;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(gain, when + 0.09);
    env.gain.setValueAtTime(gain * 0.9, when + dur * 0.7);
    env.gain.linearRampToValueAtTime(0, when + dur + 0.12);
    o.connect(f1);
    o2.connect(f1);
    f1.connect(f2).connect(lp).connect(env).connect(this.melodyBus);
    for (const n of [o, o2, lfo]) {
      n.start(when);
      n.stop(when + dur + 0.2);
    }
  }

  private loopMelody() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const raga = RAGAS[this.mood];
    const phrase = raga.phrases[Math.floor(Math.random() * raga.phrases.length)];
    const sa = this.tonic * 2;
    let t = ctx.currentTime + 0.1;
    let prev = sa * Math.pow(2, phrase[0] / 12);
    phrase.forEach((st, i) => {
      const f = sa * Math.pow(2, st / 12);
      const long = i === phrase.length - 1 ? 2.2 : Math.random() < 0.25 ? 1.6 : 1;
      const dur = raga.tempo * long;
      this.bowedNote(prev, f, t, dur, 0.09);
      prev = f;
      t += dur;
    });
    const rest = (this.mood === 'mourning' ? 5 : this.mood === 'war' ? 1.5 : 3.5) + Math.random() * 3;
    this.timers.push(window.setTimeout(() => this.loopMelody(), (t - ctx.currentTime + rest) * 1000));
    if (this.mood === 'war' && Math.random() < 0.7) this.nagara(2);
  }

  /* ── Drums ───────────────────────────────────────────────────────────── */

  private drumHit(when: number, f0: number, f1: number, decay: number, gain: number, noiseAmt: number, noiseFreq: number, bus: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(f1, when + decay * 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + decay + 0.05);
    if (noiseAmt > 0) {
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = noiseFreq;
      nf.Q.value = 0.9;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(noiseAmt, when);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
      n.connect(nf).connect(ng).connect(bus);
      n.start(when, Math.random());
      n.stop(when + 0.15);
    }
  }

  /** The nagara: deep war-drum strokes. */
  nagara(strokes = 4) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    for (let i = 0; i < strokes; i++) this.drumHit(t + i * 0.42 + (i === strokes - 1 ? 0.12 : 0), 95, 48, 1.4, 0.75, 0.25, 300, this.sfx);
  }

  /** Dhol: the bhangra chaal, for victories and Vaisakhi. */
  dhol(bars = 2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    const beat = 0.18;
    // dha . ge na | dha . ge na  (dagga on the bass side, tilli on the treble)
    const pattern = [1, 0, 2, 2, 1, 0, 2, 3];
    for (let b = 0; b < bars; b++)
      pattern.forEach((p, i) => {
        const when = t + (b * pattern.length + i) * beat;
        if (p === 1) this.drumHit(when, 120, 62, 0.45, 0.6, 0.15, 200, this.sfx);
        if (p >= 2) this.drumHit(when, p === 3 ? 520 : 420, p === 3 ? 380 : 300, 0.09, 0.22, 0.4, 3200, this.sfx);
      });
  }

  /** The dhadd: a small hourglass drum whose pitch bends as the strings are squeezed. */
  dhadd(strokes = 3) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    for (let i = 0; i < strokes; i++) {
      const up = i % 2 === 0;
      this.drumHit(t + i * 0.32, up ? 190 : 260, up ? 260 : 170, 0.28, 0.32, 0.08, 1200, this.sfx);
    }
  }

  /* ── UI sounds ───────────────────────────────────────────────────────── */

  private noiseBurst(dur: number, freq: number, q: number, gain: number, flutter = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(freq * 1.8, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.15);
    if (flutter) for (let i = 1; i < 6; i++) g.gain.setValueAtTime(gain * (0.4 + Math.random() * 0.6), t + (dur * i) / 6);
    g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(f).connect(g).connect(this.sfx);
    n.start(t, Math.random());
    n.stop(t + dur + 0.02);
  }

  rustle() {
    this.noiseBurst(0.28, 1800, 0.7, 0.18, 1);
  }

  quill() {
    this.noiseBurst(0.16, 4200, 2.5, 0.12);
  }

  ting() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    for (const [f, a] of [[1760, 0.12], [2640, 0.06], [4100, 0.03]] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(a, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(g).connect(this.sfx);
      o.start(t);
      o.stop(t + 1.2);
    }
  }

  stop() {
    this.running = false;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    void this.ctx?.close();
    this.ctx = null;
  }
}

export const audio = new AudioEngine();
