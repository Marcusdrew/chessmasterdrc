import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Chess, type Move } from 'chess.js';
import { useChessAIWorker } from '@/hooks/useChessAIWorker';
import ChessBoard from '@/components/chess/ChessBoard';
import {
  qualityColor,
  qualityIcon,
  type GameReviewSummary,
  type MoveQuality,
  type ReviewedMove,
} from '@/lib/gameReview';

interface GameReviewProps {
  open: boolean;
  onClose: () => void;
  moveHistory: Move[];
  playerColor: 'w' | 'b';
}

const QUALITY_ORDER: MoveQuality[] = ['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'];
const TIP_COUNT = 4;

const GameReview: React.FC<GameReviewProps> = ({ open, onClose, moveHistory, playerColor }) => {
  const { t } = useTranslation();
  const { analyzeGameAsync } = useChessAIWorker();
  const [summary, setSummary] = useState<GameReviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [selected, setSelected] = useState<ReviewedMove | null>(null);
  const [showBest, setShowBest] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cache = useRef<{ key: string; summary: GameReviewSummary } | null>(null);
  const reviewKey = `${playerColor}:${moveHistory.map(m => m.san).join(' ')}`;

  // Position before each ply, so a reviewed move can be replayed visually.
  const boards = useMemo(() => {
    const game = new Chess();
    const result = [game.board()];
    for (const m of moveHistory) {
      game.move({ from: m.from, to: m.to, promotion: m.promotion });
      result.push(game.board());
    }
    return result;
  }, [moveHistory]);

  useEffect(() => {
    if (!open) return;
    if (cache.current?.key === reviewKey) {
      setSummary(cache.current.summary);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setError(false);
    setLoading(true);
    setSummary(null);
    setProgress(null);
    setSelected(null);
    setShowBest(false);
    // Small defer so the UI can paint the loader before analysis starts —
    // matters most if the Worker is unavailable and analysis falls back to
    // running on the main thread.
    const timer = setTimeout(() => {
      analyzeGameAsync(moveHistory, playerColor, 2, (done, total) => {
        if (!cancelled) setProgress({ done, total });
      }).then(s => {
        if (cancelled) return;
        cache.current = { key: reviewKey, summary: s };
        setSummary(s);
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setLoading(false);
        setError(true);
      });
    }, 50);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, moveHistory, playerColor, analyzeGameAsync, reviewKey, attempt]);

  // Rotate tips while the analysis runs so the wait feels shorter.
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setTipIndex(i => (i + 1) % TIP_COUNT), 4000);
    return () => clearInterval(interval);
  }, [loading]);

  if (!open) return null;

  const percent = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  const highlighted = selected
    ? showBest && selected.bestMove
      ? { from: selected.bestMove.from, to: selected.bestMove.to }
      : { from: selected.from, to: selected.to }
    : null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t('gameReview.title')}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          <header className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-xl font-display font-bold text-foreground">{t('gameReview.title')}</h2>
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            {error && (
              <div className="py-8 text-center space-y-4">
                <p role="alert" className="text-sm text-destructive">{t('gameReview.error')}</p>
                <Button variant="outline" onClick={() => setAttempt(n => n + 1)}>{t('gameReview.retry')}</Button>
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-sm font-body text-foreground mb-3">
                  {progress
                    ? t('gameReview.progress', { current: progress.done, total: progress.total })
                    : t('gameReview.preparing')}
                </p>
                <div
                  className="w-full max-w-sm h-3 rounded-full bg-secondary overflow-hidden border border-border"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
                <p className="mt-2 text-2xl font-display font-bold text-accent" translate="no">
                  {percent}%
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    className="mt-6 text-xs font-body text-muted-foreground text-center max-w-xs italic"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4 }}
                  >
                    💡 {t(`gameReview.tip${tipIndex + 1}`)}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {summary && !loading && (
              <>
                {/* Accuracy + counts */}
                <div className="mb-5 flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
                  <div>
                    <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">{t('gameReview.accuracy')}</p>
                    <p className="text-3xl font-display font-bold text-foreground">{summary.accuracy}%</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {QUALITY_ORDER.map(q => (
                      <div key={q} className="px-2">
                        <p className={`text-lg font-display font-bold ${qualityColor(q)}`}>
                          {summary.counts[q]}
                        </p>
                        <p className="text-[10px] font-body text-muted-foreground leading-tight">
                          {t(`moveQuality.${q}`)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mb-3 text-xs font-body text-muted-foreground text-center">
                  {t('gameReview.tapToView')}
                </p>

                {/* Position preview for the selected move */}
                {selected && (
                  <div className="mb-4 flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-secondary/40">
                    <p className="text-xs font-body text-muted-foreground">
                      {t('gameReview.positionBefore', { number: selected.index })}
                      {' — '}
                      <span className="font-mono" translate="no">{selected.from} → {selected.to}</span>
                    </p>
                    <ChessBoard
                      board={boards[selected.ply]}
                      selectedSquare={null}
                      validMoves={[]}
                      isInCheck={false}
                      currentTurn={selected.color}
                      playerColor={playerColor}
                      hint={highlighted}
                      onSquareClick={() => {}}
                    />
                    {selected.bestMove && selected.quality !== 'best' && (
                      <button
                        onClick={() => setShowBest(v => !v)}
                        className="mt-1 px-3 py-1.5 rounded border border-border text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showBest ? t('gameReview.viewPlayed') : t('gameReview.viewBest')}
                      </button>
                    )}
                  </div>
                )}

                {/* Move list */}
                <div className="space-y-1.5">
                  {summary.moves.map(m => (
                    <button
                      key={m.ply}
                      onClick={() => { setSelected(m); setShowBest(false); }}
                      className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                        selected?.ply === m.ply
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-card hover:bg-secondary/50'
                      }`}
                    >
                      <span className="text-xs font-mono text-muted-foreground w-8">#{m.index}</span>
                      <span className={`text-lg font-display font-bold w-8 text-center ${qualityColor(m.quality)}`}>
                        {qualityIcon(m.quality)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-sm text-foreground" translate="no">
                            {m.from} → {m.to}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground" translate="no">
                            ({m.san})
                          </span>
                        </div>
                        <p className={`text-xs font-body ${qualityColor(m.quality)}`}>
                          {t(`moveQuality.${m.quality}`)}
                          {m.centipawnLoss > 0 && m.quality !== 'best' && (
                            <span className="text-muted-foreground ml-2">
                              −{(m.centipawnLoss / 100).toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                      {m.bestMove && m.quality !== 'best' && (
                        <div className="text-right">
                          <p className="text-[10px] font-body text-muted-foreground uppercase">{t('gameReview.best')}</p>
                          <p className="font-mono text-xs text-emerald-500" translate="no">
                            {m.bestMove.from} → {m.bestMove.to}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}

                  {summary.moves.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      {t('gameReview.noMoves')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <footer className="px-5 py-3 border-t border-border">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-body font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {t('common.close')}
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameReview;
