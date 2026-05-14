import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameEndModalProps {
  gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate';
  winner: 'w' | 'b' | null;
  playerColor: 'w' | 'b';
  onRematch: () => void;
  onMenu: () => void;
  eloChange?: number | null;
  newElo?: number | null;
  onReview?: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({ gameStatus, winner, playerColor, onRematch, onMenu, eloChange, newElo, onReview }) => {
  if (gameStatus === 'playing') return null;

  const isVictory = winner === playerColor;
  const title = gameStatus === 'checkmate'
    ? isVictory ? '🏆 Victoire !' : '💀 Défaite'
    : gameStatus === 'draw'
      ? '🤝 Partie nulle'
      : '🤝 Pat';

  const subtitle = gameStatus === 'checkmate'
    ? isVictory
      ? 'Échec et mat ! Vous avez gagné la partie.'
      : 'Échec et mat. L\'adversaire a gagné.'
    : gameStatus === 'draw'
      ? 'La partie se termine par une égalité. Aucun joueur ne peut gagner.'
      : 'Pat ! Votre adversaire n\'a plus de coups légaux mais n\'est pas en échec. C\'est une égalité.';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">{title}</h2>
          <p className="text-sm font-body text-muted-foreground mb-4 leading-relaxed">{subtitle}</p>

          {eloChange != null && newElo != null && (
            <div className="mb-5 py-3 px-4 rounded-lg bg-secondary border border-border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xs font-body text-muted-foreground">ELO</span>
                <span className={`text-sm font-display font-bold ${
                  eloChange > 0 ? 'text-chess-valid' : eloChange < 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {eloChange > 0 ? '+' : ''}{eloChange}
                </span>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{newElo}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {onReview && (
              <button
                onClick={onReview}
                className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-body font-medium text-sm hover:opacity-90 transition-opacity"
              >
                📊 Voir l'analyse de la partie
              </button>
            )}
            <button
              onClick={onRematch}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-body font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Rejouer
            </button>
            <button
              onClick={onMenu}
              className="w-full py-2.5 rounded-lg border border-border text-muted-foreground font-body text-sm hover:text-foreground transition-colors"
            >
              Menu principal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameEndModal;
