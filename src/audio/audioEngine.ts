// Web Audio API engine for piano & synth synthesis with audio reactivity
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;
  private currentInstrument: 'synth' | 'grand-piano' | 'cyber-bass' = 'synth';
  private drumGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.drumGain = this.ctx.createGain();
      this.drumGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.drumGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setInstrument(instr: 'synth' | 'grand-piano' | 'cyber-bass') {
    this.currentInstrument = instr;
  }

  // Play note based on selected instrument
  public playNote(freq: number, duration: number = 0.4, isHold: boolean = false): () => void {
    if (!this.ctx || !this.masterGain || this.isMuted) return () => {};
    this.resume();

    const now = this.ctx.currentTime;

    if (this.currentInstrument === 'synth') {
      return this.playSynthNote(freq, duration, isHold, now);
    } else if (this.currentInstrument === 'grand-piano') {
      return this.playGrandPianoNote(freq, duration, isHold, now);
    } else {
      return this.playCyberBassNote(freq, duration, isHold, now);
    }
  }

  // Rich Lady Gaga styled EDM lead synth
  private playSynthNote(freq: number, duration: number, isHold: boolean, now: number): () => void {
    if (!this.ctx || !this.masterGain) return () => {};

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();

    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    // Detuned sawtooths for thick sound
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.006, now); // slight detune

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq * 0.5, now); // one octave down

    // Filter sweep
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4.5, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(100, freq * 1.5), now + (isHold ? duration : 0.35));
    filter.Q.setValueAtTime(3.5, now);

    // Envelope
    const attack = 0.015;
    const peak = 0.45;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(peak, now + attack);

    if (!isHold) {
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);
      
      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);

      osc1.stop(now + duration + 0.15);
      osc2.stop(now + duration + 0.15);
      subOsc.stop(now + duration + 0.15);

      return () => {};
    } else {
      // Hold note returns release function
      noteGain.gain.setValueAtTime(peak * 0.8, now + attack + 0.05);

      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);

      return () => {
        if (!this.ctx) return;
        const releaseTime = this.ctx.currentTime;
        noteGain.gain.cancelScheduledValues(releaseTime);
        noteGain.gain.setValueAtTime(noteGain.gain.value, releaseTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, releaseTime + 0.15);
        osc1.stop(releaseTime + 0.18);
        osc2.stop(releaseTime + 0.18);
        subOsc.stop(releaseTime + 0.18);
      };
    }
  }

  // Harmonic Piano Sound
  private playGrandPianoNote(freq: number, duration: number, isHold: boolean, now: number): () => void {
    if (!this.ctx || !this.masterGain) return () => {};

    const oscFundamental = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const oscChime = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    oscFundamental.type = 'triangle';
    oscFundamental.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    oscChime.type = 'sine';
    oscChime.frequency.setValueAtTime(freq * 3, now);

    const hammerFilter = this.ctx.createBiquadFilter();
    hammerFilter.type = 'lowpass';
    hammerFilter.frequency.setValueAtTime(freq * 3.5, now);
    hammerFilter.frequency.exponentialRampToValueAtTime(freq, now + 0.4);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.5, now + 0.008);

    const actualDur = isHold ? duration * 1.5 : Math.max(0.4, duration);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + actualDur);

    oscFundamental.connect(hammerFilter);
    oscHarmonic.connect(hammerFilter);
    oscChime.connect(hammerFilter);
    hammerFilter.connect(noteGain);
    noteGain.connect(this.masterGain);

    oscFundamental.start(now);
    oscHarmonic.start(now);
    oscChime.start(now);

    oscFundamental.stop(now + actualDur + 0.05);
    oscHarmonic.stop(now + actualDur + 0.05);
    oscChime.stop(now + actualDur + 0.05);

    return () => {
      if (!this.ctx) return;
      const releaseTime = this.ctx.currentTime;
      noteGain.gain.cancelScheduledValues(releaseTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, releaseTime + 0.1);
    };
  }

  // Heavy Cyber Bass Note
  private playCyberBassNote(freq: number, duration: number, isHold: boolean, now: number): () => void {
    if (!this.ctx || !this.masterGain) return () => {};

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 0.5, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2.5, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + duration);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.05);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);

    return () => {};
  }

  // Play backing drum beat (kick/clap) to keep energy high like Judas
  public playKick(intensity: number = 1.0) {
    if (!this.ctx || !this.drumGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);

    gain.gain.setValueAtTime(0.5 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSnare(intensity: number = 0.8) {
    if (!this.ctx || !this.drumGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // White noise buffer for snare snap
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    whiteNoise.start(now);
  }

  // Sound effect for miss
  public playMiss() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Sound effect for star/crown unlock
  public playChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  }

  // Get real-time audio energy (0 to 1) for custom dynamic lighting effects!
  public getAudioEnergy(): number {
    if (!this.analyser || !this.dataArray) return 0.1;
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    // Average lower-mid frequencies for beat bounce
    const count = Math.min(16, this.dataArray.length);
    for (let i = 0; i < count; i++) {
      sum += this.dataArray[i];
    }
    return sum / (count * 255);
  }
}

export const audioEngine = new AudioEngine();
