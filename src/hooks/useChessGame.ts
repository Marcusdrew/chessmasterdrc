import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { PIECE_ENERGY, REVOLUTIONARY_SQUARES, PowerType } from '@/lib/chessPieces';

export type GameMode = 'classic' | 'revolutionary';

export interface PlayerState {
  energy: number;
  maxEnergy: number;
  powers: Record<PowerType, number>;
  shieldedSquares: string[];
  frozenSquares: string[];
}

export interface GameState {
  mode: GameMode;
  selectedSquare: Square | null;
  validMoves: string[];
  moveHistory: Move[];
  capturedWhite: string[];
  capturedBlack: string[];
  isAiThinking: boolean;
  whitePlayer: PlayerState;
  blackPlayer: PlayerState;
  gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate';
  winner: 'w' | 'b' | null;
}

const initialPlayerState = (): PlayerState => ({
  energy: 100,
  maxEnergy: 100,
  powers: { shield: 2, teleport: 1, freeze: 2, evolve: 1 },
  shieldedSquares: [],
  frozenSquares: [],
});

export const useChessGame = (vsAi: boolean = true) => {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [state, setState] = useState<GameState>({
    mode: 'classic',
    selectedSquare: null,
    validMoves: [],
    moveHistory: [],
    capturedWhite: [],
    capturedBlack: [],
    isAiThinking: false,
    whitePlayer: initialPlayerState(),
    blackPlayer: initialPlayerState(),
    gameStatus: 'playing',
    winner: null,
  });

  const updateGameStatus = useCallback(() => {
    const game = gameRef.current;
    let gameStatus: GameState['gameStatus'] = 'playing';
    let winner: 'w' | 'b' | null = null;

    if (game.isCheckmate()) {
      gameStatus = 'checkmate';
      winner = game.turn() === 'w' ? 'b' : 'w';
    } else if (game.isDraw()) {
      gameStatus = 'draw';
    } else if (game.isStalemate()) {
      gameStatus = 'stalemate';
    }

    return { gameStatus, winner };
  }, []);

  const makeAiMove = useCallback(() => {
    const game = gameRef.current;
    if (game.isGameOver()) return;

    setState(prev => ({ ...prev, isAiThinking: true }));

    setTimeout(() => {
      const moves = game.moves({ verbose: true });
      if (moves.length === 0) return;

      // Simple AI: prioritize captures, checks, then random
      const captures = moves.filter(m => m.captured);
      const checks = moves.filter(m => m.san.includes('+'));
      
      let chosen: Move;
      if (captures.length > 0 && Math.random() > 0.3) {
        chosen = captures[Math.floor(Math.random() * captures.length)];
      } else if (checks.length > 0 && Math.random() > 0.5) {
        chosen = checks[Math.floor(Math.random() * checks.length)];
      } else {
        chosen = moves[Math.floor(Math.random() * moves.length)];
      }

      const result = game.move(chosen);
      if (result) {
        const { gameStatus, winner } = updateGameStatus();
        setFen(game.fen());
        setState(prev => ({
          ...prev,
          isAiThinking: false,
          moveHistory: [...prev.moveHistory, result],
          capturedBlack: result.captured 
            ? [...prev.capturedBlack, result.captured] 
            : prev.capturedBlack,
          gameStatus,
          winner,
        }));
      }
    }, 500 + Math.random() * 800);
  }, [updateGameStatus]);

  const handleSquareClick = useCallback((square: Square) => {
    const game = gameRef.current;
    if (state.gameStatus !== 'playing' || state.isAiThinking) return;
    if (vsAi && game.turn() === 'b') return;

    const piece = game.get(square);

    // If a piece is already selected, try to move
    if (state.selectedSquare) {
      const move = game.move({
        from: state.selectedSquare,
        to: square,
        promotion: 'q',
      });

      if (move) {
        const { gameStatus, winner } = updateGameStatus();
        setFen(game.fen());
        setState(prev => ({
          ...prev,
          selectedSquare: null,
          validMoves: [],
          moveHistory: [...prev.moveHistory, move],
          capturedWhite: move.captured && move.color === 'b'
            ? [...prev.capturedWhite, move.captured]
            : prev.capturedWhite,
          capturedBlack: move.captured && move.color === 'w'
            ? [...prev.capturedBlack, move.captured]
            : prev.capturedBlack,
          gameStatus,
          winner,
        }));

        // AI responds
        if (vsAi && !game.isGameOver()) {
          makeAiMove();
        }
        return;
      }
    }

    // Select a piece
    if (piece && piece.color === game.turn()) {
      const moves = game.moves({ square, verbose: true });
      setState(prev => ({
        ...prev,
        selectedSquare: square,
        validMoves: moves.map(m => m.to),
      }));
    } else {
      setState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: [],
      }));
    }
  }, [state.selectedSquare, state.gameStatus, state.isAiThinking, vsAi, makeAiMove, updateGameStatus]);

  const resetGame = useCallback(() => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setState({
      mode: state.mode,
      selectedSquare: null,
      validMoves: [],
      moveHistory: [],
      capturedWhite: [],
      capturedBlack: [],
      isAiThinking: false,
      whitePlayer: initialPlayerState(),
      blackPlayer: initialPlayerState(),
      gameStatus: 'playing',
      winner: null,
    });
  }, [state.mode]);

  const setMode = useCallback((mode: GameMode) => {
    setState(prev => ({ ...prev, mode }));
    resetGame();
  }, [resetGame]);

  const getBoard = useCallback(() => {
    return gameRef.current.board();
  }, []);

  const isInCheck = useCallback(() => {
    return gameRef.current.isCheck();
  }, []);

  const currentTurn = useCallback(() => {
    return gameRef.current.turn();
  }, []);

  return {
    fen,
    board: getBoard(),
    state,
    handleSquareClick,
    resetGame,
    setMode,
    isInCheck: isInCheck(),
    currentTurn: currentTurn(),
  };
};
