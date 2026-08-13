import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { SoundEvent } from './sound';

// Reuses the same event names as sound.ts so the two channels never drift
// out of sync — every place that plays a sound triggers the matching haptic
// through the same event name.

async function safe(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch {
    // Capacitor's web fallback throws when the browser has no Vibration API
    // at all (notably iOS Safari/WKWebView outside the native app shell).
    // Sound already carries the feedback in that case, so this is an
    // expected, silent no-op rather than something to surface.
  }
}

export function triggerHaptic(event: SoundEvent): void {
  switch (event) {
    case 'move':
    case 'draw':
    case 'undo':
      void safe(() => Haptics.impact({ style: ImpactStyle.Light }));
      break;

    case 'capture':
    case 'castle':
      void safe(() => Haptics.impact({ style: ImpactStyle.Medium }));
      break;

    case 'promote':
    case 'puzzleSolved':
    case 'checkmateWin':
      void safe(() => Haptics.notification({ type: NotificationType.Success }));
      break;

    case 'check':
      void safe(() => Haptics.notification({ type: NotificationType.Warning }));
      break;

    case 'checkmateLoss':
    case 'puzzleWrong':
    case 'illegal':
      void safe(() => Haptics.notification({ type: NotificationType.Error }));
      break;
  }
}
