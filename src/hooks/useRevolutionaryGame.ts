import { useState, useCallback, useRef } from 'react';
import { Chess, type Square, type Move, type PieceSymbol, type Color } from 'chess.js';
import type { Difficulty } from '@/lib/chessAI';
import { useChessAIWorker } from './useChessAIWorker';
import { useSensations } from './useSensations';
import { classifyMoveSound } from '@/lib/sound';
import {
  createInitialRevolutionaryState,
  getConstraintsForColor,
  isMoveBlocked,
  checkGameOverAfterMove,
  activateShield,
  activateFreeze,
  activateEvolve,
  activateElan,
  resolveAfterMove,
  canActivatePower,
  SPECIAL_SQUARES,
  type RevolutionaryState,
  type PowerType,
} from '@/lib/revolutionaryMode';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export type GameStatus = 'playing' | 'checkmate' | 'draw' | 'stalemate';

interface GameState {
  selectedSquare: Square | null;
  validMoves: Square[];
  moveHistory: Move[];
  gameStatus: GameStatus;
  winner: Color | null;
  isAiThinking: boolean;
  /** Which power is currently waiting for the player to click a target
   * square, if any. Élan has no target and never sets this. */
  targetingPower: PowerType | null;
}

/**
 * Revolutionary mode's counterpart to useChessGame — same Worker-backed AI
 * and generation-guard pattern, plus the energy/power/special-square layer.
 * Deliberately a separate hook rather than a flag bolted onto useChessGame:
 * classic mode's hook stays exactly as tested in phase 2, and the AI here
 * never has power-specific logic — it only ever receives an ordinary
 * MoveConstraints filter computed from revState (see chessAI.ts).
 */
