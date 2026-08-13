import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRevolutionaryGame } from '@/hooks/useRevolutionaryGame';
import ChessBoard from '@/components/chess/ChessBoard';
import GameEndModal from '@/components/chess/GameEndModal';
import SensationsToggle from '@/components/SensationsToggle';
import PowerBar, { RevolutionaryLog } from '@/components/chess/PowerBar';
import { getConstraintsForColor, type PowerType } from '@/lib/revolutionaryMode';
import type { Difficulty } from '@/lib/chessAI';
import type { Color } from 'chess.js';

const RevolutionaryGame: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const playerColor = (searchParams.get('color') as Color) || 'w';
  const difficulty = (searchParams.get('difficulty') as Difficulty) || 'intermediaire';

  const {
    fen, board, state, revState, specialSquares,
    handleSquareClick, startTargetingPower, resetGame,
    isInCheck, currentTurn,
  } = useRevolutionaryGame(true, playerColor, difficulty);

  const isMyTurn = currentTurn === playerColor && !state.isAiThinking;

  const opponentConstraints = useMemo(
    () => getConstraintsForColor(revState, currentTurn === 'w' ? 'w' : 'b'),
    [revState, currentTurn]
  );
  const frozenSquares = useMemo(
    () => revState.activeEffects.filter(e => e.type === 'freeze').map(e => e.square),
    [revState.activeEffects]
  );
  const shieldedSquares = useMemo(
    () => revState.activeEffects.filter(e => e.type === 'shield').map(e => e.square),
    [revState.activeEffects]
  );

  const targetableSquares = useMemo(() => {
    if (!state.targetingPower) return [];
    const power = state.targetingPower;
    const squares: string[] = [];
    board.forEach(row => row.forEach(piece => {
      if (!piece) return;
      if (power === 'shield' && piece.color === playerColor) squares.push(piece.square);
      if (power === 'freeze' && piece.color !== playerColor) squares.push(piece.square);
      if (power === 'evolve' && piece.color === playerColor && piece.type === 'p') squares.push(piece.square);
    }));
    return squares;
  }, [state.targetingPower, board, playerColor]);

  const targetingHint: Partial<Record<PowerType, string>> = {
    shield: t('revolutionary.targetOwnPiece'),
    freeze: t('revolutionary.targetEnemyPiece'),
    evolve: t('revolutionary.targetOwnPawn'),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">
          Chess<span className="text-accent">Master</span>
          <span className="text-sm font-body text-rev-power ml-3">⚡ {t('playConfig.modeRevolutionary')}</span>
        </h1>
        <div className="flex items-center gap-2">
          <SensationsToggle className="border border-border rounded" />
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            {t('common.menu')}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div className="flex flex-col items-center gap-3">
          {revState.awaitingBonusMove === playerColor && (
            <div className="w-full max-w-md text-center text-sm font-body py-1.5 rounded-lg bg-rev-power/15 text-rev-power">
              {t('revolutionary.elanBonusMove')}
            </div>
          )}
          {state.targetingPower && (
            <div className="w-full max-w-md text-center text-sm font-body py-1.5 rounded-lg bg-rev-power/15 text-rev-power animate-pulse">
              {targetingHint[state.targetingPower]}
            </div>
          )}
          {!state.targetingPower && !revState.awaitingBonusMove && (
            <p className="text-sm font-body text-muted-foreground">
              {state.isAiThinking ? t('game.opponentThinking') : isMyTurn ? t('game.yourTurn') : t('game.opponentTurn')}
            </p>
          )}

          <div className="w-full max-w-md aspect-square grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-lg border border-border">
            <ChessBoard
              board={board}
              selectedSquare={state.selectedSquare}
              validMoves={state.validMoves}
              isInCheck={isInCheck}
              currentTurn={currentTurn}
              playerColor={playerColor}
              specialSquares={specialSquares}
              frozenSquares={frozenSquares}
              shieldedSquares={shieldedSquares}
              targetableSquares={targetableSquares}
              onSquareClick={handleSquareClick}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t('playConfig.white')} / {t('playConfig.black')}
            </h2>
            <PowerBar
              revState={revState}
              color={playerColor}
              isMyTurn={isMyTurn}
              targetingPower={state.targetingPower}
              onActivate={startTargetingPower}
            />
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('revolutionary.log_heading')}
            </h2>
            <RevolutionaryLog entries={revState.log} />
          </div>
        </div>
      </div>

      <GameEndModal
        gameStatus={state.gameStatus}
        winner={state.winner}
        playerColor={playerColor}
        onRematch={resetGame}
        onMenu={() => navigate('/')}
      />
    </div>
  );
};

export default RevolutionaryGame;
