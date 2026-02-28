import React from 'react';
import { motion } from 'framer-motion';

const GameHeader: React.FC = () => {
  return (
    <motion.header
      className="text-center py-6"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-wider text-glow-cyan">
        CYBER<span className="text-secondary text-glow-magenta">CHESS</span>
      </h1>
      <p className="text-xs font-body text-muted-foreground tracking-[0.3em] uppercase mt-1">
        Stratégie • Innovation • Domination
      </p>
    </motion.header>
  );
};

export default GameHeader;
