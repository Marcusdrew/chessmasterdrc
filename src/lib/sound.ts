// Synthesizes every in-game sound with the Web Audio API rather than shipping
// audio files — keeps the bundle tiny, avoids any licensing question around
// sourced sound effects, and sounds identical on every platform Capacitor
// targets. All tones use short envelopes (quick attack, exponential decay)
// so they feel like plucked notes rather than raw beeps switching on/off.

export type SoundEvent =
  | 'move'
  | 'capture'
  | 'castle'
  | 'promote'
  | 'check'
  | 'checkmateWin'
  | 'checkmateLoss'
  | 'draw'
  | 'illegal'
  | 'puzzleSolved'
  | 'puzzleWrong'
  | 'undo';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    audioCtx = new Ctor();
  }
  // Browsers create/keep contexts suspended until a user gesture; every call
  // site here runs inside a click handler, so this resume is normally a
  // same-tick no-op, and harmless if it isn't.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

interface ToneOptions {
  frequency: number;
  duration: number; // seconds
  type?: OscillatorType;
  volume?: number; // 0-1 peak gain
  delay?: number; // seconds from now
}

function scheduleTone(ctx: AudioContext, { frequency, duration, type = 'sine', volume = 0.2, delay = 0 }: ToneOptions) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;

  const startTime = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

// Standard note frequencies (Hz) used to keep the little melodies below
// actually in tune with each other instead of arbitrary numbers.
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, C6 = 1046.5;
const A4 = 440, G4 = 392, F4 = 349.23, E4 = 329.63, D4 = 293.66;

export interface ClassifiableMove {
  captured?: string;
  promotion?: string;
  flags: string;
}

/**
 * Picks a single sound/haptic event for a move, in priority order —
 * checkmate and check take priority over what the move itself was (a
 * capture that also delivers mate plays the mate sound, not both), matching
 * how most chess apps only ever play one sound per move.
 */
export function classifyMoveSound(
  move: ClassifiableMove,
  isCheckAfterMove: boolean,
  gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate',
  winner: 'w' | 'b' | null,
  perspectiveColor: 'w' | 'b'
): SoundEvent {
  if (gameStatus === 'checkmate') {
    return winner === perspectiveColor ? 'checkmateWin' : 'checkmateLoss';
  }
  if (gameStatus === 'draw' || gameStatus === 'stalemate') return 'draw';
  if (isCheckAfterMove) return 'check';
  if (move.flags.includes('k') || move.flags.includes('q')) return 'castle';
  if (move.promotion) return 'promote';
  if (move.captured) return 'capture';
  return 'move';
}

export function playSoundEvent(event: SoundEvent): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (event) {
    case 'move':
      scheduleTone(ctx, { frequency: A4, duration: 0.09, type: 'sine', volume: 0.18 });
      break;

    case 'capture':
      scheduleTone(ctx, { frequency: E4, duration: 0.1, type: 'triangle', volume: 0.22 });
      scheduleTone(ctx, { frequency: D4, duration: 0.09, type: 'triangle', volume: 0.15, delay: 0.035 });
      break;

    case 'castle':
      scheduleTone(ctx, { frequency: G4, duration: 0.09, type: 'sine', volume: 0.16 });
      scheduleTone(ctx, { frequency: C5, duration: 0.13, type: 'sine', volume: 0.16, delay: 0.07 });
      break;

    case 'promote':
      [C5, E5, G5].forEach((f, i) =>
        scheduleTone(ctx, { frequency: f, duration: 0.15, type: 'triangle', volume: 0.18, delay: i * 0.07 })
      );
      break;

    case 'check':
      scheduleTone(ctx, { frequency: G5, duration: 0.07, type: 'square', volume: 0.1 });
      scheduleTone(ctx, { frequency: G5, duration: 0.07, type: 'square', volume: 0.1, delay: 0.11 });
      break;

    case 'checkmateWin':
      [C5, E5, G5, C6].forEach((f, i) =>
        scheduleTone(ctx, { frequency: f, duration: 0.22, type: 'triangle', volume: 0.2, delay: i * 0.11 })
      );
      break;

    case 'checkmateLoss':
      [G4, F4, D4].forEach((f, i) =>
        scheduleTone(ctx, { frequency: f, duration: 0.3, type: 'sine', volume: 0.18, delay: i * 0.14 })
      );
      break;

    case 'draw':
      scheduleTone(ctx, { frequency: F4, duration: 0.2, type: 'sine', volume: 0.16 });
      scheduleTone(ctx, { frequency: F4, duration: 0.2, type: 'sine', volume: 0.16, delay: 0.24 });
      break;

    case 'illegal':
      scheduleTone(ctx, { frequency: 150, duration: 0.1, type: 'square', volume: 0.07 });
      break;

    case 'puzzleSolved':
      [C5, E5, G5, C6].forEach((f, i) =>
        scheduleTone(ctx, { frequency: f, duration: 0.15, type: 'sine', volume: 0.2, delay: i * 0.075 })
      );
      break;

    case 'puzzleWrong':
      scheduleTone(ctx, { frequency: D4, duration: 0.2, type: 'sawtooth', volume: 0.13 });
      break;

    case 'undo':
      scheduleTone(ctx, { frequency: F5, duration: 0.07, type: 'sine', volume: 0.12 });
      break;
  }
}
