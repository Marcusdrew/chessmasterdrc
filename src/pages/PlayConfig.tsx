import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

type PlayerColor = 'w' | 'b';
type Difficulty = 'amateur' | 'debutant' | 'intermediaire' | 'avance' | 'expert';
type TimeControl = 'unlimited' | '5' | '15' | '30';

const difficulties: { id: Difficulty; label: string }[] = [
  { id: 'amateur', label: 'Amateur' },
  { id: 'debutant', label: 'Débutant' },
  { id: 'intermediaire', label: 'Intermédiaire' },
  { id: 'avance', label: 'Avancé' },
  { id: 'expert', label: 'Expert' },
];

const timeControls: { id: TimeControl; label: string }[] = [
  { id: 'unlimited', label: 'Illimité' },
  { id: '5', label: "5'" },
  { id: '15', label: "15'" },
  { id: '30', label: "30'" },
];

const PlayConfig: React.FC = () => {
  const navigate = useNavigate();
  const [color, setColor] = useState<PlayerColor>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediaire');
  const [time, setTime] = useState<TimeControl>('unlimited');

  const handlePlay = () => {
    navigate(`/game?color=${color}&difficulty=${difficulty}&time=${time}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-display font-bold text-center text-foreground">
          Configuration
        </h2>

        {/* Color choice */}
        <div className="space-y-3">
          <h3 className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
            Choisissez votre couleur
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setColor('w')}
              className={`flex-1 py-4 rounded-lg border-2 transition-all font-display text-lg flex items-center justify-center gap-2 ${
                color === 'w'
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <span className="text-3xl">♔</span>
              Blancs
            </button>
            <button
              onClick={() => setColor('b')}
              className={`flex-1 py-4 rounded-lg border-2 transition-all font-display text-lg flex items-center justify-center gap-2 ${
                color === 'b'
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <span className="text-3xl">♚</span>
              Noirs
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <h3 className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
            Difficulté
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {difficulties.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-body transition-all ${
                  difficulty === d.id
                    ? 'border-accent bg-accent/10 text-foreground font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="space-y-3">
          <h3 className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
            Temps
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {timeControls.map(t => (
              <button
                key={t.id}
                onClick={() => setTime(t.id)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-body transition-all ${
                  time === t.id
                    ? 'border-accent bg-accent/10 text-foreground font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <motion.button
            onClick={handlePlay}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-display text-lg font-semibold tracking-wide hover:opacity-90 transition-opacity"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Jouer
          </motion.button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg border border-border text-muted-foreground font-body text-sm hover:text-foreground transition-colors"
          >
            Retour au menu
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayConfig;
