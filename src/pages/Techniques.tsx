import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TechniqueBoard from '@/components/chess/TechniqueBoard';
import PuzzleBoard from '@/components/chess/PuzzleBoard';
import SensationsToggle from '@/components/SensationsToggle';

type CategoryId = 'quickMate' | 'openings' | 'matPatterns' | 'tactics' | 'endgames' | 'strategy';
type DifficultyId = 'beginner' | 'intermediate' | 'advanced';

interface Technique {
  id: string;
  title: string;
  categoryId: CategoryId;
  category: string;
  difficultyId: DifficultyId;
  difficulty: string;
  description: string;
  steps: string[];
  boardSteps: { fen: string; label: string }[];
}

interface Puzzle {
  id: string;
  title: string;
  difficultyId: DifficultyId;
  difficulty: string;
  description: string;
  fen: string;
  solution: { from: string; to: string; promotion?: string }[];
  hint: string;
}

// Language-neutral data: stable ids (used for filtering/styling and as i18n
// keys), FEN strings, and move solutions. Display text (title, description,
// steps, category/difficulty labels) is hydrated from i18n inside the
// component, below, so it stays reactive to a language switch.
const TECHNIQUES_RAW: { id: string; categoryId: CategoryId; difficultyId: DifficultyId; boardFens: string[] }[] = [
  {
    id: 'scholar-mate',
    categoryId: 'quickMate',
    difficultyId: 'beginner',
    boardFens: [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2',
      'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
      'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
      'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
      'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
    ],
  },
  {
    id: 'italian-opening',
    categoryId: 'openings',
    difficultyId: 'beginner',
    boardFens: [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
      'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
    ],
  },
  {
    id: 'sicilian-defense',
    categoryId: 'openings',
    difficultyId: 'intermediate',
    boardFens: [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
      'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
      'rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3',
      'rnbqkbnr/pp2pppp/3p4/8/3pP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 4',
      'rnbqkbnr/pp2pppp/3p4/8/3NP3/8/PPP2PPP/RNBQKB1R b KQkq - 0 4',
      'rnbqkb1r/pp2pppp/3p1n2/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 1 5',
    ],
  },
  {
    id: 'back-rank',
    categoryId: 'matPatterns',
    difficultyId: 'intermediate',
    boardFens: [
      '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
      'R5k1/5ppp/8/8/8/8/8/4K3 b - - 1 1',
    ],
  },
  {
    id: 'fork',
    categoryId: 'tactics',
    difficultyId: 'beginner',
    boardFens: [
      'r3k3/8/8/8/8/5N2/8/4K3 w - - 0 1',
      'r3k3/8/8/8/3N4/8/8/4K3 b - - 1 1',
    ],
  },
  {
    id: 'pin',
    categoryId: 'tactics',
    difficultyId: 'intermediate',
    boardFens: [
      '4k3/8/8/3q4/8/1B6/8/4K3 w - - 0 1',
      '4k3/8/8/3B4/8/8/8/4K3 b - - 0 1',
    ],
  },
  {
    id: 'discovered-attack',
    categoryId: 'tactics',
    difficultyId: 'advanced',
    boardFens: [
      'r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
      'r1bqk2r/pppp1ppp/2n2n2/4N3/2B1P3/2N5/PPPP1PPP/R1BQK2R b KQkq - 0 1',
    ],
  },
  {
    id: 'endgame-kp',
    categoryId: 'endgames',
    difficultyId: 'intermediate',
    boardFens: [
      '8/8/8/4k3/8/4K3/4P3/8 w - - 0 1',
      '8/8/4K3/4k3/8/8/4P3/8 b - - 1 1',
      '8/4K3/8/4k3/8/8/4P3/8 w - - 3 2',
    ],
  },
  {
    id: 'castling-strategy',
    categoryId: 'strategy',
    difficultyId: 'beginner',
    boardFens: [
      'r1bqkbnr/pppppppp/2n5/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 2',
      'r1bqkbnr/pppppppp/2n5/8/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 3',
      'r1bqkbnr/pppppppp/2n5/8/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 3',
    ],
  },
  {
    id: 'smothered-mate',
    categoryId: 'matPatterns',
    difficultyId: 'advanced',
    boardFens: [
      '5rk1/5Npp/8/8/8/8/8/4K3 b - - 0 1',
    ],
  },
];

