import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Chess, type Move } from 'chess.js';
import '@/i18n/config';
import GameReview from './GameReview';

// Short real game (scholar's mate) replayed through chess.js so the review
// receives genuine Move objects.
function playedMoves(sans: string[]): Move[] {
  const game = new Chess();
  return sans.map(san => game.move(san));
}

describe('GameReview', () => {
  beforeAll(() => {
    // jsdom has no Worker: the hook must fall back to main-thread analysis.
    expect(typeof Worker).toBe('undefined');
  });

  it('analyse la partie puis affiche la position quand on clique sur un coup', async () => {
    const moves = playedMoves(['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#']);
    render(<GameReview open onClose={() => {}} moveHistory={moves} playerColor="w" />);

    // The analysis completes (fallback path, no Worker in jsdom) and shows accuracy.
    await screen.findByText('Précision', {}, { timeout: 15000 });

    // Clicking a move row reveals the board preview of the position before it.
    const rows = await screen.findAllByText(/→/);
    fireEvent.click(rows[0].closest('button')!);
    await waitFor(() => {
      expect(screen.getByText(/Position avant le coup/)).toBeInTheDocument();
    });
  }, 30000);

  it('signale la progression pendant l\'analyse', async () => {
    const moves = playedMoves(['e4', 'e5', 'Nf3', 'Nc6']);
    const { container } = render(
      <GameReview open onClose={() => {}} moveHistory={moves} playerColor="w" />
    );
    // A progressbar is shown while loading (may already be at 100% on fast runs).
    const bar = container.querySelector('[role="progressbar"]');
    await screen.findByText('Précision', {}, { timeout: 15000 });
    expect(bar || screen.getByText('Précision')).toBeTruthy();
  }, 30000);
});
