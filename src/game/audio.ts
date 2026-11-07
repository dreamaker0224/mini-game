/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio API sound generator for Japanese arcade sweetness
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved mute preference
    const saved = localStorage.getItem('sweet_stacker_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('sweet_stacker_muted', String(this.isMuted));
    if (!this.isMuted) {
      this.playTap();
    }
    return this.isMuted;
  }

  // Cute drop swing release whoosh
  public playDrop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Satisfying landing sound with rising pitch depending on combo
  public playLand(combo: number, isPerfect: boolean) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Pentatonic scale frequencies for combo progression (C5 major pentatonic)
    const notes = [
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50, // C6
      1174.66, // D6
      1318.51, // E6
      1567.98, // G6
      1760.00  // A6
    ];

    const noteIndex = Math.min(combo, notes.length - 1);
    const baseFreq = notes[noteIndex];

    // Primary bell tone
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = isPerfect ? 'triangle' : 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    if (isPerfect) {
      // Shimmer arpeggio
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
    }

    gain1.gain.setValueAtTime(isPerfect ? 0.35 : 0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + (isPerfect ? 0.45 : 0.25));

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + (isPerfect ? 0.45 : 0.25));

    // For perfect hits, add a high chime overtone
    if (isPerfect) {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.04);

      gain2.gain.setValueAtTime(0.2, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(now + 0.04);
      osc2.stop(now + 0.5);
    }
  }

  // Crisp slice sound when block is trimmed
  public playSlice() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Sad falling sound when game is over
  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.55);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // UI button click
  public playTap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sound = new SoundEngine();
