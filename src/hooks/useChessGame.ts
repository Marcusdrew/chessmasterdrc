import { useState, useCallback, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';

export interface GameState {
  selectedSquare: Square | null;
  validMoves: string[];
  moveHistory: Move[];
  isAiThinking: boolean;
  gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate';
  winner: 'w' | 'b' | null;
}

export const useChessGame = (vsAi: boolean = true, playerColor: 'w' | 'b' = 'w') => {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [state, setState] = useState<GameState>({
    selectedSquare: null,
    validMoves: [],
    moveHistory: [],
    isAiThinking: false,
    gameStatus: 'playing',
    winner: null,
  });

  const updateGameStatus = useCallback(() => {
    const game = gameRef.current;
    let gameStatus: GameState['gameStatus'] = 'playing';
    let winner: 'w' | 'b' | null = null;
    if (game.isCheckmate()) { gameStatus = 'checkmate'; winner = game.turn() === 'w' ? 'b' : 'w'; }
    else if (game.isDraw()) { gameStatus = 'draw'; }
    else if (game.isStalemate()) { gameStatus = 'stalemate'; }
    return { gameStatus, winner };
  }, []);

  const makeAiMove = useCallback(() => {
    const game = gameRef.current;
    if (game.isGameOver()) return;
    setState(prev => ({ ...prev, isAiThinking: true }));

    setTimeout(() => {
      const moves = game.moves({ verbose: true });
      if (moves.length === 0) return;

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
          gameStatus,
          winner,
        }));
      }
    }, 400 + Math.random() * 600);
  }, [updateGameStatus]);

  // If AI plays first (player is black), trigger AI on mount
  const hasInitialMove = useRef(false);
  if (vsAi && playerColor === 'b' && !hasInitialMove.current && state.moveHistory.length === 0 && state.gameStatus === 'playing') {
    hasInitialMove.current = true;
    setTimeout(() => makeAiMove(), 500);
  }

  const handleSquareClick = useCallback((square: Square) => {
    const game = gameRef.current;
    if (state.gameStatus !== 'playing' || state.isAiThinking) return;
    if (vsAi && game.turn() !== playerColor) return;

    const piece = game.get(square);

    if (state.selectedSquare) {
      const move = game.move({ from: state.selectedSquare, to: square, promotion: 'q' });
      if (move) {
        const { gameStatus, winner } = updateGameStatus();
        setFen(game.fen());
        setState(prev => ({
          ...prev,
          selectedSquare: null,
          validMoves: [],
          moveHistory: [...prev.moveHistory, move],
          gameStatus,
          winner,
        }));
        if (vsAi && !game.isGameOver()) makeAiMove();
        return;
      }
    }

    if (piece && piece.color === game.turn()) {
      const moves = game.moves({ square, verbose: true });
      setState(prev => ({ ...prev, selectedSquare: square, validMoves: moves.map(m => m.to) }));
    } else {
      setState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
    }
  }, [state.selectedSquare, state.gameStatus, state.isAiThinking, vsAi, playerColor, makeAiMove, updateGameStatus]);

  const resetGame = useCallback(() => {
    gameRef.current = new Chess();
    hasInitialMove.current = false;
    setFen(gameRef.current.fen());
    setState({
      selectedSquare: null, validMoves: [], moveHistory: [],
      isAiThinking: false, gameStatus: 'playing', winner: null,
    });
    if (vsAi && playerColor === 'b') {
      hasInitialMove.current = true;
      setTimeout(() => makeAiMove(), 500);
    }
  }, [vsAi, playerColor, makeAiMove]);

  const getBoard = useCallback(() => gameRef.current.board(), []);
  const isInCheck = useCallback(() => gameRef.current.isCheck(), []);
  const currentTurn = useCallback(() => gameRef.current.turn(), []);

  return {
    fen,
    board: getBoard(),
    state,
    handleSquareClick,
    resetGame,
    isInCheck: isInCheck(),
    currentTurn: currentTurn(),
  };
};
