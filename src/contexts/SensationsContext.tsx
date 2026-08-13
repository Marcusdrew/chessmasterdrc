import React, { useCallback, useState, useEffect } from 'react';
import { playSoundEvent, type SoundEvent } from '@/lib/sound';
import { triggerHaptic } from '@/lib/haptics';
import { SensationsContext } from './sensationsContextObject';

const SOUND_KEY = 'chessmaster_sound_enabled';
const VIBRATION_KEY = 'chessmaster_vibration_enabled';

function readBool(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? defaultValue : raw === 'true';
  } catch {
    return defaultValue;
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable (private mode, quota, ...) — preference just
    // won't persist across sessions, not worth surfacing to the player.
  }
}

export const SensationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => readBool(SOUND_KEY, true));
  const [vibrationEnabled, setVibrationEnabled] = useState(() => readBool(VIBRATION_KEY, true));

  useEffect(() => { writeBool(SOUND_KEY, soundEnabled); }, [soundEnabled]);
  useEffect(() => { writeBool(VIBRATION_KEY, vibrationEnabled); }, [vibrationEnabled]);

  const toggleSound = useCallback(() => setSoundEnabled(v => !v), []);
  const toggleVibration = useCallback(() => setVibrationEnabled(v => !v), []);

  const triggerFeedback = useCallback(
    (event: SoundEvent) => {
      if (soundEnabled) playSoundEvent(event);
      if (vibrationEnabled) triggerHaptic(event);
    },
    [soundEnabled, vibrationEnabled]
  );

  return (
    <SensationsContext.Provider
      value={{ soundEnabled, vibrationEnabled, toggleSound, toggleVibration, triggerFeedback }}
    >
      {children}
    </SensationsContext.Provider>
  );
};
