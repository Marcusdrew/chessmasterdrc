import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chess } from 'chess.js';
import { useChessGame } from '@/hooks/useChessGame';
import { useElo } from '@/hooks/useElo';
import { useChessAIWorker } from '@/hooks/useChessAIWorker';
import ChessBoard from '@/components/chess/ChessBoard';
import MoveHistory from '@/components/chess/MoveHistory';
import AiAnalysis from '@/components/chess/AiAnalysis';
import GameEndModal from '@/components/chess/GameEndModal';
import HintDisplay from '@/components/chess/HintDisplay';
import GameReview from '@/components/chess/GameReview';
import SensationsToggle from '@/components/SensationsToggle';
import type { Difficulty } from '@/lib/chessAI';

const Game: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const playerColor = (searchParams.get('color') || 'w') as 'w' | 'b';
  const difficulty = (searchParams.get('difficulty') || 'intermediaire') as Difficulty;
  const timeParam = searchParams.get('time') || 'unlimited';
  const initialSeconds = timeParam === 'unlimited' ? null : parseInt(timeParam, 10) * 60;

  // Persistence key based on game configuration
  const saveKey = `chessmaster_game_${playerColor}_${difficulty}_${timeParam}`;
  const savedRef = useRef<{ moves: string[]; whiteTime: number | null; blackTime: number | null } | null>(null);
  if (savedRef.current === null) {
    try {
      const raw = localStorage.getItem(saveKey);
      savedRef.current = raw ? JSON.parse(raw) : { moves: [], whiteTime: initialSeconds, blackTime: initialSeconds };
    } catch {
      savedRef.current = { moves: [], whiteTime: initialSeconds, blackTime: initialSeconds };
    }
  }

  const { fen, board, state, handleSquareClick, undoMove, resetGame, forceEnd, isInCheck, currentTurn } =
    useChessGame(true, playerColor, difficulty, savedRef.current.moves);
  const { getMoveAsync } = useChessAIWorker();
  // Always holds the latest fen, so an in-flight hint request can tell if
  // the position has since moved on and discard itself instead of pointing
  // at squares that no longer mean what they used to.
  const latestFenRef = useRef(fen);
  latestFenRef.current = fen;

  const [whiteTime, setWhiteTime] = useState<number | null>(savedRef.current.whiteTime ?? initialSeconds);
  const [blackTime, setBlackTime] = useState<number | null>(savedRef.current.blackTime ?? initialSeconds);

  const { elo, updateElo } = useElo(difficulty);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [eloUpdated, setEloUpdated] = useState(false);

  const [hint, setHint] = useState<{ from: string; to: string } | null>(null);

  // Persist game state on every change
  useEffect(() => {
    if (state.gameStatus !== 'playing') {
      localStorage.removeItem(saveKey);
      return;
    }
    const sanMoves = state.moveHistory.map(m => m.san);
    localStorage.setItem(saveKey, JSON.stringify({ moves: sanMoves, whiteTime, blackTime }));
  }, [fen, state.moveHistory, whiteTime, blackTime, state.gameStatus, saveKey]);

  // Update ELO when game ends — only if at least one move was played
  useEffect(() => {
    if (state.gameStatus === 'playing' || eloUpdated) return;
    if (state.moveHistory.length === 0) { setEloUpdated(true); return; }
    const result = state.gameStatus === 'checkmate'
      ? state.winner === playerColor ? 'win' : 'loss'
      : 'draw';
    const { change } = updateElo(result as 'win' | 'loss' | 'draw');
    setEloChange(change);
    setEloUpdated(true);
  }, [state.gameStatus, state.winner, state.moveHistory.length, playerColor, eloUpdated, updateElo]);

  const [showReview, setShowReview] = useState(false);

  // Reset eloUpdated on rematch
  const handleRematch = useCallback(() => {
    setEloUpdated(false);
    setEloChange(null);
    setShowReview(false);
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
    const requestedFen = fen;
    // Real difficulty of this game, and ignoreRandomness so the hint always
    // shows the engine's actual best move rather than occasionally one of
    // its deliberate mistakes (those exist to make the opponent feel human,
    // not to make hints unreliable).
    getMoveAsync(fen, difficulty, { ignoreRandomness: true }).then(best => {
      if (!best || latestFenRef.current !== requestedFen) return;
      setHint({ from: best.from, to: best.to });
      setTimeout(() => setHint(null), 5000);
    });
  }, [fen, playerColor, difficulty, state.gameStatus, state.isAiThinking, getMoveAsync]);

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
                ? t('game.opponentThinking')
                : currentTurn === playerColor ? t('game.yourTurn') : t('game.opponentTurn')
              : ''
            }
          </span>
          <SensationsToggle className="border border-border rounded" />
          <button
            onClick={undoMove}
            disabled={state.moveHistory.length === 0 || state.isAiThinking}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↩ {t('game.undo')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('common.menu')}
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
        onReview={state.moveHistory.length > 0 ? () => setShowReview(true) : undefined}
      />

      <GameReview
        open={showReview}
        onClose={() => setShowReview(false)}
        moveHistory={state.moveHistory}
        playerColor={playerColor}
      />

      <HintDisplay hint={hint} onDismiss={() => setHint(null)} />
    </div>
  );
};

export default Game;
