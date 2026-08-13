import { Chess, type Color, type PieceSymbol } from 'chess.js';

// ---------------------------------------------------------------------------
// Design in one paragraph: every mechanic here stays inside the normal rules
// of chess — nothing lets a piece move somewhere chess.js would reject.
// "Freeze" and "shield" just remove certain moves from the legal-move list
// for one turn (a pure filter, applied the same way to the human and to the
// AI's root move list — see MoveConstraints in chessAI.ts). "Evolve" places
// a real knight on the board via chess.js's own put(), same as any editor
// would. "Élan" grants a second ordinary move in a row by briefly flipping
// whose turn chess.js thinks it is, then letting its own turn-alternation
// resume normally. There is no parallel game state that could drift from
// the real board — the Chess instance is always the single source of truth.
// ---------------------------------------------------------------------------

export type PowerType = 'shield' | 'freeze' | 'evolve' | 'elan';
export type SpecialSquareType = 'energy' | 'power' | 'trap';

export interface PowerDef {
  id: PowerType;
  cost: number;
  usesPerGame: number;
}

export const POWERS: Record<PowerType, PowerDef> = {
  shield: { id: 'shield', cost: 20, usesPerGame: 2 },
  freeze: { id: 'freeze', cost: 25, usesPerGame: 2 },
  evolve: { id: 'evolve', cost: 40, usesPerGame: 1 },
  elan: { id: 'elan', cost: 35, usesPerGame: 1 },
};

export const POWER_TYPES: PowerType[] = ['shield', 'freeze', 'evolve', 'elan'];

// Energy granted for landing a piece of this type on an "energy" square.
// Reusing the values from the original chessPieces.tsx sketch: pieces that
// are harder to safely develop to c3/f3/c6/f6 pay off more when they get
// there.
export const PIECE_ENERGY: Record<PieceSymbol, number> = {
  k: 100, q: 90, r: 70, b: 60, n: 65, p: 30,
};

export interface SpecialSquare {
  square: string;
  type: SpecialSquareType;
}

export const SPECIAL_SQUARES: SpecialSquare[] = [
  { square: 'c3', type: 'energy' },
  { square: 'f3', type: 'energy' },
  { square: 'c6', type: 'energy' },
  { square: 'f6', type: 'energy' },
  { square: 'd4', type: 'power' },
  { square: 'e5', type: 'power' },
  { square: 'b2', type: 'trap' },
  { square: 'g7', type: 'trap' },
];

export function specialSquareAt(square: string): SpecialSquare | undefined {
  return SPECIAL_SQUARES.find(s => s.square === square);
}

/** A freeze or shield in effect for exactly one upcoming move, then discarded
 * — see consumeEffectsForColor. */
export interface ActiveEffect {
  type: 'shield' | 'freeze';
  square: string;
  /** Whose next move this constrains: the piece owner for freeze (can't
   * move it), the opponent for shield (can't capture it). */
  affectedColor: Color;
  source: 'power' | 'trap';
}

/** Every log entry is data, not text — the UI translates these at render
 * time via i18n, the same lesson learned translating the rest of the app:
 * bake in a language once and it's a second pass to undo. */
export type LogEntry =
  | { kind: 'energyGained'; color: Color; piece: PieceSymbol; square: string; amount: number }
  | { kind: 'powerCharged'; color: Color; power: PowerType; square: string }
  | { kind: 'trapTriggered'; color: Color; square: string }
  | { kind: 'shieldActivated'; color: Color; square: string }
  | { kind: 'freezeActivated'; color: Color; square: string }
  | { kind: 'evolveActivated'; color: Color; square: string }
  | { kind: 'elanActivated'; color: Color };

export interface PlayerPowerState {
  energy: number;
  /** Remaining activations for this game, shared by paid and free uses. */
  usesRemaining: Record<PowerType, number>;
  /** Free activations banked from landing on a "power" square — spent
   * before energy is touched. */
  freeCharges: Record<PowerType, number>;
}

export interface RevolutionaryState {
  w: PlayerPowerState;
  b: PlayerPowerState;
  activeEffects: ActiveEffect[];
  /** Set the moment a player activates Élan, cleared once their triggering
   * move has been played. */
  elanArmed: Color | null;
  /** Set right after the triggering move so the UI knows to let the same
   * color move again instead of handing the turn over. */
  awaitingBonusMove: Color | null;
  /** Newest-first feed of what happened — see LogEntry, translated by the UI. */
  log: LogEntry[];
}

function freshPlayerState(): PlayerPowerState {
  return {
    energy: 0,
    usesRemaining: { shield: POWERS.shield.usesPerGame, freeze: POWERS.freeze.usesPerGame, evolve: POWERS.evolve.usesPerGame, elan: POWERS.elan.usesPerGame },
    freeCharges: { shield: 0, freeze: 0, evolve: 0, elan: 0 },
  };
}

