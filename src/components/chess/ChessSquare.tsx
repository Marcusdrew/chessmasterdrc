import React from 'react';
import { motion } from 'framer-motion';
import { Square } from 'chess.js';
import { getPieceSymbol } from '@/lib/chessPieces';

interface ChessSquareProps {
  row: number;
  col: number;
  piece: { type: string; color: string } | null;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
  isHintFrom?: boolean;
  isHintTo?: boolean;
  onClick: (square: Square) => void;
}

const getSquareName = (row: number, col: number): Square => {
  const files = 'abcdefgh';
  return `${files[col]}${8 - row}` as Square;
};

const ChessSquare: React.FC<ChessSquareProps> = ({
  row, col, piece, isSelected, isValidMove, isCheck, isHintFrom, isHintTo, onClick,
}) => {
  const square = getSquareName(row, col);
  const isLight = (row + col) % 2 === 0;
  const symbol = getPieceSymbol(piece);

  return (
    <motion.div
      className={`
        relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150
        ${isLight ? 'bg-chess-light' : 'bg-chess-dark'}
        ${isSelected ? 'ring-2 ring-chess-selected ring-inset' : ''}
        ${isCheck ? 'ring-2 ring-chess-check ring-inset bg-chess-check/20' : ''}
        ${isHintFrom ? 'ring-4 ring-amber-400 ring-inset !bg-amber-300/60' : ''}
        ${isHintTo ? 'ring-4 ring-emerald-500 ring-inset !bg-emerald-300/50' : ''}
        hover:brightness-110
      `}
      onClick={() => onClick(square)}
      whileTap={{ scale: 0.95 }}
    >
      {/* Hint pulse overlay */}
      {(isHintFrom || isHintTo) && (
        <motion.div
          className={`absolute inset-0 ${isHintFrom ? 'bg-amber-400/30' : 'bg-emerald-400/30'} pointer-events-none`}
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      {/* Valid move indicator */}
      {isValidMove && !piece && (
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-chess-valid/50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      )}

      {/* Capture indicator */}
      {isValidMove && piece && (
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-chess-check/60"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Piece */}
      {symbol && (
        <motion.span
          className={`text-3xl md:text-4xl leading-none ${
            piece?.color === 'w' ? 'text-chess-white-piece' : 'text-chess-black-piece'
          } ${isSelected ? 'scale-110' : ''}`}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {symbol}
        </motion.span>
      )}

    </motion.div>
  );
};

export default ChessSquare;
