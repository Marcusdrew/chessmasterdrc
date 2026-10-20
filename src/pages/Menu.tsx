import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SensationsToggle from '@/components/SensationsToggle';
import ThemeSettings from '@/components/ThemeSettings';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <SensationsToggle className="absolute top-4 left-4" />
      <LanguageSwitcher className="absolute top-4 right-4" />

      <motion.div
        className="text-center mb-16"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground">
          Chess<span className="text-accent">Master</span>
        </h1>
        <p className="text-sm font-body text-muted-foreground tracking-widest uppercase mt-3">
          {t('menu.tagline')}
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <motion.button
          onClick={() => navigate('/play')}
          className="w-full py-4 px-8 rounded-lg bg-primary text-primary-foreground font-display text-lg font-semibold tracking-wide hover:opacity-90 transition-opacity"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ♟ {t('menu.play')}
        </motion.button>

        <motion.button
          onClick={() => navigate('/techniques')}
          className="w-full py-4 px-8 rounded-lg bg-secondary text-secondary-foreground font-display text-lg font-semibold tracking-wide hover:opacity-90 transition-opacity border border-border"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          📖 {t('menu.techniques')}
        </motion.button>

        <motion.button
          onClick={() => navigate('/apprendre')}
          className="w-full py-4 px-8 rounded-lg bg-secondary text-secondary-foreground font-display text-lg font-semibold tracking-wide hover:opacity-90 transition-opacity border border-border"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🎓 {t('menu.learn')}
        </motion.button>

        <motion.button
          onClick={() => setThemeOpen(true)}
          className="w-full py-4 px-8 rounded-lg bg-secondary text-secondary-foreground font-display text-lg font-semibold tracking-wide hover:opacity-90 transition-opacity border border-border"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🎨 {t('menu.theme')}
        </motion.button>
      </div>

      <ThemeSettings open={themeOpen} onClose={() => setThemeOpen(false)} />

      <motion.p
        className="mt-12 text-xs text-muted-foreground font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {t('menu.poweredBy')}
      </motion.p>
    </div>
  );
};

export default Menu;
