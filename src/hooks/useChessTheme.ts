import { useCallback, useEffect, useState } from 'react';
import {
  BOARD_THEMES,
  PIECE_THEMES,
  type BoardTheme,
  type PieceTheme,
} from '@/lib/chessThemes';

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
 * Thème d'échiquier + couleurs de pièces, persistés en localStorage et
 * appliqués globalement via des attributs data sur <html> (cf. src/index.css).
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
