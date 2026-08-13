import { Chess, Move } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

const POSITION_BONUS: Record<string, number[][]> = {
  p: [
    [0,0,0,0,0,0,0,0],
    [50,50,50,50,50,50,50,50],
    [10,10,20,30,30,20,10,10],
    [5,5,10,25,25,10,5,5],
    [0,0,0,20,20,0,0,0],
    [5,-5,-10,0,0,-10,-5,5],
    [5,10,10,-20,-20,10,10,5],
    [0,0,0,0,0,0,0,0],
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,0,0,0,0,-20,-40],
    [-30,0,10,15,15,10,0,-30],
    [-30,5,15,20,20,15,5,-30],
    [-30,0,15,20,20,15,0,-30],
    [-30,5,10,15,15,10,5,-30],
    [-40,-20,0,5,5,0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,0,0,0,0,0,0,-10],
    [-10,0,10,10,10,10,0,-10],
    [-10,5,5,10,10,5,5,-10],
    [-10,0,10,10,10,10,0,-10],
    [-10,10,10,10,10,10,10,-10],
    [-10,5,0,0,0,0,5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  r: [
    [0,0,0,0,0,0,0,0],
    [5,10,10,10,10,10,10,5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [0,0,0,5,5,0,0,0],
  ],
  q: [
    [-20,-10,-10,-5,-5,-10,-10,-20],
    [-10,0,0,0,0,0,0,-10],
    [-10,0,5,5,5,5,0,-10],
    [-5,0,5,5,5,5,0,-5],
    [0,0,5,5,5,5,0,-5],
    [-10,5,5,5,5,5,0,-10],
    [-10,0,5,0,0,0,0,-10],
    [-20,-10,-10,-5,-5,-10,-10,-20],
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20,20,0,0,0,0,20,20],
    [20,30,10,0,0,10,30,20],
  ],
};

function evaluateBoard(game: Chess): number {
  const board = game.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      const posBonus = POSITION_BONUS[piece.type];
      const bonus = posBonus
        ? piece.color === 'w'
          ? posBonus[r][c]
          : posBonus[7 - r][c]
        : 0;

      if (piece.color === 'w') {
        score += val + bonus;
      } else {
        score -= val + bonus;
      }
    }
  }

  return score;
}

function orderMoves(moves: Move[]): Move[] {
  // Captures first (MVV-LVA-ish), then checks, then quiet moves — boosts alpha-beta cutoffs
  return [...moves].sort((a, b) => {
    const aScore = (a.captured ? (PIECE_VALUES[a.captured] || 0) - (PIECE_VALUES[a.piece] || 0) / 10 : 0)
      + (a.san.includes('+') ? 50 : 0)
      + (a.promotion ? 800 : 0);
    const bScore = (b.captured ? (PIECE_VALUES[b.captured] || 0) - (PIECE_VALUES[b.piece] || 0) / 10 : 0)
      + (b.san.includes('+') ? 50 : 0)
      + (b.promotion ? 800 : 0);
    return bScore - aScore;
  });
}

const MATE_SCORE = 100000;
const MAX_QUIESCENCE_DEPTH = 6;
// Hard ceiling on total nodes visited by one getBestMove/evaluatePosition
// call. A first version without this took 58+ seconds on an ordinary
// tactical middlegame (several minor pieces hanging at once): quiescence
// exploring every capture with no bound compounds combinatorially across
// the thousands of leaf nodes a depth-3 search already produces. Calibrated
// empirically against chess.js's actual per-node cost (its verbose move
// generation is not cheap — measured ~300 calls/sec on a modest single
// core) so the worst case stays around 2-3s even on weak hardware, which
// matters here since this engine also runs on-demand for hints (no
// "thinking delay" to hide behind) and is called once per move during
// post-game analysis.
const MAX_SEARCH_NODES = 1000;
// Margin (centipawns) added on top of a capture's face value when delta
// pruning — accounts for position bonuses so a capture isn't wrongly
// discarded purely on a tight material cutoff.
const DELTA_MARGIN = 200;

interface SearchBudget {
  nodes: number;
}

