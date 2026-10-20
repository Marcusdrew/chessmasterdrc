import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Chess, type Move } from 'chess.js';
import { useChessGame } from './useChessGame';

const engine = vi.hoisted(() => ({ getMoveAsync: vi.fn() }));
vi.mock('./useChessAIWorker', () => ({ useChessAIWorker: () => engine }));
vi.mock('@/hooks/useSensations', () => ({ useSensations: () => ({ triggerFeedback: () => {} }) }));

describe('finished match lifecycle', () => {
  beforeEach(() => { vi.useFakeTimers(); engine.getMoveAsync.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it('a delayed AI reply cannot reopen a match after timeout', async () => {
    let reply: ((move: Move) => void) | undefined;
    engine.getMoveAsync.mockReturnValue(new Promise<Move>(resolve => { reply = resolve; }));
    const { result } = renderHook(() => useChessGame(true, 'w', 'amateur'));
    act(() => result.current.handleSquareClick('e2'));
    act(() => result.current.handleSquareClick('e4'));
    act(() => result.current.forceEnd('b'));
    const game = new Chess(); game.move('e4');
    const move = game.move('e5');
    await act(async () => { reply?.(move); await vi.advanceTimersByTimeAsync(1500); });
    expect(result.current.state.gameStatus).toBe('checkmate');
    expect(result.current.state.winner).toBe('w');
    expect(result.current.state.moveHistory).toHaveLength(1);
  });

  it('restores a completed match as completed', () => {
    const { result } = renderHook(() => useChessGame(true, 'w', 'amateur', ['f3', 'e5', 'g4', 'Qh4#']));
    expect(result.current.state.gameStatus).toBe('checkmate');
    expect(result.current.state.winner).toBe('b');
    expect(engine.getMoveAsync).not.toHaveBeenCalled();
  });
});