export function useRevolutionaryGame(vsAi: boolean, playerColor: Color, difficulty: Difficulty) {
  const gameRef = useRef(new Chess());
  const hasInitialMove = useRef(false);
  const generationRef = useRef(0);
  const thinkingForGenerationRef = useRef<number | null>(null);

  const { getMoveAsync } = useChessAIWorker();
  const { triggerFeedback } = useSensations();

  const [fen, setFen] = useState(gameRef.current.fen());
  const [revState, setRevState] = useState<RevolutionaryState>(createInitialRevolutionaryState());
  const [state, setState] = useState<GameState>({
    selectedSquare: null,
    validMoves: [],
    moveHistory: [],
    gameStatus: 'playing',
    winner: null,
    isAiThinking: false,
    targetingPower: null,
  });

  const getBoard = useCallback(() => gameRef.current.board(), []);
  const isInCheck = useCallback(() => gameRef.current.isCheck(), []);
  const currentTurn = useCallback(() => gameRef.current.turn(), []);

  const pieceLabelFor = useCallback((type: PieceSymbol): string => {
    const names: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
    return names[type];
  }, []);

  /** Legal destinations for `square`, with frozen/shielded moves already
   * filtered out — the one function both selection and the click-to-move
   * path use, so they can never disagree about what's actually playable. */
  const legalDestinations = useCallback((square: Square, color: Color): Square[] => {
    const game = gameRef.current;
    const constraints = getConstraintsForColor(revState, color);
    return game
      .moves({ square, verbose: true })
      .filter(m => !isMoveBlocked(constraints, m.from, m.to, !!m.captured))
      .map(m => m.to as Square);
  }, [revState]);

  const makeAiMove = useCallback((currentRevState: RevolutionaryState) => {
    const game = gameRef.current;
    const aiColor = game.turn();
    const myGeneration = generationRef.current;
    if (thinkingForGenerationRef.current === myGeneration) return;
    thinkingForGenerationRef.current = myGeneration;
    setState(prev => ({ ...prev, isAiThinking: true }));

    const delayRange: [number, number] = [900, 1600];
    const delay = delayRange[0] + Math.random() * (delayRange[1] - delayRange[0]);
    const constraints = getConstraintsForColor(currentRevState, aiColor);

    Promise.all([sleep(delay), getMoveAsync(game.fen(), difficulty, { constraints })])
      .then(([, chosen]) => {
        if (generationRef.current !== myGeneration) return;
        thinkingForGenerationRef.current = null;

        if (!chosen) {
          // Every legal move was frozen/shielded away — a power-induced
          // game end chess.js itself can't see (see checkGameOverAfterMove).
          const over = checkGameOverAfterMove(game, currentRevState, aiColor) ?? { status: 'stalemate' as const, winner: null };
          triggerFeedback(over.winner === playerColor ? 'checkmateWin' : over.winner ? 'checkmateLoss' : 'draw');
          setState(prev => ({ ...prev, isAiThinking: false, gameStatus: over.status, winner: over.winner }));
          return;
        }

        const pieceType = game.get(chosen.from as Square)!.type;
        const result = game.move({ from: chosen.from, to: chosen.to, promotion: chosen.promotion });
        if (!result) {
          setState(prev => ({ ...prev, isAiThinking: false }));
          return;
        }

        const next = resolveAfterMove(game, currentRevState, aiColor, chosen.to, pieceType);
        const nextColor = game.turn();
        const over = checkGameOverAfterMove(game, next, nextColor);

        setFen(game.fen());
        setRevState(next);
        triggerFeedback(classifyMoveSound(result, game.isCheck(), over?.status ?? 'playing', over?.winner ?? null, playerColor));
        setState(prev => ({
          ...prev,
          isAiThinking: false,
          moveHistory: [...prev.moveHistory, result],
          ...(over ? { gameStatus: over.status, winner: over.winner } : {}),
        }));
      })
      .catch(() => {
        if (generationRef.current !== myGeneration) return;
        thinkingForGenerationRef.current = null;
        setState(prev => ({ ...prev, isAiThinking: false }));
      });
  }, [difficulty, getMoveAsync, playerColor, triggerFeedback]);

  const finishTurn = useCallback((color: Color, toSquare: Square, pieceType: PieceSymbol) => {
    const game = gameRef.current;
    const next = resolveAfterMove(game, revState, color, toSquare, pieceType);

    const nextColor = game.turn();
    const over = checkGameOverAfterMove(game, next, nextColor);
    setFen(game.fen());
    setRevState(next);

    if (over) {
      setState(prev => ({ ...prev, gameStatus: over.status, winner: over.winner, selectedSquare: null, validMoves: [] }));
      return;
    }

    if (next.awaitingBonusMove === color) {
      // Same player goes again — don't hand off to the AI or flip isAiThinking.
      setState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
      return;
    }

    setState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
    if (vsAi && nextColor !== playerColor) {
      makeAiMove(next);
    }
  }, [revState, vsAi, playerColor, makeAiMove]);

  const handleSquareClick = useCallback((square: Square) => {
    if (state.gameStatus !== 'playing' || state.isAiThinking) return;
    const game = gameRef.current;
    const turn = game.turn();

    // --- Power targeting takes priority over ordinary move selection ---
    if (state.targetingPower) {
      const power = state.targetingPower;
      const piece = game.get(square);
      let nextRev: RevolutionaryState | null = null;

      if (power === 'shield' && piece && piece.color === turn) {
        nextRev = activateShield(revState, turn, square);
      } else if (power === 'freeze' && piece && piece.color !== turn) {
        nextRev = activateFreeze(revState, turn, square);
      } else if (power === 'evolve' && piece && piece.color === turn && piece.type === 'p') {
        nextRev = activateEvolve(game, revState, turn, square);
        if (nextRev) setFen(game.fen());
      }

      if (nextRev) {
        triggerFeedback(power === 'evolve' ? 'promote' : 'castle');
        setRevState(nextRev);
      } else {
        triggerFeedback('illegal');
      }
      setState(prev => ({ ...prev, targetingPower: null }));
      return;
    }

    // --- Ordinary move selection / execution ---
    if (!state.selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === turn) {
        setState(prev => ({ ...prev, selectedSquare: square, validMoves: legalDestinations(square, turn) }));
      }
      return;
    }

    if (state.selectedSquare === square) {
      setState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
      return;
    }

    const clickedPiece = game.get(square);
    if (clickedPiece && clickedPiece.color === turn) {
      setState(prev => ({ ...prev, selectedSquare: square, validMoves: legalDestinations(square, turn) }));
      return;
    }

    if (!state.validMoves.includes(square)) {
      triggerFeedback('illegal');
      setState(prev => ({ ...prev, selectedSquare: null, validMoves: [] }));
      return;
    }

    const fromPiece = game.get(state.selectedSquare)!;
    const result = game.move({ from: state.selectedSquare, to: square, promotion: 'q' });
    if (!result) return; // shouldn't happen — legalDestinations already filtered

    triggerFeedback(classifyMoveSound(result, game.isCheck(), 'playing', null, playerColor));
    setState(prev => ({ ...prev, moveHistory: [...prev.moveHistory, result] }));
    finishTurn(turn, square, fromPiece.type);
  }, [state, revState, legalDestinations, finishTurn, triggerFeedback, playerColor]);

  const startTargetingPower = useCallback((power: PowerType) => {
    if (state.gameStatus !== 'playing' || state.isAiThinking) return;
    if (gameRef.current.turn() !== playerColor) return;
    if (!canActivatePower(revState, playerColor, power)) return;

    if (power === 'elan') {
      const next = activateElan(revState, playerColor);
      if (next) {
        setRevState(next);
        triggerFeedback('castle');
      }
      return;
    }
    setState(prev => ({ ...prev, targetingPower: prev.targetingPower === power ? null : power }));
  }, [state.gameStatus, state.isAiThinking, playerColor, revState, triggerFeedback]);

  const cancelTargeting = useCallback(() => {
    setState(prev => ({ ...prev, targetingPower: null }));
  }, []);

  const resetGame = useCallback(() => {
    generationRef.current += 1;
    gameRef.current = new Chess();
    hasInitialMove.current = false;
    setFen(gameRef.current.fen());
    setRevState(createInitialRevolutionaryState());
    setState({
      selectedSquare: null,
      validMoves: [],
      moveHistory: [],
      gameStatus: 'playing',
      winner: null,
      isAiThinking: false,
      targetingPower: null,
    });
  }, []);

  // AI plays first if the human chose black — mirrors useChessGame's mount effect.
  if (vsAi && playerColor === 'b' && !hasInitialMove.current && state.moveHistory.length === 0 && !state.isAiThinking) {
    hasInitialMove.current = true;
    setTimeout(() => makeAiMove(revState), 400);
  }

  return {
    fen,
    board: getBoard(),
    state,
    revState,
    specialSquares: SPECIAL_SQUARES,
    handleSquareClick,
    startTargetingPower,
    cancelTargeting,
    resetGame,
    isInCheck: isInCheck(),
    currentTurn: currentTurn(),
    pieceLabelFor,
  };
}
