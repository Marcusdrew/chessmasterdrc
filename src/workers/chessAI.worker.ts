/// <reference lib="webworker" />

// Runs the chess engine (minimax + quiescence) and post-game analysis off
// the main thread, so a deep "Expert" search or a full-game review never
// freezes the UI — especially important on the slower CPUs this app will
// meet once packaged for Android (see roadmap phase "Play Store").
//
// Cast rather than relying on ambient `self`/`postMessage` typing: the rest
// of the app's tsconfig includes the "DOM" lib (for window/document), which
// declares a different, conflicting shape for those same globals. This cast
// keeps this file correctly typed without fighting that project-wide config.
const ctx = self as unknown as DedicatedWorkerGlobalScope;

import { Chess } from 'chess.js';
import { getBestMove } from '@/lib/chessAI';
import { analyzeGame } from '@/lib/gameReview';
import type { ChessAIRequest, ChessAIResponse } from './chessAI.protocol';

ctx.onmessage = (event: MessageEvent<ChessAIRequest>) => {
  const request = event.data;

  try {
    if (request.kind === 'bestMove') {
      const game = new Chess(request.fen);
      const move = getBestMove(game, request.difficulty, {
        ignoreRandomness: request.ignoreRandomness,
        constraints: request.constraints,
      });
      const response: ChessAIResponse = { id: request.id, kind: 'bestMove', move };
      ctx.postMessage(response);
      return;
    }

    if (request.kind === 'analyzeGame') {
      const summary = analyzeGame(request.moves, request.playerColor, request.depth);
      const response: ChessAIResponse = { id: request.id, kind: 'analyzeGame', summary };
      ctx.postMessage(response);
      return;
    }
  } catch (err) {
    const response: ChessAIResponse = {
      id: request.id,
      kind: 'error',
      message: err instanceof Error ? err.message : 'Erreur inconnue dans le Worker IA',
    };
    ctx.postMessage(response);
  }
};
