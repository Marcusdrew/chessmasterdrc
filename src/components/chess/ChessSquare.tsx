import React from 'react';
import { motion } from 'framer-motion';
import { Square } from 'chess.js';
import { getPieceSymbol } from '@/lib/chessPieces';
import { REVOLUTIONARY_SQUARES, SpecialSquareType } from '@/lib/chessPieces';

interface ChessSquareProps {
  row: number;
  col: number;
  piece: { type: string; color: string } | null;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
  isRevolutionary: boolean;
  onClick: (square: Square) => void;
}

const getSquareName = (row: number, col: number): Square => {
  const files = 'abcdefgh';
  return `${files[col]}${8 - row}` as Square;
};

const getSpecialType = (square: string): SpecialSquareType | null => {
  const special = REVOLUTIONARY_SQUARES.find(s => s.position === square);
  return special?.type || null;
};

const specialColors: Record<SpecialSquareType, string> = {
  energy: 'bg-neon-cyan/10 border-neon-cyan/30',
  power: 'bg-neon-magenta/10 border-neon-magenta/30',
  trap: 'bg-destructive/10 border-destructive/30',
};

const specialIcons: Record<SpecialSquareType, string> = {
  energy: '⚡',
  power: '🔮',
  trap: '💀',
};

const ChessSquare: React.FC<ChessSquareProps> = ({
  row, col, piece, isSelected, isValidMove, isCheck, isRevolutionary, onClick,
}) => {
  const square = getSquareName(row, col);
  const isLight = (row + col) % 2 === 0;
  const symbol = getPieceSymbol(piece);
  const specialType = isRevolutionary ? getSpecialType(square) : null;

  return (
    <motion.div
      className={`
        relative flex items-center justify-center cursor-pointer
        transition-colors duration-150 select-none
        ${isLight ? 'bg-cyber-elevated' : 'bg-cyber-dark'}
        ${isSelected ? 'ring-2 ring-primary ring-inset glow-cyan' : ''}
        ${isCheck ? 'ring-2 ring-destructive ring-inset' : ''}
        ${specialType ? specialColors[specialType] : ''}
        hover:brightness-125
      `}
      onClick={() => onClick(square)}
      whileTap={{ scale: 0.95 }}
    >
      {/* Valid move indicator */}
      {isValidMove && !piece && (
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-primary/40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      )}
      
      {/* Capture indicator */}
      {isValidMove && piece && (
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-destructive/60"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Special square icon */}
      {specialType && !piece && (
        <span className="absolute text-xs opacity-30">{specialIcons[specialType]}</span>
      )}

      {/* Piece */}
      {symbol && (
        <motion.span
          className={`
            text-3xl md:text-4xl leading-none
            ${piece?.color === 'w' ? 'text-foreground drop-shadow-[0_0_8px_hsl(185,100%,50%,0.5)]' : 'text-neon-magenta drop-shadow-[0_0_8px_hsl(300,100%,45%,0.5)]'}
            ${isSelected ? 'scale-110' : ''}
          `}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {symbol}
        </motion.span>
      )}

      {/* Coordinate labels */}
      {col === 0 && (
        <span className="absolute top-0.5 left-1 text-[10px] font-body text-muted-foreground/40">
          {8 - row}
        </span>
      )}
      {row === 7 && (
        <span className="absolute bottom-0.5 right-1 text-[10px] font-body text-muted-foreground/40">
          {'abcdefgh'[col]}
        </span>
      )}
    </motion.div>
  );
};

export default ChessSquare;
