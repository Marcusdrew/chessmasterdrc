import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BOARD_THEMES,
  PIECE_THEMES,
  BOARD_THEME_PREVIEW,
  PIECE_THEME_PREVIEW,
} from '@/lib/chessThemes';
import { useChessTheme } from '@/hooks/useChessTheme';

interface ThemeSettingsProps {
  open: boolean;
  onClose: () => void;
}

/** Panneau de choix du thème d'échiquier et des couleurs de pièces. */
const ThemeSettings: React.FC<ThemeSettingsProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { boardTheme, pieceTheme, setBoardTheme, setPieceTheme } = useChessTheme();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-xl bg-card text-card-foreground border border-border p-5 shadow-xl"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">{t('theme.title')}</h2>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="text-muted-foreground hover:text-foreground text-lg leading-none px-2"
              >
                ✕
              </button>
            </div>

            {/* Thème d'échiquier */}
            <p className="text-sm font-medium text-muted-foreground mb-2">{t('theme.board')}</p>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {BOARD_THEMES.map((theme) => {
                const preview = BOARD_THEME_PREVIEW[theme];
                const active = boardTheme === theme;
                return (
                  <button
                    key={theme}
                    onClick={() => setBoardTheme(theme)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-lg p-1.5 border transition-colors ${
                      active ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="grid grid-cols-2 w-10 h-10 rounded overflow-hidden border border-border">
                      <span style={{ background: preview.light }} />
                      <span style={{ background: preview.dark }} />
                      <span style={{ background: preview.dark }} />
                      <span style={{ background: preview.light }} />
                    </span>
                    <span className="text-[10px] leading-tight text-center">
                      {t(`theme.boards.${theme}`)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Couleurs des pièces */}
            <p className="text-sm font-medium text-muted-foreground mb-2">{t('theme.pieces')}</p>
            <div className="grid grid-cols-4 gap-2">
              {PIECE_THEMES.map((theme) => {
                const preview = PIECE_THEME_PREVIEW[theme];
                const active = pieceTheme === theme;
                return (
                  <button
                    key={theme}
                    onClick={() => setPieceTheme(theme)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-lg p-1.5 border transition-colors ${
                      active ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="text-2xl leading-none flex">
                      <span style={{ color: preview.w, WebkitTextStroke: `1px ${preview.stroke}` }}>♞</span>
                      <span style={{ color: preview.b }}>♞</span>
                    </span>
                    <span className="text-[10px] leading-tight text-center">
                      {t(`theme.pieceSets.${theme}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeSettings;
