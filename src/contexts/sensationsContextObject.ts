import { createContext } from 'react';
import type { SoundEvent } from '@/lib/sound';

export interface SensationsContextValue {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  toggleSound: () => void;
  toggleVibration: () => void;
  /** Plays the sound and/or triggers the haptic for this event, respecting
   * each channel's own on/off preference. This is the one function the rest
   * of the app should call — callers never need to check the toggles
   * themselves. */
  triggerFeedback: (event: SoundEvent) => void;
}

export const SensationsContext = createContext<SensationsContextValue | null>(null);
