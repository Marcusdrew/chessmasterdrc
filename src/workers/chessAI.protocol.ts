import type { Move } from 'chess.js';
import type { Difficulty, MoveConstraints } from '@/lib/chessAI';
import type { GameReviewSummary } from '@/lib/gameReview';

// Message shapes shared between useChessAIWorker (main thread) and
// chessAI.worker.ts (worker thread). Kept in their own file, with only
// type-only imports, so importing this from either side never accidentally
// pulls the worker's runtime code into the main bundle or vice versa.

export type ChessAIRequest =
  | {
      id: number;
      kind: 'bestMove';
      fen: string;
      difficulty: Difficulty;
      ignoreRandomness?: boolean;
      constraints?: MoveConstraints;
    }
  | {
      id: number;
      kind: 'analyzeGame';
      moves: Move[];
      playerColor: 'w' | 'b';
      depth?: number;
    };

export type ChessAIResponse =
  | { id: number; kind: 'bestMove'; move: Move | null }
  | { id: number; kind: 'analyzeGame'; summary: GameReviewSummary }
  | { id: number; kind: 'error'; message: string };
