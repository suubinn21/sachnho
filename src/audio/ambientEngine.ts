import type { AudioTrackItem } from '../data/types';

/** Gentle pentatonic / lyrical chord progressions for built-in Web Audio felt-piano presets. */
const PRESET_PROGRESSIONS: number[][][] = [
  [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 349.23], [196.0, 246.94, 293.66, 392.0]],
  [[293.66, 349.23, 440.0, 523.25], [246.94, 293.66, 392.0, 440.0], [220.0, 261.63, 329.63, 440.0], [196.0, 293.66, 349.23, 392.0]],
  [[261.63, 311.13, 392.0, 466.16], [233.08, 293.66, 349.23, 466.16], [207.65, 261.63, 311.13, 392.0], [196.0, 246.94, 311.13, 392.0]],
  [[220.0, 261.63, 329.63, 440.0], [196.0, 246.94, 293.66, 392.0], [174.61, 220.0, 261.63, 329.63], [164.81, 246.94, 329.63, 392.0]],
  [[329.63, 392.0, 493.88, 587.33], [293.66, 369.99, 440.0, 587.33], [261.63, 329.63, 392.0, 493.88], [246.94, 293.66, 392.0, 493.88]],
];

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private step = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playFeltNote(freq: number, durationSec: number): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    harmonic.type = 'triangle';
    harmonic.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(920, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.065, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.18, now);

    osc.connect(filter);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + durationSec + 0.05);
    harmonic.stop(now + durationSec + 0.05);
  }

  public stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  public playSynth(track: AudioTrackItem): void {
    this.stop();
    const progression =
      PRESET_PROGRESSIONS[(track.presetIndex ?? 0) % PRESET_PROGRESSIONS.length];
    const beatMs = Math.max(420, Math.round((60 / Math.max(40, track.bpm)) * 1000));
    this.step = 0;

    const tick = () => {
      const barIdx = Math.floor(this.step / 4) % progression.length;
      const noteIdx = this.step % 4;
      const chord = progression[barIdx];
      const note = chord[noteIdx];
      this.playFeltNote(note, (beatMs / 1000) * 2.6);
      if (noteIdx === 0) {
        this.playFeltNote(chord[0] / 2, (beatMs / 1000) * 3.6);
      }
      this.step++;
    };

    tick();
    this.timerId = window.setInterval(tick, beatMs);
  }

  public async playBlob(blob: Blob, onEnded: () => void): Promise<void> {
    this.stop();
    const url = URL.createObjectURL(blob);
    this.objectUrl = url;
    const audio = new Audio(url);
    audio.volume = 0.72;
    audio.onended = onEnded;
    this.audioEl = audio;
    await audio.play();
  }

  public dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
