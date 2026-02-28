import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Move } from 'chess.js';
import { getPieceSymbol } from '@/lib/chessPieces';
import { GameMode, PlayerState } from '@/hooks/useChessGame';
import { SPECIAL_POWERS } from '@/lib/chessPieces';

interface GameSidebarProps {
  mode: GameMode;
  moveHistory: Move[];
  capturedWhite: string[];
  capturedBlack: string[];
  currentTurn: string;
  isAiThinking: boolean;
  gameStatus: string;
  winner: string | null;
  whitePlayer: PlayerState;
  blackPlayer: PlayerState;
  onReset: () => void;
  onModeChange: (mode: GameMode) => void;
}

const CapturedPieces: React.FC<{ pieces: string[]; color: 'w' | 'b' }> = ({ pieces, color }) => (
  <div className="flex flex-wrap gap-1 min-h-[28px]">
    {pieces.map((p, i) => (
      <motion.span
        key={i}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`text-lg ${color === 'w' ? 'text-foreground/60' : 'text-neon-magenta/60'}`}
      >
        {getPieceSymbol({ type: p, color })}
      </motion.span>
    ))}
  </div>
);

const EnergyBar: React.FC<{ current: number; max: number; label: string }> = ({ current, max, label }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-body text-muted-foreground">
      <span>{label}</span>
      <span>{current}/{max}</span>
    </div>
    <div className="h-2 rounded-full bg-cyber-dark overflow-hidden cyber-border">
      <motion.div
        className="h-full energy-bar rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${(current / max) * 100}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  </div>
);

const GameSidebar: React.FC<GameSidebarProps> = ({
  mode, moveHistory, capturedWhite, capturedBlack, currentTurn,
  isAiThinking, gameStatus, winner, whitePlayer, blackPlayer,
  onReset, onModeChange,
}) => {
  return (
    <div className="w-full lg:w-72 space-y-4">
      {/* Mode Selector */}
      <div className="bg-card rounded-lg p-3 cyber-border space-y-2">
        <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground">Mode</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('classic')}
            className={`flex-1 py-2 px-3 rounded text-xs font-display uppercase tracking-wider transition-all
              ${mode === 'classic' ? 'bg-primary text-primary-foreground glow-cyan' : 'bg-cyber-elevated text-muted-foreground hover:text-foreground'}`}
          >
            Classique
          </button>
          <button
            onClick={() => onModeChange('revolutionary')}
            className={`flex-1 py-2 px-3 rounded text-xs font-display uppercase tracking-wider transition-all
              ${mode === 'revolutionary' ? 'bg-secondary text-secondary-foreground glow-magenta' : 'bg-cyber-elevated text-muted-foreground hover:text-foreground'}`}
          >
            Révolution
          </button>
        </div>
      </div>

      {/* Game Status */}
      <div className="bg-card rounded-lg p-3 cyber-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${currentTurn === 'w' ? 'bg-foreground' : 'bg-neon-magenta'} ${gameStatus === 'playing' ? 'animate-pulse-glow' : ''}`} />
            <span className="text-sm font-body">
              {gameStatus === 'playing'
                ? isAiThinking
                  ? 'IA réfléchit...'
                  : currentTurn === 'w' ? 'Votre tour' : 'Tour adversaire'
                : gameStatus === 'checkmate'
                  ? `Échec et mat ! ${winner === 'w' ? 'Vous gagnez' : "L'IA gagne"}`
                  : gameStatus === 'draw' ? 'Partie nulle' : 'Pat'
              }
            </span>
          </div>
          <button
            onClick={onReset}
            className="text-xs px-3 py-1 rounded bg-cyber-elevated text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            Rejouer
          </button>
        </div>
      </div>

      {/* Revolutionary Mode - Energy & Powers */}
      <AnimatePresence>
        {mode === 'revolutionary' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-card rounded-lg p-3 cyber-border space-y-3 overflow-hidden"
          >
            <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground">Énergie</h3>
            <EnergyBar current={whitePlayer.energy} max={whitePlayer.maxEnergy} label="Vous" />
            <EnergyBar current={blackPlayer.energy} max={blackPlayer.maxEnergy} label="IA" />
            
            <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground mt-3">Pouvoirs</h3>
            <div className="grid grid-cols-2 gap-2">
              {SPECIAL_POWERS.map(power => (
                <button
                  key={power.id}
                  className="flex flex-col items-center gap-1 p-2 rounded bg-cyber-elevated hover:bg-cyber-dark transition-colors cyber-border group"
                  title={power.description}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{power.icon}</span>
                  <span className="text-[10px] font-body text-muted-foreground">{power.name}</span>
                  <span className="text-[10px] font-body text-primary">×{whitePlayer.powers[power.id]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captured Pieces */}
      <div className="bg-card rounded-lg p-3 cyber-border space-y-2">
        <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground">Pièces capturées</h3>
        <div className="space-y-1">
          <CapturedPieces pieces={capturedBlack} color="b" />
          <CapturedPieces pieces={capturedWhite} color="w" />
        </div>
      </div>

      {/* Move History */}
      <div className="bg-card rounded-lg p-3 cyber-border">
        <h3 className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-2">Historique</h3>
        <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
          {moveHistory.length === 0 && (
            <p className="text-xs text-muted-foreground font-body">Aucun coup joué</p>
          )}
          {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
            <div key={i} className="flex gap-2 text-xs font-body">
              <span className="text-muted-foreground w-6 text-right">{i + 1}.</span>
              <span className="text-foreground w-16">{moveHistory[i * 2]?.san}</span>
              <span className="text-neon-magenta w-16">{moveHistory[i * 2 + 1]?.san || ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameSidebar;