// Extends the search past the nominal depth along capture sequences only, so
// the engine doesn't stop mid-exchange and misjudge a piece that looks free
// but is actually defended (the classic "horizon effect"). Without this, a
// depth-1 search in particular will happily grab a defended pawn with the
// queen because it never looks far enough ahead to see the recapture.
function quiescence(
  game: Chess,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  budget: SearchBudget,
  qDepth: number = 0
): number {
  budget.nodes--;

  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -MATE_SCORE : MATE_SCORE;
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  const standPat = evaluateBoard(game);
  if (qDepth >= MAX_QUIESCENCE_DEPTH || budget.nodes <= 0) {
    return standPat;
  }

  // Stand-pat cutoff: if just sitting still is already good enough to cause
  // a cutoff, no need to explore captures from here.
  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  const captures = orderMoves(game.moves({ verbose: true }).filter(m => m.captured));

  for (const move of captures) {
    if (budget.nodes <= 0) break;

    // Delta pruning: even winning this capture outright plus a safety
    // margin can't reach alpha/beta, so it's not worth exploring — this is
    // what actually keeps quiescence from drowning in hopeless captures in
    // a tactically dense position.
    const capturedValue = PIECE_VALUES[move.captured as string] || 0;
    if (isMaximizing && standPat + capturedValue + DELTA_MARGIN <= alpha) continue;
    if (!isMaximizing && standPat - capturedValue - DELTA_MARGIN >= beta) continue;

    game.move(move.san);
    const score = quiescence(game, alpha, beta, !isMaximizing, budget, qDepth + 1);
    game.undo();

    if (isMaximizing) {
      if (score > alpha) alpha = score;
    } else {
      if (score < beta) beta = score;
    }
    if (alpha >= beta) break;
  }

  return isMaximizing ? alpha : beta;
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  budget: SearchBudget
): number {
  budget.nodes--;

  if (game.isCheckmate()) {
    // Side to move (game.turn()) has just been mated. Weight by remaining
    // depth so the engine prefers a quicker mate over a slower one instead
    // of treating every mate-in-N line as equally good.
    return game.turn() === 'w' ? -(MATE_SCORE + depth) : (MATE_SCORE + depth);
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }
  if (depth === 0 || budget.nodes <= 0) {
    return quiescence(game, alpha, beta, isMaximizing, budget);
  }

  const moves = orderMoves(game.moves({ verbose: true }));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move.san);
      const eval_ = minimax(game, depth - 1, alpha, beta, false, budget);
      game.undo();
      if (eval_ > maxEval) maxEval = eval_;
      if (eval_ > alpha) alpha = eval_;
      if (beta <= alpha) break;
      if (budget.nodes <= 0) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move.san);
      const eval_ = minimax(game, depth - 1, alpha, beta, true, budget);
      game.undo();
      if (eval_ < minEval) minEval = eval_;
      if (eval_ < beta) beta = eval_;
      if (beta <= alpha) break;
      if (budget.nodes <= 0) break;
    }
    return minEval;
  }
}

export type Difficulty = 'amateur' | 'debutant' | 'intermediaire' | 'avance' | 'expert';

const DIFFICULTY_CONFIG: Record<Difficulty, { depth: number; randomness: number }> = {
  amateur: { depth: 1, randomness: 0.85 },
  debutant: { depth: 1, randomness: 0.4 },
  intermediaire: { depth: 2, randomness: 0.15 },
  avance: { depth: 2, randomness: 0.05 },
  expert: { depth: 3, randomness: 0.0 },
};

export interface MoveConstraints {
  /** Squares whose piece cannot be the origin of a move (frozen). */
  frozenSquares?: string[];
  /** Squares that cannot be captured (shielded). */
  shieldedSquares?: string[];
}

function applyConstraints(moves: Move[], constraints?: MoveConstraints): Move[] {
  if (!constraints || (!constraints.frozenSquares?.length && !constraints.shieldedSquares?.length)) {
    return moves;
  }
  return moves.filter(m => {
    if (constraints.frozenSquares?.includes(m.from)) return false;
    if (m.captured && constraints.shieldedSquares?.includes(m.to)) return false;
    return true;
  });
}

export function getBestMove(
  game: Chess,
  difficulty: Difficulty,
  options?: { ignoreRandomness?: boolean; constraints?: MoveConstraints }
): Move | null {
  // Revolutionary-mode freeze/shield effects only ever constrain the root
  // choice for the side to move right now — by the time the search would
  // recurse into a reply two ply deeper, that effect has already expired —
  // so this is the only place constraints need to apply. The search itself
  // (minimax, quiescence, evaluation) never learns these mechanics exist.
  const moves = applyConstraints(game.moves({ verbose: true }), options?.constraints);
  if (moves.length === 0) return null;

  const config = DIFFICULTY_CONFIG[difficulty];

  // Hints and post-game analysis want the engine's real best move at that
  // depth, not its occasional deliberate blunders — those exist to make the
  // opponent feel human, not to make the coaching features unreliable.
  if (!options?.ignoreRandomness && Math.random() < config.randomness) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const isMaximizing = game.turn() === 'w';
  const ordered = orderMoves(moves);
  let bestMove = ordered[0];
  let bestEval = isMaximizing ? -Infinity : Infinity;
  const budget: SearchBudget = { nodes: MAX_SEARCH_NODES };

  for (const move of ordered) {
    game.move(move.san);
    const eval_ = minimax(game, config.depth - 1, -Infinity, Infinity, !isMaximizing, budget);
    game.undo();

    if (isMaximizing) {
      if (eval_ > bestEval) {
        bestEval = eval_;
        bestMove = move;
      }
    } else {
      if (eval_ < bestEval) {
        bestEval = eval_;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

// Static evaluation in centipawns from white's perspective
export function evaluatePosition(game: Chess, depth: number = 2): number {
  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      // Side to move is mated
      return game.turn() === 'w' ? -MATE_SCORE : MATE_SCORE;
    }
    return 0; // draw
  }
  const isMaximizing = game.turn() === 'w';
  const budget: SearchBudget = { nodes: MAX_SEARCH_NODES };
  return minimax(game, depth, -Infinity, Infinity, isMaximizing, budget);
}

