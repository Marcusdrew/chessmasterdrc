import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface PieceInfo {
  id: string;
  symbol: string;
  name: string;
  value: number;
  movement: string;
  utility: string;
  tips: string[];
}

const PIECE_IDS = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'] as const;
const PIECE_SYMBOLS: Record<string, string> = {
  pawn: '♙', knight: '♘', bishop: '♗', rook: '♖', queen: '♕', king: '♔',
};
const PIECE_VALUES: Record<string, number> = {
  pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: Infinity,
};

interface ConceptInfo {
  id: string;
  title: string;
  emoji: string;
  body: string;
}

const CONCEPT_IDS = [
  'checkCheckmateStalemate', 'castling', 'enPassant', 'promotion', 'gamePhases', 'pieceValues',
] as const;
const CONCEPT_EMOJIS: Record<string, string> = {
  checkCheckmateStalemate: '⚔️', castling: '🏰', enPassant: '↘️', promotion: '👑', gamePhases: '📚', pieceValues: '⚖️',
};

const Apprendre: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedPiece, setSelectedPiece] = useState<PieceInfo | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<ConceptInfo | null>(null);
  const [showElo, setShowElo] = useState(false);

  const pieces: PieceInfo[] = PIECE_IDS.map(id => ({
    id,
    symbol: PIECE_SYMBOLS[id],
    value: PIECE_VALUES[id],
    name: t(`pieces.${id}.name`),
    movement: t(`pieces.${id}.movement`),
    utility: t(`pieces.${id}.utility`),
    tips: t(`pieces.${id}.tips`, { returnObjects: true }) as string[],
  }));

  const concepts: ConceptInfo[] = CONCEPT_IDS.map(id => ({
    id,
    emoji: CONCEPT_EMOJIS[id],
    title: t(`concepts.${id}.title`),
    body: t(`concepts.${id}.body`),
  }));

  const eloExplained = {
    title: t('eloExplained.title'),
    emoji: '📈',
    body: t('eloExplained.body', {
      amateurLabel: t('playConfig.difficulties.amateur'),
      debutantLabel: t('playConfig.difficulties.debutant'),
      intermediaireLabel: t('playConfig.difficulties.intermediaire'),
      avanceLabel: t('playConfig.difficulties.avance'),
      expertLabel: t('playConfig.difficulties.expert'),
    }),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">
          Chess<span className="text-accent">Master</span>
          <span className="text-sm font-body text-muted-foreground ml-3">/ {t('nav.learn')}</span>
        </h1>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          {t('common.menu')}
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Pieces */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">{t('learnPage.piecesTitle')}</h2>
          <p className="text-sm font-body text-muted-foreground mb-5">
            {t('learnPage.piecesSubtitle')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pieces.map(p => (
              <motion.div
                key={p.id}
                onClick={() => setSelectedPiece(p)}
                whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-accent/50 transition-colors flex flex-col items-center text-center"
              >
                <div className="text-5xl mb-2 text-foreground">{p.symbol}</div>
                <h3 className="font-display font-semibold text-foreground">{p.name}</h3>
                <p className="text-xs font-body text-muted-foreground mt-1">
                  {t('learnPage.value')} {p.value === Infinity ? '∞' : p.value}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Concepts */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">{t('learnPage.conceptsTitle')}</h2>
          <p className="text-sm font-body text-muted-foreground mb-5">
            {t('learnPage.conceptsSubtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concepts.map(c => (
              <motion.div
                key={c.id}
                onClick={() => setSelectedConcept(c)}
                whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{c.emoji}</span>
                  <h3 className="font-display font-semibold text-foreground">{c.title}</h3>
                </div>
                <p className="text-xs font-body text-foreground/70 line-clamp-2">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ELO */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">{t('learnPage.eloTitle')}</h2>
          <p className="text-sm font-body text-muted-foreground mb-5">
            {t('learnPage.eloSubtitle')}
          </p>
          <motion.div
            onClick={() => setShowElo(true)}
            whileHover={{ y: -2 }}
            className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{eloExplained.emoji}</span>
              <h3 className="font-display font-semibold text-foreground">{eloExplained.title}</h3>
            </div>
            <p className="text-xs font-body text-foreground/70">
              {t('learnPage.eloTeaser')}
            </p>
          </motion.div>
        </section>

        {/* Piece modal */}
        <AnimatePresence>
          {selectedPiece && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPiece(null)}
            >
              <motion.div
                className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{selectedPiece.symbol}</span>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-foreground">{selectedPiece.name}</h2>
                      <p className="text-xs font-body text-muted-foreground">
                        {t('learnPage.value')} {selectedPiece.value === Infinity
                          ? `∞ (${t('learnPage.priceless')})`
                          : `${selectedPiece.value} ${t('learnPage.pointsUnit')}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPiece(null)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-display font-semibold text-accent uppercase tracking-wider mb-1">{t('learnPage.movementLabel')}</h4>
                    <p className="text-sm font-body text-foreground/80">{selectedPiece.movement}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-display font-semibold text-accent uppercase tracking-wider mb-1">{t('learnPage.utilityLabel')}</h4>
                    <p className="text-sm font-body text-foreground/80">{selectedPiece.utility}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-display font-semibold text-accent uppercase tracking-wider mb-2">{t('learnPage.tipsLabel')}</h4>
                    <ul className="space-y-2">
                      {selectedPiece.tips.map((tip, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-accent text-xs mt-1">▸</span>
                          <span className="text-sm font-body text-foreground/80">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concept modal */}
        <AnimatePresence>
          {selectedConcept && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedConcept(null)}
            >
              <motion.div
                className="bg-card border border-border rounded-xl p-6 max-w-lg w-full"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedConcept.emoji}</span>
                    <h2 className="text-xl font-display font-bold text-foreground">{selectedConcept.title}</h2>
                  </div>
                  <button onClick={() => setSelectedConcept(null)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
                </div>
                <p className="text-sm font-body text-foreground/80 leading-relaxed whitespace-pre-line">{selectedConcept.body}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ELO modal */}
        <AnimatePresence>
          {showElo && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowElo(false)}
            >
              <motion.div
                className="bg-card border border-border rounded-xl p-6 max-w-lg w-full"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{eloExplained.emoji}</span>
                    <h2 className="text-xl font-display font-bold text-foreground">{eloExplained.title}</h2>
                  </div>
                  <button onClick={() => setShowElo(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
                </div>
                <p className="text-sm font-body text-foreground/80 leading-relaxed whitespace-pre-line">{eloExplained.body}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Apprendre;
