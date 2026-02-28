import React from 'react';
import { motion } from 'framer-motion';
import { Square } from 'chess.js';
import ChessSquare from './ChessSquare';
import { GameMode } from '@/hooks/useChessGame';

interface ChessBoardProps {
  board: ({ type: string; color: string; square: string } | null)[][];
  selectedSquare: Square | null;
  validMoves: string[];
  isInCheck: boolean;
  currentTurn: string;
  mode: GameMode;
  onSquareClick: (square: Square) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board, selectedSquare, validMoves, isInCheck, currentTurn, mode, onSquareClick,
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

  return (
    <motion.div
      className="relative cyber-border rounded-lg overflow-hidden glow-cyan"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line" />
      </div>

      <div className="grid grid-cols-8 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] lg:w-[560px] lg:h-[560px]">
        {board.map((row, rowIdx) =>
          row.map((piece, colIdx) => {
            const square = `${'abcdefgh'[colIdx]}${8 - rowIdx}` as Square;
            return (
              <ChessSquare
                key={square}
                row={rowIdx}
                col={colIdx}
                piece={piece}
                isSelected={selectedSquare === square}
                isValidMove={validMoves.includes(square)}
                isCheck={kingSquare === square}
                isRevolutionary={mode === 'revolutionary'}
                onClick={onSquareClick}
              />
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default ChessBoard;
