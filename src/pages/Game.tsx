import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { useChessGame } from '@/hooks/useChessGame';
import { useElo } from '@/hooks/useElo';
import { getBestMove } from '@/lib/chessAI';
import ChessBoard from '@/components/chess/ChessBoard';
import MoveHistory from '@/components/chess/MoveHistory';
import AiAnalysis from '@/components/chess/AiAnalysis';
import GameEndModal from '@/components/chess/GameEndModal';
import HintDisplay from '@/components/chess/HintDisplay';
import type { Difficulty } from '@/lib/chessAI';

const Game: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerColor = (searchParams.get('color') || 'w') as 'w' | 'b';
  const difficulty = (searchParams.get('difficulty') || 'intermediaire') as Difficulty;
  const timeParam = searchParams.get('time') || 'unlimited';
  const initialSeconds = timeParam === 'unlimited' ? null : parseInt(timeParam, 10) * 60;

  const { fen, board, state, handleSquareClick, undoMove, resetGame, forceEnd, isInCheck, currentTurn } =
    useChessGame(true, playerColor, difficulty);

  const [whiteTime, setWhiteTime] = useState<number | null>(initialSeconds);
  const [blackTime, setBlackTime] = useState<number | null>(initialSeconds);

  const { elo, updateElo } = useElo(difficulty);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [eloUpdated, setEloUpdated] = useState(false);

  const [hint, setHint] = useState<{ from: string; to: string } | null>(null);

  // Update ELO when game ends
  useEffect(() => {
    if (state.gameStatus === 'playing' || eloUpdated) return;
    const result = state.gameStatus === 'checkmate'
      ? state.winner === playerColor ? 'win' : 'loss'
      : 'draw';
    const { change } = updateElo(result as 'win' | 'loss' | 'draw');
    setEloChange(change);
    setEloUpdated(true);
  }, [state.gameStatus, state.winner, playerColor, eloUpdated, updateElo]);

  // Reset eloUpdated on rematch
  const handleRematch = useCallback(() => {
    setEloUpdated(false);
    setEloChange(null);
    setWhiteTime(initialSeconds);
    setBlackTime(initialSeconds);
    resetGame();
  }, [resetGame, initialSeconds]);

  // Countdown timer — use refs to avoid stale closures and interval recreation
  const turnRef = useRef(currentTurn);
  const statusRef = useRef(state.gameStatus);
  useEffect(() => { turnRef.current = currentTurn; }, [currentTurn]);
  useEffect(() => { statusRef.current = state.gameStatus; }, [state.gameStatus]);

  useEffect(() => {
    if (initialSeconds === null) return;
    const interval = setInterval(() => {
      if (statusRef.current !== 'playing') return;
      if (turnRef.current === 'w') {
        setWhiteTime(t => {
          if (t === null) return t;
          if (t <= 1) { forceEnd('w'); return 0; }
          return t - 1;
        });
      } else {
        setBlackTime(t => {
          if (t === null) return t;
          if (t <= 1) { forceEnd('b'); return 0; }
          return t - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [initialSeconds, forceEnd]);

  const fmt = (s: number | null) => s === null ? '∞' : `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const handleHint = useCallback(() => {
    if (state.gameStatus !== 'playing' || state.isAiThinking) return;
    const tempGame = new Chess(fen);
    if (tempGame.turn() !== playerColor) return;
    const best = getBestMove(tempGame, 'intermediaire');
    if (best) {
      setHint({ from: best.from, to: best.to });
      setTimeout(() => setHint(null), 5000);
    }
  }, [fen, playerColor, state.gameStatus, state.isAiThinking]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-display font-bold text-foreground">
            Chess<span className="text-accent">Master</span>
          </h1>
          <span className="text-xs font-body bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
            ELO {elo}{eloChange !== null && (
              <span className={eloChange >= 0 ? 'text-chess-valid ml-1' : 'text-destructive ml-1'}>
                ({eloChange > 0 ? '+' : ''}{eloChange})
              </span>
            )}
          </span>
          {initialSeconds !== null && (
            <div className="flex items-center gap-2 text-xs font-mono" translate="no">
              <span className={`px-2 py-1 rounded notranslate ${currentTurn === 'w' && state.gameStatus === 'playing' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`} translate="no">
                ♔ <span translate="no">{fmt(whiteTime)}</span>
              </span>
              <span className={`px-2 py-1 rounded notranslate ${currentTurn === 'b' && state.gameStatus === 'playing' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`} translate="no">
                ♚ <span translate="no">{fmt(blackTime)}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 font-body text-sm">
          <span className={`flex items-center gap-1.5 ${state.gameStatus === 'playing' ? '' : 'opacity-50'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${currentTurn === 'w' ? 'bg-foreground' : 'bg-foreground/30'}`} />
            {state.gameStatus === 'playing'
              ? state.isAiThinking
                ? 'Adversaire réfléchit...'
                : currentTurn === playerColor ? 'Votre tour' : "Tour de l'adversaire"
              : ''
            }
          </span>
          <button
            onClick={undoMove}
            disabled={state.moveHistory.length === 0 || state.isAiThinking}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↩ Undo
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Menu
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center gap-4 p-4 overflow-hidden">
        <div className="hidden lg:block w-72 h-[560px]">
          <AiAnalysis
            moveHistory={state.moveHistory}
            fen={fen}
            currentTurn={currentTurn}
            gameStatus={state.gameStatus}
            playerColor={playerColor}
            onHint={handleHint}
          />
        </div>

        <ChessBoard
          board={board}
          selectedSquare={state.selectedSquare}
          validMoves={state.validMoves}
          isInCheck={isInCheck}
          currentTurn={currentTurn}
          playerColor={playerColor}
          hint={hint}
          onSquareClick={handleSquareClick}
        />

        <div className="hidden lg:block w-56 h-[560px]">
          <MoveHistory moveHistory={state.moveHistory} />
        </div>
      </main>

      <div className="lg:hidden flex gap-2 px-4 pb-4">
        <div className="flex-1 max-h-48">
          <AiAnalysis
            moveHistory={state.moveHistory}
            fen={fen}
            currentTurn={currentTurn}
            gameStatus={state.gameStatus}
            playerColor={playerColor}
            onHint={handleHint}
          />
        </div>
        <div className="flex-1 max-h-48">
          <MoveHistory moveHistory={state.moveHistory} />
        </div>
      </div>

      <GameEndModal
        gameStatus={state.gameStatus}
        winner={state.winner}
        playerColor={playerColor}
        onRematch={handleRematch}
        onMenu={() => navigate('/')}
        eloChange={eloChange}
        newElo={eloUpdated ? elo : null}
      />

      <HintDisplay hint={hint} onDismiss={() => setHint(null)} />
    </div>
  );
};

export default Game;
