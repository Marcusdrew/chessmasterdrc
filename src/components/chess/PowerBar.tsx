import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Color } from 'chess.js';
import { POWERS, POWER_TYPES, type PowerType, type RevolutionaryState, type LogEntry, canActivatePower } from '@/lib/revolutionaryMode';

const POWER_ICON: Record<PowerType, string> = {
  shield: '🛡️',
  freeze: '❄️',
  evolve: '🔮',
  elan: '⚡',
};

interface PowerBarProps {
  revState: RevolutionaryState;
  color: Color;
  isMyTurn: boolean;
  targetingPower: PowerType | null;
  onActivate: (power: PowerType) => void;
}

const PowerBar: React.FC<PowerBarProps> = ({ revState, color, isMyTurn, targetingPower, onActivate }) => {
  const { t } = useTranslation();
  const p = revState[color];
  const maxEnergyForBar = 100; // biggest single grant (a king) — keeps the bar meaningful without an arbitrary cap

  return (
    <div className="space-y-3">
      {/* Energy meter */}
      <div>
        <div className="flex items-center justify-between text-xs font-body text-muted-foreground mb-1">
          <span>{t('revolutionary.energyLabel')}</span>
          <span className="font-semibold text-rev-energy">{p.energy}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-rev-energy transition-all duration-500"
            style={{ width: `${Math.min(100, (p.energy / maxEnergyForBar) * 100)}%` }}
          />
        </div>
      </div>

      {/* Power buttons */}
      <div className="grid grid-cols-2 gap-2">
        {POWER_TYPES.map(power => {
          const def = POWERS[power];
          const usesLeft = p.usesRemaining[power];
          const hasFree = p.freeCharges[power] > 0;
          const can = isMyTurn && canActivatePower(revState, color, power);
          const active = targetingPower === power;
          return (
            <button
              key={power}
              disabled={!can}
              onClick={() => onActivate(power)}
              title={t(`revolutionary.powers.${power}.description`)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-xs font-body transition-all ${
                active
                  ? 'border-rev-power bg-rev-power/15 text-foreground'
                  : can
                  ? 'border-border bg-card text-foreground hover:border-rev-power/60'
                  : 'border-border/50 bg-card/50 text-muted-foreground/50 cursor-not-allowed'
              }`}
            >
              <span className="text-lg leading-none">{POWER_ICON[power]}</span>
              <span className="font-medium">{t(`revolutionary.powers.${power}.name`)}</span>
              <span className="text-[10px] opacity-75">
                {hasFree
                  ? `✨ ${t('revolutionary.usesLeft', { count: usesLeft })}`
                  : usesLeft <= 0
                  ? t('revolutionary.noUsesLeft')
                  : `${def.cost} ⚡ · ${t('revolutionary.usesLeft', { count: usesLeft })}`}
              </span>
            </button>
          );
        })}
      </div>
      {targetingPower && (
        <button
          onClick={() => onActivate(targetingPower)}
          className="w-full text-[11px] font-body text-muted-foreground hover:text-foreground underline"
        >
          {t('revolutionary.cancel')}
        </button>
      )}
    </div>
  );
};

interface RevolutionaryLogProps {
  entries: LogEntry[];
}

export const RevolutionaryLog: React.FC<RevolutionaryLogProps> = ({ entries }) => {
  const { t } = useTranslation();

  const describe = (entry: LogEntry): string => {
    switch (entry.kind) {
      case 'energyGained':
        return t('revolutionary.log.energyGained', {
          piece: t(`revolutionary.pieceNames.${entry.piece}`),
          square: entry.square,
          amount: entry.amount,
        });
      case 'powerCharged':
        return t('revolutionary.log.powerCharged', {
          square: entry.square,
          power: t(`revolutionary.powers.${entry.power}.name`),
        });
      case 'trapTriggered':
        return t('revolutionary.log.trapTriggered', { square: entry.square });
      case 'shieldActivated':
        return t('revolutionary.log.shieldActivated', { square: entry.square });
      case 'freezeActivated':
        return t('revolutionary.log.freezeActivated', { square: entry.square });
      case 'evolveActivated':
        return t('revolutionary.log.evolveActivated', { square: entry.square });
      case 'elanActivated':
        return t('revolutionary.log.elanActivated');
      default:
        return '';
    }
  };

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto text-xs font-body">
      {entries.length === 0 ? (
        <p className="text-muted-foreground italic">{t('revolutionary.noLog')}</p>
      ) : (
        entries.slice(0, 12).map((entry, i) => (
          <p key={i} className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {entry.kind === 'trapTriggered' ? '⚠️' : entry.kind === 'energyGained' ? '⚡' : entry.kind === 'powerCharged' ? '✨' : '•'} {describe(entry)}
          </p>
        ))
      )}
    </div>
  );
};

export default PowerBar;
