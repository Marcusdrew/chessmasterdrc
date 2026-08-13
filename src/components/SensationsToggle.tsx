import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSensations } from '@/hooks/useSensations';

const SensationsToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { soundEnabled, vibrationEnabled, toggleSound, toggleVibration } = useSensations();

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      <button
        onClick={toggleSound}
        aria-pressed={soundEnabled}
        aria-label={t('menu.soundToggle')}
        title={t('menu.soundToggle')}
        className={`px-2 py-1 rounded text-sm transition-colors ${
          soundEnabled ? 'text-accent' : 'text-muted-foreground/40 hover:text-muted-foreground'
        }`}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      <button
        onClick={toggleVibration}
        aria-pressed={vibrationEnabled}
        aria-label={t('menu.vibrationToggle')}
        title={t('menu.vibrationToggle')}
        className={`px-2 py-1 rounded text-sm transition-colors ${
          vibrationEnabled ? 'text-accent' : 'text-muted-foreground/40 hover:text-muted-foreground'
        }`}
      >
        📳
      </button>
    </div>
  );
};

export default SensationsToggle;
