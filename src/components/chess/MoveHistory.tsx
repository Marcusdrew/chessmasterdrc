import React from 'react';
import { Move } from 'chess.js';
import { useTranslation } from 'react-i18next';

interface MoveHistoryProps {
  moveHistory: Move[];
}

const formatMove = (move: Move): string => {
  if (move.san === 'O-O') return 'O-O';
  if (move.san === 'O-O-O') return 'O-O-O';
  return `${move.from} → ${move.to}`;
};

const MoveHistory: React.FC<MoveHistoryProps> = ({ moveHistory }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <h3 className="text-sm font-display font-semibold text-foreground mb-3">
        {t('moveHistory.title')}
      </h3>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border">
              <th className="py-2 text-left w-8">#</th>
              <th className="py-2 text-left">♔ {t('moveHistory.white')}</th>
              <th className="py-2 text-left">♚ {t('moveHistory.black')}</th>
            </tr>
          </thead>
          <tbody>
            {moveHistory.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted-foreground text-xs">
                  {t('moveHistory.noMoves')}
                </td>
              </tr>
            ) : (
              Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 text-muted-foreground">{i + 1}.</td>
                  <td className="py-1.5 text-foreground font-medium">
                    {moveHistory[i * 2] ? formatMove(moveHistory[i * 2]) : ''}
                  </td>
                  <td className="py-1.5 text-foreground font-medium">
                    {moveHistory[i * 2 + 1] ? formatMove(moveHistory[i * 2 + 1]) : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoveHistory;