const PUZZLES_RAW: { id: string; difficultyId: DifficultyId; fen: string; solution: { from: string; to: string; promotion?: string }[] }[] = [
  { id: 'puzzle-1', difficultyId: 'beginner', fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', solution: [{ from: 'a1', to: 'a8' }] },
  { id: 'puzzle-2', difficultyId: 'beginner', fen: 'r3k3/8/8/8/8/5N2/8/4K3 w - - 0 1', solution: [{ from: 'f3', to: 'd4' }] },
  { id: 'puzzle-3', difficultyId: 'beginner', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', solution: [{ from: 'h5', to: 'f7' }] },
  { id: 'puzzle-4', difficultyId: 'beginner', fen: '6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1', solution: [{ from: 'e1', to: 'e8' }] },
  { id: 'puzzle-5', difficultyId: 'beginner', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', solution: [{ from: 'a1', to: 'a8' }] },
  { id: 'puzzle-6', difficultyId: 'intermediate', fen: '6rk/6pp/8/6N1/8/8/8/4K2R w K - 0 1', solution: [{ from: 'g5', to: 'f7' }] },
  { id: 'puzzle-7', difficultyId: 'intermediate', fen: '4k3/8/8/8/4q3/8/8/4R1K1 w - - 0 1', solution: [{ from: 'e1', to: 'e4' }] },
  { id: 'puzzle-8', difficultyId: 'intermediate', fen: '4k3/8/8/3q4/8/1B6/8/4K3 w - - 0 1', solution: [{ from: 'b3', to: 'd5' }] },
  { id: 'puzzle-9', difficultyId: 'intermediate', fen: '8/P7/8/8/8/8/8/k6K w - - 0 1', solution: [{ from: 'a7', to: 'a8', promotion: 'q' }] },
  { id: 'puzzle-10', difficultyId: 'advanced', fen: 'r3k3/8/8/8/8/8/3Q4/4K3 w - - 0 1', solution: [{ from: 'd2', to: 'a5' }] },
  { id: 'puzzle-11', difficultyId: 'advanced', fen: 'r1bqk2r/pppp1Qpp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 1', solution: [{ from: 'f7', to: 'f2' }] },
  { id: 'puzzle-12', difficultyId: 'advanced', fen: 'r2qk2r/ppp2ppp/2n1bn2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1', solution: [{ from: 'c4', to: 'b5' }] },
];

const DIFFICULTY_BADGE_CLASS: Record<DifficultyId, string> = {
  beginner: 'bg-chess-valid/10 text-chess-valid',
  intermediate: 'bg-accent/10 text-accent',
  advanced: 'bg-destructive/10 text-destructive',
};

const Techniques: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [activeTab, setActiveTab] = useState<'techniques' | 'puzzles'>('techniques');
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);

  const techniques: Technique[] = TECHNIQUES_RAW.map(raw => {
    const labels = t(`techniques.${raw.id}.boardStepLabels`, { returnObjects: true }) as string[];
    return {
      id: raw.id,
      categoryId: raw.categoryId,
      category: t(`techniquesPage.category.${raw.categoryId}`),
      difficultyId: raw.difficultyId,
      difficulty: t(`techniquesPage.difficulty.${raw.difficultyId}`),
      title: t(`techniques.${raw.id}.title`),
      description: t(`techniques.${raw.id}.description`),
      steps: t(`techniques.${raw.id}.steps`, { returnObjects: true }) as string[],
      boardSteps: raw.boardFens.map((fen, i) => ({ fen, label: labels[i] })),
    };
  });

  const puzzles: Puzzle[] = PUZZLES_RAW.map(raw => ({
    id: raw.id,
    difficultyId: raw.difficultyId,
    difficulty: t(`techniquesPage.difficulty.${raw.difficultyId}`),
    fen: raw.fen,
    solution: raw.solution,
    title: t(`puzzles.${raw.id}.title`),
    description: t(`puzzles.${raw.id}.description`),
    hint: t(`puzzles.${raw.id}.hint`),
  }));

  const categories: CategoryId[] = [...new Set(techniques.map(tech => tech.categoryId))];

  const filtered = selectedCategory
    ? techniques.filter(tech => tech.categoryId === selectedCategory)
    : techniques;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">
          Chess<span className="text-accent">Master</span>
          <span className="text-sm font-body text-muted-foreground ml-3">/ {t('nav.techniques')}</span>
        </h1>
        <div className="flex items-center gap-2">
          <SensationsToggle className="border border-border rounded" />
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            {t('common.menu')}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('techniques')}
            className={`px-4 py-2 rounded-md text-sm font-body font-medium transition-colors ${
              activeTab === 'techniques'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📖 {t('techniquesPage.tabTechniques')}
          </button>
          <button
            onClick={() => setActiveTab('puzzles')}
            className={`px-4 py-2 rounded-md text-sm font-body font-medium transition-colors ${
              activeTab === 'puzzles'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🧩 {t('techniquesPage.tabPuzzles')}
          </button>
        </div>

        {activeTab === 'techniques' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {t('techniquesPage.all')}
              </button>
              {categories.map(catId => (
                <button
                  key={catId}
                  onClick={() => setSelectedCategory(catId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${
                    selectedCategory === catId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {t(`techniquesPage.category.${catId}`)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(tech => (
                <motion.div
                  key={tech.id}
                  className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-accent/50 transition-colors"
                  onClick={() => setSelectedTechnique(tech)}
                  whileHover={{ y: -2 }}
                  layout
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-semibold text-foreground">{tech.title}</h3>
                    <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${DIFFICULTY_BADGE_CLASS[tech.difficultyId]}`}>
                      {tech.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mb-2">{tech.category}</p>
                  <p className="text-sm text-foreground/80 font-body leading-relaxed">{tech.description}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'puzzles' && (() => {
          // Daily puzzle: deterministic by date (YYYY-MM-DD)
          const today = new Date();
          const dayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
          const dailyPuzzle = puzzles[dayKey % puzzles.length];
          const others = puzzles.filter(p => p.id !== dailyPuzzle.id);
          return (
            <>
              {/* Daily puzzle highlight */}
              <motion.div
                onClick={() => setSelectedPuzzle(dailyPuzzle)}
                whileHover={{ y: -2 }}
                className="mb-6 bg-gradient-to-br from-accent/15 via-card to-card border-2 border-accent/40 rounded-xl p-5 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="text-[10px] font-body uppercase tracking-widest text-accent">
                        {t('techniquesPage.dailyPuzzle')} · {today.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                      <h3 className="font-display font-bold text-foreground text-lg">{dailyPuzzle.title}</h3>
                    </div>
                  </div>
                  <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${DIFFICULTY_BADGE_CLASS[dailyPuzzle.difficultyId]}`}>
                    {dailyPuzzle.difficulty}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 font-body">{dailyPuzzle.description}</p>
                <p className="text-xs text-accent font-body mt-2">{t('techniquesPage.dailyPuzzleCta')}</p>
              </motion.div>

              <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {t('techniquesPage.allPuzzlesHeading')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map(puzzle => (
                  <motion.div
                    key={puzzle.id}
                    className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-accent/50 transition-colors"
                    onClick={() => setSelectedPuzzle(puzzle)}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display font-semibold text-foreground text-sm">{puzzle.title}</h3>
                      <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${DIFFICULTY_BADGE_CLASS[puzzle.difficultyId]}`}>
                        {puzzle.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 font-body">{puzzle.description}</p>
                  </motion.div>
                ))}
              </div>
            </>
          );
        })()}

        {/* Technique modal */}
        <AnimatePresence>
          {selectedTechnique && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTechnique(null)}
            >
              <motion.div
                className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground">
                      {selectedTechnique.title}
                    </h2>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {selectedTechnique.category} • {selectedTechnique.difficulty}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTechnique(null)}
                    className="text-muted-foreground hover:text-foreground text-lg"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-sm font-body text-foreground/80 mb-5 leading-relaxed">
                  {selectedTechnique.description}
                </p>

                <div className="mb-5 flex justify-center">
                  <TechniqueBoard steps={selectedTechnique.boardSteps} />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-display font-semibold text-foreground">{t('techniquesPage.stepsHeading')}</h4>
                  <div className="space-y-2">
                    {selectedTechnique.steps.map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="text-xs font-body bg-accent/10 text-accent w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm font-body text-foreground/80">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Puzzle modal */}
        <AnimatePresence>
          {selectedPuzzle && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPuzzle(null)}
            >
              <motion.div
                className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground">
                      🧩 {selectedPuzzle.title}
                    </h2>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {selectedPuzzle.difficulty} • {selectedPuzzle.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPuzzle(null)}
                    className="text-muted-foreground hover:text-foreground text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex justify-center mb-4">
                  <PuzzleBoard
                    fen={selectedPuzzle.fen}
                    solution={selectedPuzzle.solution}
                    hint={selectedPuzzle.hint}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Techniques;
