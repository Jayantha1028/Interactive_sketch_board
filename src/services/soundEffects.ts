import { Platform } from 'react-native';

class SoundEffectsService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return null;
    }
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Helper to create a warm, organic acoustic note (like a wooden marimba or soft bell)
   * with low-pass biquad filtering to strip out any harsh/metallic digital high frequencies.
   */
  private playOrganicTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number = 0.45,
    volume: number = 0.16
  ): void {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator(); // Subtle sub/harmonic warmth
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Warm Low-Pass Filter at 1200Hz removes all metallic/tinny edge
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.frequency.exponentialRampToValueAtTime(400, startTime + duration);
    filter.Q.setValueAtTime(0.7, startTime);

    // Fundamental tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // 2nd harmonic with lower gain for warmth like a real acoustic instrument
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Envelope: quick attack, natural exponential decay
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
    osc2.start(startTime);
    osc2.stop(startTime + duration);
  }

  /**
   * Warm wooden marimba celebration chime (F4 - A4 - C5 - F5)
   * Warm, soothing, organic and pleasant for children's ears.
   */
  public playSuccess(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // F Major Pentatonic / Warm Marimba notes (round, peaceful frequencies)
    const notes = [349.23, 440.0, 523.25, 698.46]; // F4, A4, C5, F5
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      this.playOrganicTone(ctx, freq, now + idx * 0.09, 0.5, 0.14);
    });
  }

  /**
   * Soft, organic water-drop / wooden tap for buttons (Zero metallic buzz)
   */
  public playPop(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Soft warm filter (750 Hz) gives a deep, round wooden/liquid sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);

    // Gentle glide from 240Hz down to 120Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Soft, gentle swoosh when clearing the drawing canvas
   */
  public playWhoosh(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Soft kalimba sparkle for stars and rewards
   */
  public playSparkle(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [440, 523.25, 587.33, 659.25, 783.99]; // A4, C5, D5, E5, G5
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      this.playOrganicTone(ctx, freq, now + idx * 0.06, 0.38, 0.12);
    });
  }
}

export const soundEffects = new SoundEffectsService();
