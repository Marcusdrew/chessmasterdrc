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

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = orderMoves(game.moves({ verbose: true }));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move.san);
      const eval_ = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      if (eval_ > maxEval) maxEval = eval_;
      if (eval_ > alpha) alpha = eval_;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move.san);
      const eval_ = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      if (eval_ < minEval) minEval = eval_;
      if (eval_ < beta) beta = eval_;
      if (beta <= alpha) break;
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

export function getBestMove(game: Chess, difficulty: Difficulty): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const config = DIFFICULTY_CONFIG[difficulty];

  if (Math.random() < config.randomness) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const isMaximizing = game.turn() === 'w';
  const ordered = orderMoves(moves);
  let bestMove = ordered[0];
  let bestEval = isMaximizing ? -Infinity : Infinity;

  for (const move of ordered) {
    game.move(move.san);
    const eval_ = minimax(game, config.depth - 1, -Infinity, Infinity, !isMaximizing);
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
      return game.turn() === 'w' ? -100000 : 100000;
    }
    return 0; // draw
  }
  const isMaximizing = game.turn() === 'w';
  return minimax(game, depth, -Infinity, Infinity, isMaximizing);
}

