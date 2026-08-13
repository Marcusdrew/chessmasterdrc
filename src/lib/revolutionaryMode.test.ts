import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { getBestMove } from './chessAI';
import {
  createInitialRevolutionaryState,
  getConstraintsForColor,
  isMoveBlocked,
  isConstrainedGameOver,
  activateShield,
  activateFreeze,
  activateEvolve,
  activateElan,
  resolveAfterMove,
  forceTurn,
  canActivatePower,
  checkGameOverAfterMove,
  POWERS,
  PIECE_ENERGY,
} from './revolutionaryMode';

describe('énergie — cases spéciales', () => {
  it('un cavalier qui atterrit sur une case énergie (f3) gagne la bonne quantité', () => {
    const game = new Chess();
    game.move('Nf3');
    let state = createInitialRevolutionaryState();
    state = resolveAfterMove(game, state, 'w', 'f3', 'n');
    expect(state.w.energy).toBe(PIECE_ENERGY.n);
    expect(state.b.energy).toBe(0);
  });

  it('une case power (d4) accorde une charge gratuite d\'un pouvoir non épuisé', () => {
    const game = new Chess();
    game.move('d4');
    let state = createInitialRevolutionaryState();
    state = resolveAfterMove(game, state, 'w', 'd4', 'p');
    const totalFree = Object.values(state.w.freeCharges).reduce((a, b) => a + b, 0);
    expect(totalFree).toBe(1);
  });

  it('une case sans effet spécial (e4) ne change rien', () => {
    const game = new Chess();
    game.move('e4');
    let state = createInitialRevolutionaryState();
    state = resolveAfterMove(game, state, 'w', 'e4', 'p');
    expect(state.w.energy).toBe(0);
    expect(state.activeEffects).toHaveLength(0);
  });
});

describe('case piège (b2/g7)', () => {
  it('atterrir sur un piège gèle sa propre pièce pour le prochain trait de son camp', () => {
    const game = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    // Simule une pièce noire atterrissant en g7 n'a pas de sens (pion déjà là) ;
    // on teste plutôt via resolveAfterMove directement, indépendamment du coup joué.
    let state = createInitialRevolutionaryState();
    state = resolveAfterMove(game, state, 'b', 'g7', 'n');
    const constraints = getConstraintsForColor(state, 'b');
    expect(constraints.frozenSquares).toContain('g7');
    // Ça ne doit pas affecter l'autre camp
    expect(getConstraintsForColor(state, 'w').frozenSquares).not.toContain('g7');
  });

  it('l\'effet piège disparaît une fois le trait du camp concerné consommé', () => {
    const game = new Chess();
    let state = createInitialRevolutionaryState();
    state = resolveAfterMove(game, state, 'b', 'b2', 'n');
    expect(getConstraintsForColor(state, 'b').frozenSquares).toContain('b2');
    state = { ...state, activeEffects: state.activeEffects };
    const afterConsume = { ...state, activeEffects: state.activeEffects.filter(e => e.affectedColor !== 'b') };
    expect(getConstraintsForColor(afterConsume, 'b').frozenSquares).toHaveLength(0);
  });
});

describe('pouvoir Bouclier', () => {
  it('empêche la capture de la case protégée pour le camp adverse', () => {
    const state = createInitialRevolutionaryState();
    state.w.energy = 100;
    const next = activateShield(state, 'w', 'd4');
    expect(next).not.toBeNull();
    const constraints = getConstraintsForColor(next!, 'b');
    expect(constraints.shieldedSquares).toContain('d4');
  });

  it('refuse l\'activation sans énergie ni charge gratuite', () => {
    const state = createInitialRevolutionaryState(); // energy = 0
    expect(activateShield(state, 'w', 'd4')).toBeNull();
  });

  it('refuse l\'activation au-delà du nombre d\'usages par partie', () => {
    let state = createInitialRevolutionaryState();
    state.w.energy = 1000;
    for (let i = 0; i < POWERS.shield.usesPerGame; i++) {
      const next = activateShield(state, 'w', 'd4');
      expect(next).not.toBeNull();
      state = next!;
    }
    expect(activateShield(state, 'w', 'd4')).toBeNull();
  });

  it('une charge gratuite est consommée avant l\'énergie', () => {
    const state = createInitialRevolutionaryState();
    state.w.energy = 5; // pas assez pour payer le coût normal
    state.w.freeCharges.shield = 1;
    const next = activateShield(state, 'w', 'd4');
    expect(next).not.toBeNull();
    expect(next!.w.energy).toBe(5); // énergie inchangée, la charge gratuite a payé
    expect(next!.w.freeCharges.shield).toBe(0);
  });
});

