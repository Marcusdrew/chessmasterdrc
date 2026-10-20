import { useEffect, useRef, useCallback } from 'react';
import { Chess, type Move } from 'chess.js';
import { getBestMove, type Difficulty, type MoveConstraints } from '@/lib/chessAI';
import { analyzeGame, type GameReviewSummary } from '@/lib/gameReview';
import type { ChessAIRequest, ChessAIResponse } from '@/workers/chessAI.protocol';

type PendingEntry =
  | { kind: 'bestMove'; resolve: (move: Move | null) => void; reject: (err: Error) => void }
  | { kind: 'analyzeGame'; resolve: (summary: GameReviewSummary) => void; reject: (err: Error) => void; onProgress?: (done: number, total: number) => void };

/**
 * Owns one chess-AI Web Worker for the lifetime of the calling component,
 * and exposes promise-based helpers around it so callers never touch
 * postMessage directly.
 *
 * If a Worker can't be created (or stops responding), every call silently
 * falls back to computing on the main thread instead of rejecting — slower
 * and able to briefly block the UI on deep searches, but the app keeps
 * working rather than a hint or an AI move never arriving.
 */
export function useChessAIWorker() {
  const workerRef = useRef<Worker | null>(null);
  const brokenRef = useRef(false);
  const nextIdRef = useRef(0);
  const pendingRef = useRef<Map<number, PendingEntry>>(new Map());

  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../workers/chessAI.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (event: MessageEvent<ChessAIResponse>) => {
        const response = event.data;
        const entry = pendingRef.current.get(response.id);
        if (!entry) return; // stale or unknown id — nothing to resolve
        pendingRef.current.delete(response.id);

        if (response.kind === 'error') {
          entry.reject(new Error(response.message));
          return;
        }
        if (response.kind === 'bestMove' && entry.kind === 'bestMove') {
          entry.resolve(response.move);
        } else if (response.kind === 'analyzeGame' && entry.kind === 'analyzeGame') {
          entry.resolve(response.summary);
        }
      };

      worker.onerror = () => {
        brokenRef.current = true;
      };

      workerRef.current = worker;
    } catch {
      brokenRef.current = true;
    }

    const pending = pendingRef.current;

    return () => {
      worker?.terminate();
      workerRef.current = null;
      pending.forEach(entry =>
        entry.reject(new Error('Le Worker IA a été arrêté avant la réponse'))
      );
      pending.clear();
    };
  }, []);

  const getMoveAsync = useCallback(
    (
      fen: string,
      difficulty: Difficulty,
      options?: { ignoreRandomness?: boolean; constraints?: MoveConstraints }
    ): Promise<Move | null> => {
      if (brokenRef.current || !workerRef.current) {
        return Promise.resolve(getBestMove(new Chess(fen), difficulty, options));
      }
      const worker = workerRef.current;
      const id = nextIdRef.current++;
      return new Promise<Move | null>((resolve, reject) => {
        pendingRef.current.set(id, { kind: 'bestMove', resolve, reject });
        const request: ChessAIRequest = {
          id,
          kind: 'bestMove',
          fen,
          difficulty,
          ignoreRandomness: options?.ignoreRandomness,
          constraints: options?.constraints,
        };
        worker.postMessage(request);
      });
    },
    []
  );

  const analyzeGameAsync = useCallback(
    (moves: Move[], playerColor: 'w' | 'b', depth?: number): Promise<GameReviewSummary> => {
      if (brokenRef.current || !workerRef.current) {
        return Promise.resolve(analyzeGame(moves, playerColor, depth));
      }
      const worker = workerRef.current;
      const id = nextIdRef.current++;
      return new Promise<GameReviewSummary>((resolve, reject) => {
        pendingRef.current.set(id, { kind: 'analyzeGame', resolve, reject });
        const request: ChessAIRequest = { id, kind: 'analyzeGame', moves, playerColor, depth };
        worker.postMessage(request);
      });
    },
    []
  );

  return { getMoveAsync, analyzeGameAsync };
}
