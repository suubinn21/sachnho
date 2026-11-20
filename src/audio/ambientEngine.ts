import type { AudioTrackItem } from '../data/types';

interface PianoPiece {
  /** Left-hand broken chord MIDI notes per bar (8 eighth-note steps per bar). */
  bars: Array<{
    lh: Array<number | null>;
    rh: Array<[number, number] | null>; // [midiNote, durationBeats]
  }>;
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * 10 distinct lyrical felt-piano pieces (60–82 BPM) using authentic chord progressions,
 * broken left-hand accompaniment, and singing right-hand melody phrases.
 */
const PIANO_PIECES: PianoPiece[] = [
  // 0: Sương Sớm Trên Thảm Cỏ (C major lyrical, 64 bpm)
  {
    bars: [
      { lh: [48, 55, 60, 64, 55, 60, 64, 60], rh: [[72, 2], null, [76, 1], [79, 1], null, [76, 1.5], null, [74, 1]] },
      { lh: [45, 52, 57, 60, 52, 57, 60, 57], rh: [[72, 2.5], null, null, [69, 1], [72, 1.5], null, [74, 1], null] },
      { lh: [41, 48, 53, 57, 48, 53, 57, 53], rh: [[77, 2], null, [76, 1], [74, 1], null, [72, 2], null, null] },
      { lh: [43, 50, 55, 59, 50, 55, 59, 55], rh: [[74, 2.5], null, null, [71, 1], [74, 1.5], null, [72, 1.5], null] },
    ],
  },
  // 1: Chiều Vàng Trên Kệ Sách (F major warm, 68 bpm)
  {
    bars: [
      { lh: [41, 48, 53, 57, 48, 53, 57, 53], rh: [[69, 1.5], null, [72, 1], [77, 1.5], null, [76, 1], [74, 1.5], null] },
      { lh: [45, 52, 57, 60, 52, 57, 60, 57], rh: [[72, 2], null, [69, 1], [72, 1.5], null, [74, 1], [72, 1], null] },
      { lh: [46, 53, 58, 62, 53, 58, 62, 58], rh: [[74, 2], null, [77, 1], [79, 1.5], null, [77, 1], [74, 1.5], null] },
      { lh: [48, 55, 60, 64, 55, 60, 62, 55], rh: [[76, 2.5], null, null, [74, 1], [72, 2], null, null, null] },
    ],
  },
  // 2: Trang Giấy Mở Khẽ (D minor / F gentle, 60 bpm)
  {
    bars: [
      { lh: [38, 45, 50, 53, 45, 50, 53, 50], rh: [[69, 2.5], null, null, [72, 1], [74, 2], null, [72, 1.5], null] },
      { lh: [46, 53, 58, 62, 53, 58, 62, 58], rh: [[70, 2], null, [69, 1], [67, 1.5], null, [69, 2], null, null] },
      { lh: [41, 48, 53, 57, 48, 53, 57, 53], rh: [[72, 2], null, [74, 1], [77, 1.5], null, [76, 1.5], null, [72, 1]] },
      { lh: [45, 52, 57, 61, 52, 57, 61, 57], rh: [[69, 3], null, null, null, [67, 1.5], null, [69, 1.5], null] },
    ],
  },
  // 3: Mưa Nhẹ Ngoài Hiên (A minor wistful, 66 bpm)
  {
    bars: [
      { lh: [45, 52, 57, 60, 64, 60, 57, 52], rh: [[76, 1.5], null, [74, 1], [72, 1.5], null, [71, 1.5], null, [69, 1.5]] },
      { lh: [41, 48, 53, 57, 60, 57, 53, 48], rh: [[72, 2], null, [76, 1], [74, 1.5], null, [72, 2], null, null] },
      { lh: [48, 55, 60, 64, 67, 64, 60, 55], rh: [[79, 2], null, [76, 1], [74, 1.5], null, [72, 1.5], null, [74, 1.5]] },
      { lh: [43, 50, 55, 59, 62, 59, 55, 50], rh: [[71, 2.5], null, null, [74, 1], [72, 1.5], null, [71, 2], null] },
    ],
  },
  // 4: Hồi Ức Tuổi Thơ (G major flowing, 72 bpm)
  {
    bars: [
      { lh: [43, 50, 55, 59, 50, 55, 59, 55], rh: [[71, 1], [74, 1], [79, 1.5], null, [78, 1], [74, 1.5], null, [71, 1]] },
      { lh: [40, 47, 52, 55, 47, 52, 55, 52], rh: [[72, 1.5], null, [71, 1], [67, 1.5], null, [69, 2], null, null] },
      { lh: [48, 55, 60, 64, 55, 60, 64, 60], rh: [[72, 1.5], null, [76, 1], [79, 1.5], null, [78, 1], [76, 1.5], null] },
      { lh: [38, 45, 50, 54, 45, 50, 54, 50], rh: [[74, 2.5], null, null, [72, 1], [71, 1.5], null, [69, 1.5], null] },
    ],
  },
  // 5: Gió Thổi Đồi Cỏ Xanh (E minor -> G pastoral, 74 bpm)
  {
    bars: [
      { lh: [40, 47, 52, 55, 59, 55, 52, 47], rh: [[76, 2], null, [74, 1], [71, 1.5], null, [72, 1.5], null, [74, 1]] },
      { lh: [48, 55, 60, 64, 60, 55, 52, 55], rh: [[76, 2.5], null, null, [74, 1], [72, 1.5], null, [71, 1], null] },
      { lh: [43, 50, 55, 59, 55, 50, 47, 50], rh: [[74, 2], null, [79, 1], [78, 1.5], null, [76, 1.5], null, [74, 1]] },
      { lh: [38, 45, 50, 54, 57, 54, 50, 45], rh: [[74, 2.5], null, null, [71, 1], [69, 2], null, null, null] },
    ],
  },
  // 6: Đêm Yên Tĩnh Đọc Sách (Eb major nocturnal, 62 bpm)
  {
    bars: [
      { lh: [39, 46, 51, 55, 46, 51, 55, 51], rh: [[70, 2], null, [75, 1.5], null, [74, 1], [70, 2], null, null] },
      { lh: [48, 55, 60, 63, 55, 60, 63, 60], rh: [[72, 2], null, [75, 1], [79, 1.5], null, [77, 1.5], null, [75, 1]] },
      { lh: [44, 51, 56, 60, 51, 56, 60, 56], rh: [[75, 2.5], null, null, [72, 1], [70, 1.5], null, [68, 1.5], null] },
      { lh: [46, 53, 58, 62, 53, 58, 62, 58], rh: [[70, 2.5], null, null, [74, 1], [72, 1.5], null, [70, 2], null] },
    ],
  },
  // 7: Nắng Nhạt Bên Cửa Sổ (D major bright & tender, 76 bpm)
  {
    bars: [
      { lh: [38, 45, 50, 54, 57, 54, 50, 45], rh: [[74, 1.5], null, [78, 1], [81, 1.5], null, [79, 1], [78, 1.5], null] },
      { lh: [47, 54, 59, 62, 54, 59, 62, 59], rh: [[74, 2], null, [71, 1], [74, 1.5], null, [76, 1.5], null, [74, 1]] },
      { lh: [43, 50, 55, 59, 50, 55, 59, 55], rh: [[79, 2], null, [78, 1], [76, 1.5], null, [74, 1.5], null, [71, 1]] },
      { lh: [45, 52, 57, 61, 52, 57, 61, 57], rh: [[76, 2.5], null, null, [74, 1], [73, 1.5], null, [74, 2], null] },
    ],
  },
  // 8: Dòng Sông Ký Ức (Bb major nostalgic, 70 bpm)
  {
    bars: [
      { lh: [46, 53, 58, 62, 53, 58, 62, 58], rh: [[74, 2], null, [70, 1], [74, 1.5], null, [77, 1.5], null, [75, 1]] },
      { lh: [43, 50, 55, 58, 50, 55, 58, 55], rh: [[74, 2], null, [70, 1], [67, 1.5], null, [70, 2], null, null] },
      { lh: [39, 46, 51, 55, 46, 51, 55, 51], rh: [[75, 2], null, [74, 1], [72, 1.5], null, [70, 1.5], null, [72, 1]] },
      { lh: [41, 48, 53, 57, 48, 53, 57, 53], rh: [[72, 2.5], null, null, [70, 1], [69, 1.5], null, [70, 2], null] },
    ],
  },
  // 9: Bình Minh Trên Đảo Nhỏ (Pentatonic hopeful, 82 bpm)
  {
    bars: [
      { lh: [48, 55, 60, 62, 64, 62, 60, 55], rh: [[72, 1.5], null, [74, 1], [76, 1.5], null, [79, 1.5], null, [76, 1]] },
      { lh: [45, 52, 57, 60, 64, 60, 57, 52], rh: [[76, 2], null, [74, 1], [72, 1.5], null, [69, 2], null, null] },
      { lh: [41, 48, 53, 57, 60, 57, 53, 48], rh: [[72, 1.5], null, [74, 1], [76, 1.5], null, [79, 1], [81, 1.5], null] },
      { lh: [43, 50, 55, 57, 59, 57, 55, 50], rh: [[79, 2.5], null, null, [76, 1], [74, 1.5], null, [72, 2], null] },
    ],
  },
];

/** Create a warm stereo hall impulse response buffer for acoustic piano sustain. */
function createReverbImpulse(ctx: AudioContext, durationSec = 2.3, decay = 2.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const env = Math.pow(1 - i / length, decay);
      const white = (Math.random() * 2 - 1) * env;
      // Gentle wooden room high-frequency damping
      lp = lp * 0.65 + white * 0.35;
      channelData[i] = lp * 0.55;
    }
  }
  return impulse;
}

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private timerId: number | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private volume = 0.75;
  private step = 0;

  private ensureGraph(): { ctx: AudioContext; dry: GainNode; wet: GainNode } {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.ratio.value = 3;

      const master = ctx.createGain();
      master.gain.value = this.volume;

      const dry = ctx.createGain();
      dry.gain.value = 0.76;

      const wet = ctx.createGain();
      wet.gain.value = 0.42;

      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbImpulse(ctx);

      dry.connect(compressor);
      wet.connect(convolver);
      convolver.connect(compressor);
      compressor.connect(master);
      master.connect(ctx.destination);

      this.ctx = ctx;
      this.masterGain = master;
      this.dryGain = dry;
      this.wetGain = wet;
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    return {
      ctx: this.ctx,
      dry: this.dryGain!,
      wet: this.wetGain!,
    };
  }

  public setVolume(nextVolume: number): void {
    const clamped = Math.min(1, Math.max(0, nextVolume));
    this.volume = clamped;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.04);
    }
    if (this.audioEl) {
      this.audioEl.volume = clamped;
    }
  }

  private playPianoNote(midi: number, durationSec: number, velocity: number): void {
    const { ctx, dry, wet } = this.ensureGraph();
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);

    // Subtle stereo image: bass left, treble right
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.45, Math.min(0.45, (midi - 62) / 36));

    // Warm string brightness envelope (brighter on strike, mellow during sustain)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const brightness = Math.min(2800, Math.max(680, freq * (2.6 + velocity * 1.4)));
    filter.frequency.setValueAtTime(brightness, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(360, freq * 1.35), now + durationSec * 0.75);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);

    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    const g3 = ctx.createGain();
    g3.gain.value = 0.07;

    const env = ctx.createGain();
    const peak = 0.08 * velocity;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.018);
    env.gain.exponentialRampToValueAtTime(peak * 0.42, now + 0.22);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    osc3.connect(g3);
    g3.connect(filter);

    filter.connect(env);
    env.connect(panner);
    panner.connect(dry);
    panner.connect(wet);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + durationSec + 0.06);
    osc2.stop(now + durationSec + 0.06);
    osc3.stop(now + durationSec + 0.06);
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
    const piece = PIANO_PIECES[(track.presetIndex ?? 0) % PIANO_PIECES.length];
    const eighthMs = Math.max(240, Math.round((60 / Math.max(40, track.bpm) / 2) * 1000));
    const beatSec = (eighthMs * 2) / 1000;
    this.step = 0;

    const tick = () => {
      const totalSteps = piece.bars.length * 8;
      const pos = this.step % totalSteps;
      const bar = piece.bars[Math.floor(pos / 8)];
      const sub = pos % 8;

      const lhMidi = bar.lh[sub];
      if (lhMidi !== null) {
        const isRoot = sub === 0;
        this.playPianoNote(
          lhMidi,
          beatSec * (isRoot ? 3.2 : 1.9),
          isRoot ? 0.72 : 0.46,
        );
      }

      const rhEvent = bar.rh[sub];
      if (rhEvent) {
        const [midi, beats] = rhEvent;
        this.playPianoNote(midi, beatSec * beats * 1.45, 0.88);
      }

      this.step++;
    };

    tick();
    this.timerId = window.setInterval(tick, eighthMs);
  }

  public async playUrl(url: string, onEnded: () => void): Promise<void> {
    this.stop();
    const audio = new Audio(url);
    audio.volume = this.volume;
    audio.onended = onEnded;
    this.audioEl = audio;
    await audio.play();
  }

  public async playBlob(blob: Blob, onEnded: () => void): Promise<void> {
    this.stop();
    const url = URL.createObjectURL(blob);
    this.objectUrl = url;
    const audio = new Audio(url);
    audio.volume = this.volume;
    audio.onended = onEnded;
    this.audioEl = audio;
    await audio.play();
  }

  public dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.dryGain = null;
      this.wetGain = null;
    }
  }
}
