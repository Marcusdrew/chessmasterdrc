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
  /** Revolutionary mode only — all optional, no-op when omitted so classic
   * mode's rendering is completely unaffected. */
  specialType?: 'energy' | 'power' | 'trap';
  isFrozen?: boolean;
  isShielded?: boolean;
  isTargetable?: boolean;
  onClick: (square: Square) => void;
}

const SPECIAL_ICON: Record<'energy' | 'power' | 'trap', string> = {
  energy: '⚡',
  power: '✨',
  trap: '⚠',
};

const SPECIAL_BG: Record<'energy' | 'power' | 'trap', string> = {
  energy: 'bg-rev-energy/15',
  power: 'bg-rev-power/15',
  trap: 'bg-rev-trap/15',
};

const getSquareName = (row: number, col: number): Square => {
  const files = 'abcdefgh';
  return `${files[col]}${8 - row}` as Square;
};

const ChessSquare: React.FC<ChessSquareProps> = ({
  row, col, piece, isSelected, isValidMove, isCheck, isHintFrom, isHintTo,
  specialType, isFrozen, isShielded, isTargetable, onClick,
}) => {
  const square = getSquareName(row, col);
  const isLight = (row + col) % 2 === 0;
  const symbol = getPieceSymbol(piece);

  return (
    <motion.div
      className={`
        relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150
        ${isLight ? 'bg-chess-light' : 'bg-chess-dark'}
        ${specialType ? SPECIAL_BG[specialType] : ''}
        ${isSelected ? 'ring-2 ring-chess-selected ring-inset' : ''}
        ${isCheck ? 'ring-2 ring-chess-check ring-inset bg-chess-check/20' : ''}
        ${isHintFrom ? 'ring-4 ring-amber-400 ring-inset !bg-amber-300/60' : ''}
        ${isHintTo ? 'ring-4 ring-emerald-500 ring-inset !bg-emerald-300/50' : ''}
        ${isTargetable ? 'ring-2 ring-rev-power ring-inset animate-pulse' : ''}
        hover:brightness-110
      `}
      onClick={() => onClick(square)}
      whileTap={{ scale: 0.95 }}
    >
      {/* Special square marker — small and corner-anchored so it never
          competes with the piece glyph for attention */}
      {specialType && (
        <span className="absolute top-0.5 left-0.5 text-[10px] leading-none opacity-70 pointer-events-none">
          {SPECIAL_ICON[specialType]}
        </span>
      )}

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
            piece?.color === 'w' ? 'chess-piece-w' : 'chess-piece-b'
          } ${isSelected ? 'scale-110' : ''} ${isFrozen ? 'opacity-50' : ''}`}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {symbol}
        </motion.span>
      )}

      {/* Frozen / shielded overlay badges */}
      {isFrozen && (
        <span className="absolute bottom-0 right-0.5 text-xs leading-none pointer-events-none" title="Frozen">❄️</span>
      )}
      {isShielded && (
        <span className="absolute bottom-0 right-0.5 text-xs leading-none pointer-events-none" title="Shielded">🛡️</span>
      )}

    </motion.div>
  );
};

export default ChessSquare;
