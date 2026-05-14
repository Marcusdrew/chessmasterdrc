import { useState, useCallback, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { getBestMove, Difficulty } from '@/lib/chessAI';

export interface GameState {
  selectedSquare: Square | null;
  validMoves: string[];
  moveHistory: Move[];
  isAiThinking: boolean;
  gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate';
  winner: 'w' | 'b' | null;
}

export const useChessGame = (vsAi: boolean = true, playerColor: 'w' | 'b' = 'w', difficulty: Difficulty = 'intermediaire') => {
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
      const chosen = getBestMove(game, difficulty);
      if (!chosen) return;

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
    }, 150);
  }, [updateGameStatus, difficulty]);

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

    // If a piece is already selected
    if (state.selectedSquare) {
      // If clicking another own piece, switch selection
      if (piece && piece.color === game.turn() && square !== state.selectedSquare) {
        const moves = game.moves({ square, verbose: true });
        setState(prev => ({ ...prev, selectedSquare: square, validMoves: moves.map(m => m.to) }));
        return;
      }

      // Try to make the move
      try {
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
      } catch {
        // Invalid move, deselect
        setState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
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

  const undoMove = useCallback(() => {
    const game = gameRef.current;
    if (state.moveHistory.length === 0 || state.isAiThinking) return;

    // Undo opponent's move + player's move (2 moves)
    if (vsAi && state.moveHistory.length >= 2) {
      game.undo(); // opponent
      game.undo(); // player
      setFen(game.fen());
      setState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: [],
        moveHistory: prev.moveHistory.slice(0, -2),
        gameStatus: 'playing',
        winner: null,
      }));
    } else if (!vsAi || state.moveHistory.length === 1) {
      game.undo();
      setFen(game.fen());
      setState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: [],
        moveHistory: prev.moveHistory.slice(0, -1),
        gameStatus: 'playing',
        winner: null,
      }));
    }
  }, [state.moveHistory, state.isAiThinking, vsAi]);

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

  const forceEnd = useCallback((loser: 'w' | 'b') => {
    setState(prev => ({
      ...prev,
      gameStatus: 'checkmate',
      winner: loser === 'w' ? 'b' : 'w',
      isAiThinking: false,
      selectedSquare: null,
      validMoves: [],
    }));
  }, []);

  return {
    fen,
    board: getBoard(),
    state,
    handleSquareClick,
    resetGame,
    undoMove,
    forceEnd,
    isInCheck: isInCheck(),
    currentTurn: currentTurn(),
  };
};