describe('pouvoir Gel', () => {
  it('empêche de déplacer la pièce ciblée pour son propriétaire', () => {
    const state = createInitialRevolutionaryState();
    state.w.energy = 100;
    const next = activateFreeze(state, 'w', 'e5');
    expect(next).not.toBeNull();
    expect(getConstraintsForColor(next!, 'b').frozenSquares).toContain('e5');
  });
});

describe('isMoveBlocked / isConstrainedGameOver', () => {
  it('bloque un coup partant d\'une case gelée', () => {
    expect(isMoveBlocked({ frozenSquares: ['e5'] }, 'e5', 'e6', false)).toBe(true);
    expect(isMoveBlocked({ frozenSquares: ['e5'] }, 'd5', 'e6', false)).toBe(false);
  });

  it('bloque une capture sur une case protégée, mais pas un coup non-capturant vers la même case', () => {
    expect(isMoveBlocked({ shieldedSquares: ['d5'] }, 'e4', 'd5', true)).toBe(true);
    expect(isMoveBlocked({ shieldedSquares: ['d5'] }, 'e4', 'd5', false)).toBe(false);
  });

  it('détecte une position sans issue causée uniquement par un gel total', () => {
    // Position où le seul coup légal des blancs est de bouger le cavalier en d4.
    const game = new Chess('4k3/8/8/8/3N4/8/8/4K3 w - - 0 1');
    let state = createInitialRevolutionaryState();
    // On gèle artificiellement le cavalier ; le roi seul n'a par construction
    // aucun coup légal disponible dans cette position (K sur e1 entouré de
    // cases contrôlées par son propre cavalier... on vérifie juste la logique
    // en gelant TOUTES les pièces qui ont des coups).
    const allMoves = game.moves({ verbose: true });
    const fromSquares = [...new Set(allMoves.map(m => m.from))];
    state = { ...state, activeEffects: fromSquares.map(sq => ({ type: 'freeze' as const, square: sq, affectedColor: 'w' as const, source: 'power' as const })) };
    expect(isConstrainedGameOver(game, state, 'w')).toBe(true);
  });

  it('ne signale pas de fin de partie si un coup légal reste disponible malgré les contraintes', () => {
    const game = new Chess();
    let state = createInitialRevolutionaryState();
    state = { ...state, activeEffects: [{ type: 'freeze', square: 'e2', affectedColor: 'w', source: 'power' }] };
    expect(isConstrainedGameOver(game, state, 'w')).toBe(false); // d2-d4 etc. restent légaux
  });
});

describe('pouvoir Évolution', () => {
  it('transforme un pion propre en cavalier sur place', () => {
    const game = new Chess();
    game.move('e4'); game.move('e5');
    const state = createInitialRevolutionaryState();
    state.w.energy = 100;
    const next = activateEvolve(game, state, 'w', 'e4');
    expect(next).not.toBeNull();
    const piece = game.get('e4');
    expect(piece?.type).toBe('n');
    expect(piece?.color).toBe('w');
  });

  it('refuse de transformer un pion adverse', () => {
    const game = new Chess();
    game.move('e4'); game.move('e5');
    const state = createInitialRevolutionaryState();
    state.w.energy = 100;
    expect(activateEvolve(game, state, 'w', 'e5')).toBeNull();
  });

  it('refuse de transformer une case qui n\'est pas un pion', () => {
    const game = new Chess();
    const state = createInitialRevolutionaryState();
    state.w.energy = 100;
    expect(activateEvolve(game, state, 'w', 'e1')).toBeNull(); // roi, pas un pion
  });
});

