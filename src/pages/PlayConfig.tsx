import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type PlayerColor = 'w' | 'b';
type Difficulty = 'amateur' | 'debutant' | 'intermediaire' | 'avance' | 'expert';
type TimeControl = 'unlimited' | '5' | '15' | '30';
type GameMode = 'classic' | 'revolutionary';

const difficulties: { id: Difficulty }[] = [
  { id: 'amateur' },
  { id: 'debutant' },
  { id: 'intermediaire' },
  { id: 'avance' },
  { id: 'expert' },
];

const timeControls: { id: TimeControl; label: string | null }[] = [
  { id: 'unlimited', label: null },
  { id: '5', label: "5'" },
  { id: '15', label: "15'" },
  { id: '30', label: "30'" },
];

const PlayConfig: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [color, setColor] = useState<PlayerColor>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediaire');
  const [time, setTime] = useState<TimeControl>('unlimited');
  const [mode, setMode] = useState<GameMode>('classic');

  const handlePlay = () => {
    const path = mode === 'revolutionary' ? '/revolutionary-game' : '/game';
    navigate(`${path}?color=${color}&difficulty=${difficulty}&time=${time}`);
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
          {t('playConfig.title')}
        </h2>

        {/* Mode */}
        <div className="space-y-3">
          <h3 className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
            {t('playConfig.mode')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('classic')}
              className={`py-4 rounded-lg border-2 transition-all font-display text-base flex flex-col items-center justify-center gap-1 ${
                mode === 'classic'
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <span className="text-2xl">♟️</span>
              {t('playConfig.modeClassic')}
            </button>
            <button
              onClick={() => setMode('revolutionary')}
              className={`py-4 rounded-lg border-2 transition-all font-display text-base flex flex-col items-center justify-center gap-1 ${
                mode === 'revolutionary'
                  ? 'border-rev-power bg-rev-power/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <span className="text-2xl">⚡</span>
              {t('playConfig.modeRevolutionary')}
            </button>
          </div>
          {mode === 'revolutionary' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs font-body text-muted-foreground leading-relaxed"
            >
              {t('playConfig.modeRevolutionaryHint')}
            </motion.p>
          )}
        </div>

        {/* Color choice */}
        <div className="space-y-3">
          <h3 className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
            {t('playConfig.chooseColor')}
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
              {t('playConfig.white')}
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
              {t('playConfig.black')}
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <h3 className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
            {t('playConfig.difficulty')}
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
                {t(`playConfig.difficulties.${d.id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="space-y-3">
          <h3 className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
            {t('playConfig.time')}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {timeControls.map(tc => (
              <button
                key={tc.id}
                onClick={() => setTime(tc.id)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-body transition-all ${
                  time === tc.id
                    ? 'border-accent bg-accent/10 text-foreground font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {tc.label ?? t('playConfig.unlimited')}
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
            {t('playConfig.playButton')}
          </motion.button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg border border-border text-muted-foreground font-body text-sm hover:text-foreground transition-colors"
          >
            {t('playConfig.backToMenu')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayConfig;
