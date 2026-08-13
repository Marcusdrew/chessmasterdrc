import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPieceSymbol } from '@/lib/chessPieces';

interface TechniqueBoardProps {
  steps: { fen: string; label: string }[];
}

// Parse FEN to get board array
function fenToBoard(fen: string): ({ type: string; color: string } | null)[][] {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const cells: ({ type: string; color: string } | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) cells.push(null);
      } else {
        cells.push({ type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b' });
      }
    }
    return cells;
  });
}

const TechniqueBoard: React.FC<TechniqueBoardProps> = ({ steps }) => {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const current = steps[stepIndex];
  const board = fenToBoard(current.fen);
  const files = 'abcdefgh';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mini board */}
      <div className="border border-border rounded overflow-hidden">
        {/* Top files */}
        <div className="flex ml-4">
          {files.split('').map(f => (
            <div key={f} className="w-8 text-center text-[9px] font-body text-muted-foreground">{f}</div>
          ))}
        </div>
        <div className="flex">
          {/* Left ranks */}
          <div className="flex flex-col">
            {[8,7,6,5,4,3,2,1].map(r => (
              <div key={r} className="w-4 h-8 flex items-center justify-center text-[9px] font-body text-muted-foreground">{r}</div>
            ))}
          </div>
          {/* Board grid */}
          <div className="grid grid-cols-8">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isLight = (r + c) % 2 === 0;
                const symbol = getPieceSymbol(piece);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-8 h-8 flex items-center justify-center text-lg ${isLight ? 'bg-chess-light' : 'bg-chess-dark'}`}
                  >
                    {symbol && (
                      <span className={piece?.color === 'w' ? 'text-chess-white-piece' : 'text-chess-black-piece'}>
                        {symbol}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Step label */}
      <p className="text-xs font-body text-foreground font-medium text-center">{current.label}</p>

      {/* Step controls */}
      {steps.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            disabled={stepIndex === 0}
            className="px-2 py-1 text-xs font-body rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            ◀ {t('techniqueBoard.prev')}
          </button>
          <span className="text-xs font-body text-muted-foreground">
            {stepIndex + 1} / {steps.length}
          </span>
          <button
            onClick={() => setStepIndex(Math.min(steps.length - 1, stepIndex + 1))}
            disabled={stepIndex === steps.length - 1}
            className="px-2 py-1 text-xs font-body rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            {t('techniqueBoard.next')} ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default TechniqueBoard;
