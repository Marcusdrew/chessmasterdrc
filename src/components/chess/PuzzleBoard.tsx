import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getPieceSymbol } from '@/lib/chessPieces';
import { useSensations } from '@/hooks/useSensations';

interface PuzzleBoardProps {
  fen: string;
  solution: { from: string; to: string; promotion?: string }[];
  hint: string;
}

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

function squareToCoords(sq: string): [number, number] {
  const c = sq.charCodeAt(0) - 97;
  const r = 8 - parseInt(sq[1]);
  return [r, c];
}

function coordsToSquare(r: number, c: number): string {
  return String.fromCharCode(97 + c) + (8 - r);
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ fen, solution, hint }) => {
  const { t } = useTranslation();
  const { triggerFeedback } = useSensations();
  const [board, setBoard] = useState(() => fenToBoard(fen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [solvedSteps, setSolvedSteps] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [showHint, setShowHint] = useState(false);
  const files = 'abcdefgh';
  const turn = fen.split(' ')[1] || 'w';

  const handleClick = useCallback((r: number, c: number) => {
    if (status !== 'playing') return;
    const sq = coordsToSquare(r, c);
    const piece = board[r][c];

    if (selectedSquare) {
      // Try move
      const expectedMove = solution[solvedSteps];
      if (selectedSquare === expectedMove.from && sq === expectedMove.to) {
        // Correct!
        const [fromR, fromC] = squareToCoords(expectedMove.from);
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = newBoard[fromR][fromC];
        newBoard[fromR][fromC] = null;
        setBoard(newBoard);
        setSelectedSquare(null);

        if (solvedSteps + 1 >= solution.length) {
          setStatus('correct');
          setSolvedSteps(solvedSteps + 1);
          triggerFeedback('puzzleSolved');
        } else {
          setSolvedSteps(solvedSteps + 1);
          triggerFeedback('move');
        }
      } else if (piece && piece.color === turn) {
        setSelectedSquare(sq);
      } else {
        setStatus('wrong');
        setSelectedSquare(null);
        triggerFeedback('puzzleWrong');
        setTimeout(() => setStatus('playing'), 1500);
      }
    } else {
      if (piece && piece.color === turn) {
        setSelectedSquare(sq);
      }
    }
  }, [board, selectedSquare, solution, solvedSteps, status, turn, triggerFeedback]);

  const resetPuzzle = () => {
    setBoard(fenToBoard(fen));
    setSelectedSquare(null);
    setSolvedSteps(0);
    setStatus('playing');
    setShowHint(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="border border-border rounded overflow-hidden">
        <div className="flex ml-4">
          {files.split('').map(f => (
            <div key={f} className="w-9 text-center text-[9px] font-body text-muted-foreground">{f}</div>
          ))}
        </div>
        <div className="flex">
          <div className="flex flex-col">
            {[8,7,6,5,4,3,2,1].map(r => (
              <div key={r} className="w-4 h-9 flex items-center justify-center text-[9px] font-body text-muted-foreground">{r}</div>
            ))}
          </div>
          <div className="grid grid-cols-8">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isLight = (r + c) % 2 === 0;
                const sq = coordsToSquare(r, c);
                const isSelected = selectedSquare === sq;
                const symbol = getPieceSymbol(piece);
                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleClick(r, c)}
                    className={`w-9 h-9 flex items-center justify-center text-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent/40' : isLight ? 'bg-chess-light' : 'bg-chess-dark'
                    }`}
                  >
                    {symbol && (
                      <span className={piece?.color === 'w' ? 'chess-piece-w' : 'chess-piece-b'}>
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

      {/* Status */}
      {status === 'correct' && (
        <div className="text-sm font-body font-medium text-chess-valid flex items-center gap-1">
          ✓ {t('puzzleBoard.solved')}
        </div>
      )}
      {status === 'wrong' && (
        <div className="text-sm font-body font-medium text-destructive flex items-center gap-1">
          ✗ {t('puzzleBoard.wrongMove')}
        </div>
      )}
      {status === 'playing' && (
        <p className="text-xs font-body text-muted-foreground">
          {t('puzzleBoard.turnPrompt', { color: turn === 'w' ? t('moveHistory.white') : t('moveHistory.black') })}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!showHint && status === 'playing' && (
          <button
            onClick={() => setShowHint(true)}
            className="px-3 py-1 text-xs font-body rounded border border-border text-accent hover:bg-accent/10 transition-colors"
          >
            💡 {t('puzzleBoard.hintButton')}
          </button>
        )}
        <button
          onClick={resetPuzzle}
          className="px-3 py-1 text-xs font-body rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          ↩ {t('puzzleBoard.restart')}
        </button>
      </div>

      {showHint && status === 'playing' && (
        <p className="text-xs font-body text-accent bg-accent/10 px-3 py-1.5 rounded">
          💡 {hint}
        </p>
      )}

      {status === 'correct' && (
        <p className="text-xs font-body text-muted-foreground">
          {t('puzzleBoard.solution')} {solution.map(s => `${s.from} → ${s.to}`).join(', ')}
        </p>
      )}
    </div>
  );
};

export default PuzzleBoard;
