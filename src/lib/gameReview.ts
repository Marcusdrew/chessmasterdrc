import { Chess, Move } from 'chess.js';
import { evaluatePosition, getBestMove } from './chessAI';

export type MoveQuality =
  | 'best'        // Meilleur coup
  | 'excellent'   // Excellent
  | 'good'        // Bon
  | 'inaccuracy'  // Imprécision
  | 'mistake'     // Erreur
  | 'blunder';    // Gaffe

export interface ReviewedMove {
  index: number;          // 1-based move number for the player
  ply: number;            // ply in full history
  san: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  evalBefore: number;     // centipawns, white POV
  evalAfter: number;      // centipawns, white POV
  centipawnLoss: number;  // positive = how much player lost vs best (own POV)
  bestMove: { from: string; to: string; san: string } | null;
  quality: MoveQuality;
}

export interface GameReviewSummary {
  moves: ReviewedMove[];
  counts: Record<MoveQuality, number>;
  accuracy: number; // 0-100
}

const QUALITY_LABELS: Record<MoveQuality, string> = {
  best: 'Meilleur coup',
  excellent: 'Excellent',
  good: 'Bon',
  inaccuracy: 'Imprécision',
  mistake: 'Erreur',
  blunder: 'Gaffe',
};

export const qualityLabel = (q: MoveQuality) => QUALITY_LABELS[q];

const QUALITY_COLOR: Record<MoveQuality, string> = {
  best: 'text-emerald-500',
  excellent: 'text-green-500',
  good: 'text-sky-500',
  inaccuracy: 'text-yellow-500',
  mistake: 'text-orange-500',
  blunder: 'text-red-500',
};

export const qualityColor = (q: MoveQuality) => QUALITY_COLOR[q];

const QUALITY_ICON: Record<MoveQuality, string> = {
  best: '★',
  excellent: '✦',
  good: '✓',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
};

export const qualityIcon = (q: MoveQuality) => QUALITY_ICON[q];

function classify(centipawnLoss: number, isBest: boolean): MoveQuality {
  if (isBest) return 'best';
  if (centipawnLoss < 30) return 'excellent';
  if (centipawnLoss < 80) return 'good';
  if (centipawnLoss < 180) return 'inaccuracy';
  if (centipawnLoss < 350) return 'mistake';
  return 'blunder';
}

/**
 * Replays the game and analyzes only the player's moves.
 * Uses depth 2 for speed — accurate enough for casual review.
 */
export function analyzeGame(
  moves: Move[],
  playerColor: 'w' | 'b',
  depth: number = 2,
): GameReviewSummary {
  const game = new Chess();
  const reviewed: ReviewedMove[] = [];

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const sideToMove = game.turn();

    if (sideToMove === playerColor) {
      // Eval before move (white POV)
      const evalBefore = evaluatePosition(game, depth);
      // Find engine's best move from this position
      const bestMove = getBestMove(new Chess(game.fen()), 'expert');

      // Apply player's actual move
      game.move({ from: m.from, to: m.to, promotion: m.promotion });
      const evalAfter = evaluatePosition(game, depth);

      // CP loss from player's POV (positive = lost ground)
      const cpLossWhitePov = evalBefore - evalAfter;
      const centipawnLoss = playerColor === 'w' ? cpLossWhitePov : -cpLossWhitePov;

      const isBest = bestMove ? bestMove.from === m.from && bestMove.to === m.to : false;
      const quality = classify(Math.max(0, centipawnLoss), isBest);

      reviewed.push({
        index: reviewed.length + 1,
        ply: i,
        san: m.san,
        from: m.from,
        to: m.to,
        color: m.color,
        evalBefore,
        evalAfter,
        centipawnLoss: Math.max(0, Math.round(centipawnLoss)),
        bestMove: bestMove ? { from: bestMove.from, to: bestMove.to, san: bestMove.san } : null,
        quality,
      });
    } else {
      // Opponent move — just play it
      game.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
  }

  const counts: Record<MoveQuality, number> = {
    best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0,
  };
  reviewed.forEach(r => { counts[r.quality]++; });

  // Simple accuracy: weighted average
  const weights: Record<MoveQuality, number> = {
    best: 100, excellent: 92, good: 80, inaccuracy: 60, mistake: 35, blunder: 10,
  };
  const accuracy = reviewed.length === 0
    ? 0
    : Math.round(reviewed.reduce((s, r) => s + weights[r.quality], 0) / reviewed.length);

  return { moves: reviewed, counts, accuracy };
}
