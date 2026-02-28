import React from 'react';

// Unicode chess pieces with cyber styling
const pieces: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

export const getPieceSymbol = (piece: { type: string; color: string } | null): string | null => {
  if (!piece) return null;
  const key = `${piece.color === 'w' ? 'w' : 'b'}${piece.type.toUpperCase()}`;
  return pieces[key] || null;
};

export const getPieceName = (type: string): string => {
  const names: Record<string, string> = {
    k: 'Roi', q: 'Reine', r: 'Tour', b: 'Fou', n: 'Cavalier', p: 'Pion',
  };
  return names[type] || type;
};

// Energy costs for revolutionary mode
export const PIECE_ENERGY: Record<string, number> = {
  k: 100, q: 90, r: 70, b: 60, n: 65, p: 30,
};

// Special powers
export type PowerType = 'shield' | 'teleport' | 'freeze' | 'evolve';

export interface SpecialPower {
  id: PowerType;
  name: string;
  description: string;
  icon: string;
  cost: number;
  usesPerGame: number;
}

export const SPECIAL_POWERS: SpecialPower[] = [
  { id: 'shield', name: 'Bouclier', description: 'Protège une pièce pendant 1 tour', icon: '🛡️', cost: 20, usesPerGame: 2 },
  { id: 'teleport', name: 'Téléport', description: 'Déplace une pièce sur une case libre', icon: '⚡', cost: 35, usesPerGame: 1 },
  { id: 'freeze', name: 'Gel', description: 'Immobilise une pièce adverse 1 tour', icon: '❄️', cost: 25, usesPerGame: 2 },
  { id: 'evolve', name: 'Évolution', description: 'Améliore un pion en cavalier', icon: '🔮', cost: 40, usesPerGame: 1 },
];

// Special squares on the board
export type SpecialSquareType = 'energy' | 'power' | 'trap';

export interface SpecialSquare {
  position: string;
  type: SpecialSquareType;
}

export const REVOLUTIONARY_SQUARES: SpecialSquare[] = [
  { position: 'c3', type: 'energy' },
  { position: 'f3', type: 'energy' },
  { position: 'c6', type: 'energy' },
  { position: 'f6', type: 'energy' },
  { position: 'd4', type: 'power' },
  { position: 'e5', type: 'power' },
  { position: 'b2', type: 'trap' },
  { position: 'g7', type: 'trap' },
];
