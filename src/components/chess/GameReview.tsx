import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Move } from 'chess.js';
import { useChessAIWorker } from '@/hooks/useChessAIWorker';
import {
  qualityColor,
  qualityIcon,
  type GameReviewSummary,
  type MoveQuality,
} from '@/lib/gameReview';

interface GameReviewProps {
  open: boolean;
  onClose: () => void;
  moveHistory: Move[];
  playerColor: 'w' | 'b';
}

const QUALITY_ORDER: MoveQuality[] = ['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'];

const GameReview: React.FC<GameReviewProps> = ({ open, onClose, moveHistory, playerColor }) => {
  const { t } = useTranslation();
  const { analyzeGameAsync } = useChessAIWorker();
  const [summary, setSummary] = useState<GameReviewSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSummary(null);
    // Small defer so the UI can paint the loader before analysis starts —
    // matters most if the Worker is unavailable and analysis falls back to
    // running on the main thread.
    const timer = setTimeout(() => {
      analyzeGameAsync(moveHistory, playerColor, 2).then(s => {
        if (cancelled) return;
        setSummary(s);
        setLoading(false);
      });
    }, 50);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, moveHistory, playerColor, analyzeGameAsync]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
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
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-body text-muted-foreground">{t('gameReview.analyzing')}</p>
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

                {/* Move list */}
                <div className="space-y-1.5">
                  {summary.moves.map(m => (
                    <div
                      key={m.ply}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
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
                    </div>
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
