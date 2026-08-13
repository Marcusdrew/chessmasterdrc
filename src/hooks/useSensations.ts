import { useContext } from 'react';
import { SensationsContext, type SensationsContextValue } from '@/contexts/sensationsContextObject';

export function useSensations(): SensationsContextValue {
  const ctx = useContext(SensationsContext);
  if (!ctx) {
    throw new Error('useSensations must be used within a SensationsProvider');
  }
  return ctx;
}
