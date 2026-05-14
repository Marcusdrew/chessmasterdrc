import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Menu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
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
          Stratégie • Intelligence • Maîtrise
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
          ♟ Jouer
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
          📖 Techniques
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
          🎓 Apprendre
        </motion.button>
      </div>

      <motion.p
        className="mt-12 text-xs text-muted-foreground font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Propulsé par l'Intelligence Artificielle
      </motion.p>
    </div>
  );
};

export default Menu;
