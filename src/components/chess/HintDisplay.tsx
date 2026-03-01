import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HintDisplayProps {
  hint: { from: string; to: string } | null;
  onDismiss: () => void;
}

const HintDisplay: React.FC<HintDisplayProps> = ({ hint, onDismiss }) => {
  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-accent text-accent-foreground px-5 py-3 rounded-lg shadow-lg font-body text-sm flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <span className="text-lg">💡</span>
          <span>
            Meilleur coup : <strong>{hint.from} → {hint.to}</strong>
          </span>
          <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HintDisplay;
