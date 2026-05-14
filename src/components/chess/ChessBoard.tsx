import React from 'react';
import { motion } from 'framer-motion';
import { Square } from 'chess.js';
import ChessSquare from './ChessSquare';

interface ChessBoardProps {
  board: ({ type: string; color: string; square: string } | null)[][];
  selectedSquare: Square | null;
  validMoves: string[];
  isInCheck: boolean;
  currentTurn: string;
  playerColor: 'w' | 'b';
  hint?: { from: string; to: string } | null;
  onSquareClick: (square: Square) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board, selectedSquare, validMoves, isInCheck, currentTurn, playerColor, hint, onSquareClick,
}) => {
  const findKingSquare = (): string | null => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === currentTurn) {
          return piece.square;
        }
      }
    }
    return null;
  };

  const kingSquare = isInCheck ? findKingSquare() : null;

  const displayBoard = playerColor === 'b'
    ? [...board].reverse().map(row => [...row].reverse())
    : board;

  // Coordinate labels
  const files = playerColor === 'b' ? 'hgfedcba' : 'abcdefgh';
  const ranks = playerColor === 'b' ? '12345678' : '87654321';

  return (
    <motion.div
      className="relative rounded-lg overflow-hidden chess-board-shadow border border-border"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top file labels */}
      <div className="flex ml-6">
        {files.split('').map(f => (
          <div key={`top-${f}`} className="flex-1 text-center text-[11px] font-body text-muted-foreground py-0.5">
            {f}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Left rank labels */}
        <div className="flex flex-col w-6">
          {ranks.split('').map(r => (
            <div key={`left-${r}`} className="flex-1 flex items-center justify-center text-[11px] font-body text-muted-foreground">
              {r}
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="grid grid-cols-8 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] lg:w-[560px] lg:h-[560px]">
          {displayBoard.map((row, rowIdx) =>
            row.map((piece, colIdx) => {
              const actualRow = playerColor === 'b' ? 7 - rowIdx : rowIdx;
              const actualCol = playerColor === 'b' ? 7 - colIdx : colIdx;
              const square = `${'abcdefgh'[actualCol]}${8 - actualRow}` as Square;
              return (
                <ChessSquare
                  key={square}
                  row={actualRow}
                  col={actualCol}
                  piece={piece}
                  isSelected={selectedSquare === square}
                  isValidMove={validMoves.includes(square)}
                  isCheck={kingSquare === square}
                  isHintFrom={hint?.from === square}
                  isHintTo={hint?.to === square}
                  onClick={onSquareClick}
                />
              );
            })
          )}
        </div>

        {/* Right rank labels */}
        <div className="flex flex-col w-6">
          {ranks.split('').map(r => (
            <div key={`right-${r}`} className="flex-1 flex items-center justify-center text-[11px] font-body text-muted-foreground">
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom file labels */}
      <div className="flex ml-6">
        {files.split('').map(f => (
          <div key={`bottom-${f}`} className="flex-1 text-center text-[11px] font-body text-muted-foreground py-0.5">
            {f}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ChessBoard;
