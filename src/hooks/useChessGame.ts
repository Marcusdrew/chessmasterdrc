import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { Difficulty } from '@/lib/chessAI';
import { useChessAIWorker } from './useChessAIWorker';
import { useSensations } from '@/hooks/useSensations';
import { classifyMoveSound } from '@/lib/sound';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export interface GameState {
  selectedSquare: Square | null;
  validMoves: string[];
  moveHistory: Move[];
  isAiThinking: boolean;
  gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate';
  winner: 'w' | 'b' | null;
}

export const useChessGame = (
  vsAi: boolean = true,
  playerColor: 'w' | 'b' = 'w',
  difficulty: Difficulty = 'intermediaire',
  initialMoves: string[] = []
) => {
  const gameRef = useRef<Chess>((() => {
    const g = new Chess();
    for (const san of initialMoves) {
      try { g.move(san); } catch { /* ignore corrupt entry */ }
    }
    return g;
  })());
  const { getMoveAsync } = useChessAIWorker();
  const { triggerFeedback } = useSensations();
  // Bumped by resetGame so an AI move computed for a game that's since been
  // reset gets silently dropped instead of landing on the new board.
  const generationRef = useRef(0);
  // Which generation is currently being computed for, if any — also doubles
  // as a re-entrancy guard so two AI computations never overlap.
  const thinkingForGenerationRef = useRef<number | null>(null);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [state, setState] = useState<GameState>({
    selectedSquare: null,
    validMoves: [],
    moveHistory: gameRef.current.history({ verbose: true }) as Move[],
    isAiThinking: false,
    gameStatus: gameRef.current.isCheckmate() ? 'checkmate' : gameRef.current.isStalemate() ? 'stalemate' : gameRef.current.isDraw() ? 'draw' : 'playing',
    winner: gameRef.current.isCheckmate() ? (gameRef.current.turn() === 'w' ? 'b' : 'w') : null,
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

    const myGeneration = generationRef.current;
    if (thinkingForGenerationRef.current === myGeneration) return; // already computing this one
    thinkingForGenerationRef.current = myGeneration;
    setState(prev => ({ ...prev, isAiThinking: true }));

    // Natural thinking delay (ms) — gives the player time to react. Run in
    // parallel with the real computation (not stacked after it) via
    // Promise.all, so moving the search into a Worker — and adding
    // quiescence, which makes it do more work — doesn't make the AI feel
    // slower than it did before.
    const delayRange: Record<Difficulty, [number, number]> = {
      amateur: [800, 1200],
      debutant: [1600, 2400],
      intermediaire: [2100, 2900],
      avance: [2600, 3400],
      expert: [3000, 4000],
    };
    const [min, max] = delayRange[difficulty] ?? [2000, 3000];
    const delay = min + Math.random() * (max - min);

    Promise.all([sleep(delay), getMoveAsync(game.fen(), difficulty)])
      .then(([, chosen]) => {
        // The player may have started a new game while this was computing —
        // if so, this result belongs to a board that no longer exists.
        if (generationRef.current !== myGeneration) return;
        thinkingForGenerationRef.current = null;
        if (!chosen) {
          setState(prev => ({ ...prev, isAiThinking: false }));
          return;
        }

        const result = game.move({ from: chosen.from, to: chosen.to, promotion: chosen.promotion });
        if (result) {
          const { gameStatus, winner } = updateGameStatus();
          triggerFeedback(classifyMoveSound(result, game.isCheck(), gameStatus, winner, playerColor));
          setFen(game.fen());
          setState(prev => ({
            ...prev,
            isAiThinking: false,
            moveHistory: [...prev.moveHistory, result],
            gameStatus,
            winner,
          }));
        }
      })
      .catch(() => {
        if (generationRef.current !== myGeneration) return;
        thinkingForGenerationRef.current = null;
        setState(prev => ({ ...prev, isAiThinking: false }));
      });
  }, [updateGameStatus, difficulty, getMoveAsync, playerColor, triggerFeedback]);

  // Resume an interrupted AI turn, including when the player chose black.
  useEffect(() => {
    if (vsAi && state.gameStatus === 'playing' && gameRef.current.turn() !== playerColor) makeAiMove();
  }, [vsAi, playerColor, state.gameStatus, fen, makeAiMove]);

  useEffect(() => () => {
    generationRef.current += 1;
    thinkingForGenerationRef.current = null;
  }, []);

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
          triggerFeedback(classifyMoveSound(move, game.isCheck(), gameStatus, winner, playerColor));
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
        triggerFeedback('illegal');
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
  }, [state.selectedSquare, state.gameStatus, state.isAiThinking, vsAi, playerColor, makeAiMove, updateGameStatus, triggerFeedback]);

  const undoMove = useCallback(() => {
    const game = gameRef.current;
    if (state.moveHistory.length === 0 || state.isAiThinking) return;
    triggerFeedback('undo');

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
  }, [state.moveHistory, state.isAiThinking, vsAi, triggerFeedback]);

  const resetGame = useCallback(() => {
    generationRef.current += 1; // invalidate any AI computation still in flight
    gameRef.current = new Chess();
    thinkingForGenerationRef.current = null;
    setFen(gameRef.current.fen());
    setState({
      selectedSquare: null, validMoves: [], moveHistory: [],
      isAiThinking: false, gameStatus: 'playing', winner: null,
    });
  }, []);

  const getBoard = useCallback(() => gameRef.current.board(), []);
  const isInCheck = useCallback(() => gameRef.current.isCheck(), []);
  const currentTurn = useCallback(() => gameRef.current.turn(), []);

  const forceEnd = useCallback((loser: 'w' | 'b') => {
    // A reply still computing must never change a finished match back to playing.
    generationRef.current += 1;
    thinkingForGenerationRef.current = null;
    const winner = loser === 'w' ? 'b' : 'w';
    triggerFeedback(winner === playerColor ? 'checkmateWin' : 'checkmateLoss');
    setState(prev => ({
      ...prev,
      gameStatus: 'checkmate',
      winner,
      isAiThinking: false,
      selectedSquare: null,
      validMoves: [],
    }));
  }, [playerColor, triggerFeedback]);

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