/**
 * Combines chess.js's own game-over detection with the power-induced case
 * above into one answer the UI can act on directly. `colorToMove` is
 * whoever is about to move in the resulting position. Stalemate is kept
 * distinct from other draws because GameEndModal already displays them
 * differently.
 */
export function checkGameOverAfterMove(
  game: Chess,
  state: RevolutionaryState,
  colorToMove: Color
): { status: 'checkmate' | 'draw' | 'stalemate'; winner: Color | null } | null {
  if (game.isCheckmate()) {
    return { status: 'checkmate', winner: otherColor(colorToMove) };
  }
  if (game.isStalemate()) {
    return { status: 'stalemate', winner: null };
  }
  if (game.isDraw()) {
    return { status: 'draw', winner: null };
  }
  if (isConstrainedGameOver(game, state, colorToMove)) {
    if (game.isCheck()) return { status: 'checkmate', winner: otherColor(colorToMove) };
    return { status: 'stalemate', winner: null };
  }
  return null;
}

export function createInitialRevolutionaryState(): RevolutionaryState {
  return {
    w: freshPlayerState(),
    b: freshPlayerState(),
    activeEffects: [],
    elanArmed: null,
    awaitingBonusMove: null,
    log: [],
  };
}

function otherColor(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

/** Constraints to hand to the human's move validation and to
 * getBestMove(..., { constraints }) for the AI — see chessAI.ts. */
export interface MoveConstraints {
  frozenSquares?: string[];
  shieldedSquares?: string[];
}

export function getConstraintsForColor(state: RevolutionaryState, color: Color): MoveConstraints {
  const frozenSquares: string[] = [];
  const shieldedSquares: string[] = [];
  for (const effect of state.activeEffects) {
    if (effect.affectedColor !== color) continue;
    if (effect.type === 'freeze') frozenSquares.push(effect.square);
    else shieldedSquares.push(effect.square);
  }
  return { frozenSquares, shieldedSquares };
}

/** A move is blocked if it moves a frozen piece, or captures a shielded one. */
export function isMoveBlocked(
  constraints: MoveConstraints,
  from: string,
  to: string,
  isCapture: boolean
): boolean {
  if (constraints.frozenSquares?.includes(from)) return true;
  if (isCapture && constraints.shieldedSquares?.includes(to)) return true;
  return false;
}

/** Removes any effect that constrained this color's move — called once that
 * move (or the lack of any legal move) has been resolved, whether or not
 * the constraint actually mattered. */
export function consumeEffectsForColor(state: RevolutionaryState, color: Color): RevolutionaryState {
  return { ...state, activeEffects: state.activeEffects.filter(e => e.affectedColor !== color) };
}

/**
 * True when `color` has no legal move at all *because of* an active
 * freeze/shield that isn't reflected in chess.js's own game-over check —
 * chess.js has no idea these constraints exist, so isCheckmate()/
 * isStalemate() would both say "false" here even though play cannot
 * continue. The caller still needs game.isCheck() to know whether to score
 * this as a checkmate or a stalemate.
 */
export function isConstrainedGameOver(game: Chess, state: RevolutionaryState, color: Color): boolean {
  if (game.moves().length === 0) return false; // chess.js already covers this case on its own
  const constraints = getConstraintsForColor(state, color);
  if (!constraints.frozenSquares?.length && !constraints.shieldedSquares?.length) return false;
  const anyLegal = game.moves({ verbose: true }).some(
    m => !isMoveBlocked(constraints, m.from, m.to, !!m.captured)
  );
  return !anyLegal;
}

export function canActivatePower(state: RevolutionaryState, color: Color, power: PowerType): boolean {
  const p = state[color];
  if (p.usesRemaining[power] <= 0) return false;
  return p.freeCharges[power] > 0 || p.energy >= POWERS[power].cost;
}

function spendForPower(state: RevolutionaryState, color: Color, power: PowerType): RevolutionaryState {
  const p = state[color];
  const usedFree = p.freeCharges[power] > 0;
  return {
    ...state,
    [color]: {
      ...p,
      energy: usedFree ? p.energy : p.energy - POWERS[power].cost,
      freeCharges: { ...p.freeCharges, [power]: usedFree ? p.freeCharges[power] - 1 : p.freeCharges[power] },
      usesRemaining: { ...p.usesRemaining, [power]: p.usesRemaining[power] - 1 },
    },
  };
}

/** Activates Shield on one of `color`'s own pieces. Returns null (and
 * leaves state untouched) if the activation isn't currently legal. */
export function activateShield(state: RevolutionaryState, color: Color, square: string): RevolutionaryState | null {
  if (!canActivatePower(state, color, 'shield')) return null;
  const next = spendForPower(state, color, 'shield');
  next.activeEffects = [
    ...next.activeEffects.filter(e => !(e.type === 'shield' && e.square === square)),
    { type: 'shield', square, affectedColor: otherColor(color), source: 'power' },
  ];
  next.log = [{ kind: 'shieldActivated', color, square }, ...next.log];
  return next;
}

/** Activates Freeze on an enemy piece at `square`. */
export function activateFreeze(state: RevolutionaryState, color: Color, square: string): RevolutionaryState | null {
  if (!canActivatePower(state, color, 'freeze')) return null;
  const next = spendForPower(state, color, 'freeze');
  next.activeEffects = [
    ...next.activeEffects.filter(e => !(e.type === 'freeze' && e.square === square)),
    { type: 'freeze', square, affectedColor: otherColor(color), source: 'power' },
  ];
  next.log = [{ kind: 'freezeActivated', color, square }, ...next.log];
  return next;
}

/** Transforms one of `color`'s own pawns at `square` into a knight, in
 * place — a chess.js board edit (remove + put), not a move. Returns null if
 * the activation isn't legal or `square` isn't one of that color's pawns. */
export function activateEvolve(game: Chess, state: RevolutionaryState, color: Color, square: string): RevolutionaryState | null {
  if (!canActivatePower(state, color, 'evolve')) return null;
  const piece = game.get(square as never);
  if (!piece || piece.type !== 'p' || piece.color !== color) return null;
  game.remove(square as never);
  game.put({ type: 'n', color }, square as never);
  const next = spendForPower(state, color, 'evolve');
  next.log = [{ kind: 'evolveActivated', color, square }, ...next.log];
  return next;
}

/** Arms Élan: the triggering move still has to be played normally by the
 * caller — see applyElanIfArmed, called right after that move resolves. */
export function activateElan(state: RevolutionaryState, color: Color): RevolutionaryState | null {
  if (!canActivatePower(state, color, 'elan')) return null;
  const next = spendForPower(state, color, 'elan');
  next.elanArmed = color;
  next.log = [{ kind: 'elanActivated', color }, ...next.log];
  return next;
}

/** Forces chess.js to treat it as `color`'s turn again — used once, right
 * after Élan's triggering move, so the same player can move a second time.
 * Board, castling rights and the halfmove clock are untouched; only
 * chess.js's own move-history bookkeeping (and therefore its threefold-
 * repetition detection) resets from this point on, a deliberate,
 * documented trade-off for a casual variant rather than a tracked bug. */
export function forceTurn(game: Chess, color: Color): void {
  const parts = game.fen().split(' ');
  parts[1] = color;
  game.load(parts.join(' '));
}

/**
 * Call right after a move has been applied to `game`. Consumes this color's
 * spent effects, applies any special-square trigger for the square just
 * landed on, and resolves Élan bookkeeping. Returns the updated state; the
 * caller should re-render from it and, if `awaitingBonusMove` comes back
 * set to `color`, let the same player move again instead of passing the
 * turn (and call this function again after that second move).
 */
export function resolveAfterMove(
  game: Chess,
  state: RevolutionaryState,
  color: Color,
  toSquare: string,
  movedPieceType: PieceSymbol
): RevolutionaryState {
  let next = consumeEffectsForColor(state, color);

  const special = specialSquareAt(toSquare);
  if (special) {
    next = { ...next, [color]: { ...next[color] } };
    if (special.type === 'energy') {
      const amount = PIECE_ENERGY[movedPieceType];
      next[color].energy += amount;
      next.log = [{ kind: 'energyGained', color, piece: movedPieceType, square: toSquare, amount }, ...next.log];
    } else if (special.type === 'power') {
      const eligible = POWER_TYPES.filter(p => next[color].usesRemaining[p] > 0);
      if (eligible.length > 0) {
        const granted = eligible[Math.floor(Math.random() * eligible.length)];
        next[color] = { ...next[color], freeCharges: { ...next[color].freeCharges, [granted]: next[color].freeCharges[granted] + 1 } };
        next.log = [{ kind: 'powerCharged', color, power: granted, square: toSquare }, ...next.log];
      }
    } else if (special.type === 'trap') {
      next = {
        ...next,
        activeEffects: [
          ...next.activeEffects.filter(e => !(e.type === 'freeze' && e.square === toSquare)),
          { type: 'freeze', square: toSquare, affectedColor: color, source: 'trap' },
        ],
      };
      next.log = [{ kind: 'trapTriggered', color, square: toSquare }, ...next.log];
    }
  }

  if (next.elanArmed === color) {
    next = { ...next, elanArmed: null, awaitingBonusMove: color };
    forceTurn(game, color);
  } else if (next.awaitingBonusMove === color) {
    next = { ...next, awaitingBonusMove: null };
  }

  return next;
}
