import { useCallback, useEffect, useState } from 'react';

export const BOARD_THEMES = ['classique', 'vert', 'bleu', 'ardoise', 'nuit'] as const;
export const PIECE_THEMES = ['classique', 'contraste', 'creme', 'saphir'] as const;

export type BoardTheme = (typeof BOARD_THEMES)[number];
export type PieceTheme = (typeof PIECE_THEMES)[number];

const BOARD_KEY = 'chess-board-theme';
const PIECE_KEY = 'chess-piece-theme';

const read = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v as T) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
};

const apply = (board: BoardTheme, piece: PieceTheme) => {
  const root = document.documentElement;
  root.dataset.boardTheme = board;
  root.dataset.pieceTheme = piece;
};

/**
 * Board + piece color themes, persisted in localStorage and applied
 * globally via data attributes on <html> (see src/index.css).
 */
export const useChessTheme = () => {
  const [boardTheme, setBoardThemeState] = useState<BoardTheme>(() =>
    read(BOARD_KEY, BOARD_THEMES, 'classique'),
  );
  const [pieceTheme, setPieceThemeState] = useState<PieceTheme>(() =>
    read(PIECE_KEY, PIECE_THEMES, 'classique'),
  );

  useEffect(() => {
    apply(boardTheme, pieceTheme);
  }, [boardTheme, pieceTheme]);

  const setBoardTheme = useCallback((t: BoardTheme) => {
    setBoardThemeState(t);
    try { localStorage.setItem(BOARD_KEY, t); } catch { /* ignore */ }
  }, []);

  const setPieceTheme = useCallback((t: PieceTheme) => {
    setPieceThemeState(t);
    try { localStorage.setItem(PIECE_KEY, t); } catch { /* ignore */ }
  }, []);

  return { boardTheme, pieceTheme, setBoardTheme, setPieceTheme };
};