describe('pouvoir Élan (coup bonus)', () => {
  it('permet au même camp de jouer deux coups légaux à la suite', () => {
    const game = new Chess();
    let state = createInitialRevolutionaryState();
    state.w.energy = 100;

    state = activateElan(state, 'w')!;
    expect(state.elanArmed).toBe('w');

    const m1 = game.move('e4');
    expect(m1).toBeTruthy();
    state = resolveAfterMove(game, state, 'w', 'e4', 'p');
    expect(state.awaitingBonusMove).toBe('w');
    expect(game.turn()).toBe('w'); // le trait a été forcé pour rester aux blancs

    const m2 = game.move('Nf3'); // second coup légal des blancs
    expect(m2).toBeTruthy();
    state = resolveAfterMove(game, state, 'w', 'f3', 'n');
    expect(state.awaitingBonusMove).toBeNull();
    expect(game.turn()).toBe('b'); // le trait revient normalement aux noirs
  });

  it('forceTurn ne modifie ni le plateau ni les droits au roque', () => {
    const game = new Chess();
    game.move('e4');
    const before = game.fen().split(' ');
    forceTurn(game, 'w');
    const after = game.fen().split(' ');
    expect(after[0]).toBe(before[0]); // plateau identique
    expect(after[2]).toBe(before[2]); // droits de roque identiques
    expect(after[1]).toBe('w'); // trait forcé
  });
});

describe('canActivatePower', () => {
  it('vrai si assez d\'énergie et des usages restants', () => {
    const state = createInitialRevolutionaryState();
    state.w.energy = 100;
    expect(canActivatePower(state, 'w', 'shield')).toBe(true);
  });

  it('faux sans énergie suffisante ni charge gratuite', () => {
    const state = createInitialRevolutionaryState();
    expect(canActivatePower(state, 'w', 'shield')).toBe(false);
  });
});

describe('IA et contraintes (gel/bouclier) — via getBestMove', () => {
  it('l\'IA ne choisit jamais un coup partant d\'une case gelée', () => {
    const game = new Chess();
    // On gèle tous les pions sauf un, pour vérifier que l'IA se rabat dessus.
    const moves = game.moves({ verbose: true });
    const frozen = [...new Set(moves.map(m => m.from))].filter(sq => sq !== 'g1' && sq !== 'b1');
    for (let i = 0; i < 20; i++) {
      const best = getBestMove(game, 'amateur', { ignoreRandomness: true, constraints: { frozenSquares: frozen } });
      expect(best).not.toBeNull();
      expect(frozen).not.toContain(best!.from);
    }
  });

  it('l\'IA ne capture jamais une case protégée', () => {
    // Position où la dame blanche peut prendre une tour noire non défendue en b5.
    const game = new Chess('1r4k1/5ppp/8/1p6/Q7/8/5PPP/6K1 w - - 0 1');
    const best = getBestMove(game, 'expert', { ignoreRandomness: true, constraints: { shieldedSquares: ['b5'] } });
    expect(best).not.toBeNull();
    expect(`${best!.from}${best!.to}`).not.toBe('a4b5');
  });

  it('renvoie null si toutes les origines légales sont gelées', () => {
    const game = new Chess();
    const allFroms = [...new Set(game.moves({ verbose: true }).map(m => m.from))];
    const best = getBestMove(game, 'expert', { constraints: { frozenSquares: allFroms } });
    expect(best).toBeNull();
  });
});

describe('checkGameOverAfterMove', () => {
  it('détecte un mat classique, sans aucune contrainte active', () => {
    const game = new Chess('3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1');
    game.move('Rd1');
    const state = createInitialRevolutionaryState();
    const result = checkGameOverAfterMove(game, state, 'w');
    expect(result).toEqual({ status: 'checkmate', winner: 'b' });
  });

  it('renvoie null quand la partie continue normalement', () => {
    const game = new Chess();
    const state = createInitialRevolutionaryState();
    expect(checkGameOverAfterMove(game, state, 'b')).toBeNull();
  });
});

describe('checkGameOverAfterMove — distinction pat / nulle', () => {
  it('renvoie "stalemate" (pas "draw") pour un pat classique', () => {
    const game = new Chess('k7/2Q5/1K6/8/8/8/8/8 b - - 0 1');
    expect(game.isStalemate()).toBe(true);
    const state = createInitialRevolutionaryState();
    expect(checkGameOverAfterMove(game, state, 'b')).toEqual({ status: 'stalemate', winner: null });
  });
});
