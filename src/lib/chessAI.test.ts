import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { getBestMove, evaluatePosition, type Difficulty } from './chessAI';

const ALL_DIFFICULTIES: Difficulty[] = ['amateur', 'debutant', 'intermediaire', 'avance', 'expert'];

describe('getBestMove — coups légaux de base', () => {
  it('renvoie toujours un coup légal, à tous les niveaux, depuis la position de départ', () => {
    for (const difficulty of ALL_DIFFICULTIES) {
      const game = new Chess();
      const legal = new Set(game.moves());
      const best = getBestMove(game, difficulty, { ignoreRandomness: true });
      expect(best).not.toBeNull();
      expect(legal.has(best!.san)).toBe(true);
    }
  });

  it("renvoie null quand il n'y a plus de coup légal (position déjà terminée)", () => {
    // 3r2k1/5ppp/8/8/8/8/5PPP/6K1 après Rd1# — plus aucun coup légal pour les blancs
    const game = new Chess('3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1');
    game.move('Rd1');
    expect(game.isCheckmate()).toBe(true);
    expect(getBestMove(game, 'expert')).toBeNull();
  });
});

describe('getBestMove — détection de mat', () => {
  // Position vérifiée : tour d8 -> d1 fait un mat au couloir immédiat.
  const MATE_IN_ONE_FEN = '3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1';

  it.each(ALL_DIFFICULTIES)(
    'trouve le mat en 1 (Rd1#) à la difficulté "%s" (sans aléatoire)',
    (difficulty) => {
      const game = new Chess(MATE_IN_ONE_FEN);
      const best = getBestMove(game, difficulty, { ignoreRandomness: true });
      expect(best).not.toBeNull();
      expect(best!.from).toBe('d8');
      expect(best!.to).toBe('d1');
    }
  );

  it('evaluatePosition retourne un score écrasant en faveur de celui qui vient de mater', () => {
    const game = new Chess(MATE_IN_ONE_FEN);
    game.move('Rd1');
    // Trait aux blancs, qui sont maté -> score très négatif (point de vue blanc)
    expect(evaluatePosition(game)).toBeLessThan(-9000);
  });
});

describe('quiescence — effet d’horizon', () => {
  // Position vérifiée : la dame blanche peut prendre un pion en b5, mais ce
  // pion est défendu par la tour noire en b8. Sans quiescence, une recherche
  // à profondeur 1 (niveau "amateur"/"débutant") ne regarde pas assez loin
  // pour voir la reprise Txb5 et croit avoir simplement gagné un pion.
  const HORIZON_TRAP_FEN = '1r4k1/5ppp/8/1p6/Q7/8/5PPP/6K1 w - - 0 1';

  it('ne fonce pas sur une pièce défendue avec la dame, même à faible profondeur', () => {
    const game = new Chess(HORIZON_TRAP_FEN);
    // Sans quiescence, "amateur" (profondeur 1) tomberait dans le panneau.
    const best = getBestMove(game, 'amateur', { ignoreRandomness: true });
    expect(best).not.toBeNull();
    expect(`${best!.from}${best!.to}`).not.toBe('a4b5');
  });

  it('évalue Qxb5 comme nettement défavorable une fois la reprise vue', () => {
    const game = new Chess(HORIZON_TRAP_FEN);
    game.move('Qxb5');
    // Matériel brut après Qxb5 puis Txb5 : blancs Q(900)+3P(300)=1200 avant,
    // 3P(300) après (dame perdue) ; noirs R(500)+3P(300)=800 inchangé côté
    // matériel restant -> ~300-800 = -500. On laisse une marge raisonnable.
    expect(evaluatePosition(game, 1)).toBeLessThan(-300);
  });
});

describe('getBestMove — option ignoreRandomness', () => {
  it('est déterministe quand ignoreRandomness est vrai, même à "amateur" (85% de hasard)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 25; i++) {
      const game = new Chess();
      const best = getBestMove(game, 'amateur', { ignoreRandomness: true });
      results.add(`${best!.from}${best!.to}`);
    }
    // Toujours le même coup depuis la position de départ, quel que soit le tirage aléatoire.
    expect(results.size).toBe(1);
  });
});

describe('evaluatePosition — nulle', () => {
  it('retourne 0 pour un pat', () => {
    // Position de pat classique : roi noir en a8 non en échec mais sans coup légal.
    const game = new Chess('k7/2Q5/1K6/8/8/8/8/8 b - - 0 1');
    expect(game.isStalemate()).toBe(true);
    expect(evaluatePosition(game)).toBe(0);
  });
});

describe('getBestMove — ne casse pas sur une position tactique chargée', () => {
  it('termine en un temps raisonnable et rend un coup légal à "expert"', () => {
    // Quelques échanges au centre pour donner du grain à moudre à la quiescence.
    // Mesuré ~3.2s sur ce bac à sable (1 cœur, matériel modeste) avec le
    // budget de nœuds calibré ; ce seuil laisse une marge confortable tout
    // en détectant clairement une régression du plafonnage (sans lui,
    // c'était 58 000+ ms sur cette même position).
    const game = new Chess();
    for (const san of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Na5']) {
      game.move(san);
    }
    const legal = new Set(game.moves());
    const start = Date.now();
    const best = getBestMove(game, 'expert', { ignoreRandomness: true });
    const elapsed = Date.now() - start;

    expect(best).not.toBeNull();
    expect(legal.has(best!.san)).toBe(true);
    expect(elapsed).toBeLessThan(8000);
  });
});
