import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TechniqueBoard from '@/components/chess/TechniqueBoard';
import PuzzleBoard from '@/components/chess/PuzzleBoard';

interface Technique {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  steps: string[];
  boardSteps: { fen: string; label: string }[];
}

interface Puzzle {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  fen: string;
  solution: { from: string; to: string; promotion?: string }[];
  hint: string;
}

const techniques: Technique[] = [
  {
    id: 'scholar-mate',
    title: "Mat du Berger",
    category: "Mat rapide",
    difficulty: "Débutant",
    description: "Le mat le plus rapide possible en 4 coups. Idéal pour surprendre un adversaire inexpérimenté.",
    steps: ["1. e2 → e4 , e7 → e5", "2. f1 → c4 (vise f7)", "3. d1 → h5 (double menace)", "4. h5 → f7# Mat !"],
    boardSteps: [
      { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", label: "Position de départ" },
      { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", label: "1. e2 → e4" },
      { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", label: "1... e7 → e5" },
      { fen: "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2", label: "2. f1 → c4 (vise f7)" },
      { fen: "rnbqkbnr/pppp1ppp/8/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 1 3", label: "3. d1 → h5 (double menace)" },
      { fen: "rnbqkbnr/pppp1Qpp/8/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4", label: "4. h5 → f7# Échec et mat !" },
    ],
  },
  {
    id: 'italian-opening',
    title: "Ouverture Italienne",
    category: "Ouvertures",
    difficulty: "Débutant",
    description: "Une des ouvertures les plus classiques. Contrôle du centre et développement rapide des pièces.",
    steps: ["1. e2 → e4 , e7 → e5", "2. g1 → f3 (attaque e5)", "3. f1 → c4 (vise f7, développe le fou)", "Préparez le petit roque O-O"],
    boardSteps: [
      { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", label: "1. e2 → e4" },
      { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", label: "2. g1 → f3 (attaque e5)" },
      { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", label: "3. f1 → c4 (Italienne !)" },
      { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 4 4", label: "4. O-O — Roi en sécurité, tour active" },
    ],
  },
  {
    id: 'sicilian-defense',
    title: "Défense Sicilienne",
    category: "Ouvertures",
    difficulty: "Intermédiaire",
    description: "La réponse la plus populaire à 1.e4. Crée un jeu asymétrique et combatif.",
    steps: ["1. e2 → e4 , c7 → c5 (la Sicilienne)", "Noir cherche un contre-jeu sur l'aile dame", "Blanc développe les pièces au centre", "Partie tactiquement riche"],
    boardSteps: [
      { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", label: "1. e2 → e4" },
      { fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", label: "1... c7 → c5 (Défense Sicilienne)" },
      { fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", label: "2. g1 → f3 (développement classique)" },
      { fen: "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3", label: "2... d7 → d6 (variante Najdorf à venir)" },
    ],
  },
  {
    id: 'back-rank',
    title: "Mat du couloir",
    category: "Patterns de mat",
    difficulty: "Intermédiaire",
    description: "Exploiter un roi coincé sur la première rangée sans case de fuite.",
    steps: ["Identifier le roi sans case de fuite", "Les pions bloquent les sorties (f7, g7, h7)", "Attaquer la rangée arrière avec une tour/dame", "Mat sur la 8ème rangée"],
    boardSteps: [
      { fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1", label: "Le roi noir est piégé par f7, g7, h7" },
      { fen: "R5k1/5ppp/8/8/8/8/8/4K3 b - - 0 1", label: "a1 → a8# — Mat du couloir !" },
    ],
  },
  {
    id: 'fork',
    title: "La Fourchette",
    category: "Tactiques",
    difficulty: "Débutant",
    description: "Attaquer deux pièces en même temps avec une seule pièce.",
    steps: ["Repérer deux pièces adverses mal placées", "Déplacer un cavalier pour attaquer les deux", "L'adversaire ne peut sauver qu'une pièce", "Capturer la pièce abandonnée"],
    boardSteps: [
      { fen: "r3k3/8/8/8/8/8/8/4K3 w - - 0 1", label: "Le roi et la tour noirs sont exposés" },
      { fen: "r3k3/8/8/8/8/5N2/8/4K3 w - - 0 1", label: "Avant : cavalier prêt à bondir" },
      { fen: "r3k3/3N4/8/8/8/8/8/4K3 b - - 0 1", label: "Cavalier en d7 : fourchette roi + tour !" },
    ],
  },
  {
    id: 'pin',
    title: "Le Clouage",
    category: "Tactiques",
    difficulty: "Intermédiaire",
    description: "Immobiliser une pièce adverse car son déplacement exposerait une pièce plus importante.",
    steps: ["Aligner votre pièce longue portée avec une pièce adverse", "Derrière elle : une pièce plus importante (roi/dame)", "La pièce clouée ne peut plus bouger", "Attaquer la pièce clouée avec une autre pièce"],
    boardSteps: [
      { fen: "r2qk3/8/8/8/8/8/8/B3K3 w - - 0 1", label: "Le fou vise la diagonale a1-d8-e8" },
      { fen: "r2qk3/8/8/8/8/8/1B6/4K3 w - - 0 1", label: "Fou en b2 : la dame est clouée devant le roi !" },
    ],
  },
  {
    id: 'discovered-attack',
    title: "Attaque à la découverte",
    category: "Tactiques",
    difficulty: "Avancé",
    description: "Déplacer une pièce pour révéler une attaque d'une autre pièce cachée derrière.",
    steps: ["Identifier une ligne d'attaque bloquée par votre pièce", "Déplacer la pièce bloquante vers une menace", "L'attaque découverte crée une double menace", "L'adversaire ne peut pas tout défendre"],
    boardSteps: [
      { fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1", label: "Position typique d'une découverte" },
      { fen: "r1bqk2r/pppp1ppp/2n2n2/4N3/2B1P3/2N5/PPPP1PPP/R1BQK2R b KQkq - 0 1", label: "f3 → e5 : découvre l'attaque du fou sur f7 !" },
    ],
  },
  {
    id: 'endgame-kp',
    title: "Finale Roi + Pion",
    category: "Finales",
    difficulty: "Intermédiaire",
    description: "Maîtriser la technique pour promouvoir un pion avec l'aide du roi.",
    steps: ["Avancez votre roi devant le pion", "Concept de l'opposition : face à face", "Le roi protège l'avancée du pion", "Promotion en dame"],
    boardSteps: [
      { fen: "8/8/8/4k3/8/4K3/4P3/8 w - - 0 1", label: "Roi blanc devant le pion — clé de la finale" },
      { fen: "8/8/4K3/8/4k3/8/4P3/8 w - - 0 1", label: "e3 → e6 : le roi prend l'opposition" },
      { fen: "8/4K3/8/8/4k3/8/4P3/8 w - - 0 1", label: "Le roi avance, le pion suivra vers la promotion" },
    ],
  },
  {
    id: 'castling-strategy',
    title: "Stratégie du Roque",
    category: "Stratégie",
    difficulty: "Débutant",
    description: "Quand et comment roquer pour protéger votre roi et activer votre tour.",
    steps: ["Développez cavalier et fou d'abord", "Ne déplacez pas roi/tours inutilement", "Petit roque (O-O) : sécurité classique", "Grand roque (O-O-O) : attaque sur l'aile roi"],
    boardSteps: [
      { fen: "r1bqkbnr/pppppppp/2n5/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1", label: "Développez les pièces mineures" },
      { fen: "r1bqkbnr/pppppppp/2n5/8/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1", label: "Fou développé — prêt pour le petit roque" },
      { fen: "r1bqkbnr/pppppppp/2n5/8/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1", label: "O-O : roi en sécurité, tour activée !" },
    ],
  },
  {
    id: 'smothered-mate',
    title: "Mat étouffé",
    category: "Patterns de mat",
    difficulty: "Avancé",
    description: "Un mat élégant où le cavalier donne mat car le roi est entouré de ses propres pièces.",
    steps: ["Le roi adverse est dans un coin", "Ses propres pièces l'entourent", "Sacrifice de dame si nécessaire", "Le cavalier donne mat"],
    boardSteps: [
      { fen: "r1b1kb1r/pppp1ppp/2n2n2/4N3/8/8/PPPPQPPP/RNB1KB1R w KQkq - 0 1", label: "Le cavalier vise le coin" },
      { fen: "6rk/5Npp/8/8/8/8/8/4K3 b - - 0 1", label: "f7 : mat étouffé ! Le roi est piégé par ses pièces." },
    ],
  },
];

const puzzles: Puzzle[] = [
  {
    id: 'puzzle-1',
    title: "Mat en 1 coup",
    difficulty: "Débutant",
    description: "Trouvez le coup qui fait échec et mat.",
    fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1",
    solution: [{ from: "a1", to: "a8" }],
    hint: "La rangée arrière est faible...",
  },
  {
    id: 'puzzle-2',
    title: "Fourchette de cavalier",
    difficulty: "Débutant",
    description: "Placez votre cavalier pour attaquer roi et tour en même temps.",
    fen: "r3k3/8/8/8/8/5N2/8/4K3 w - - 0 1",
    solution: [{ from: "f3", to: "d4" }],
    hint: "Le cavalier peut atteindre une case qui menace roi et tour.",
  },
  {
    id: 'puzzle-3',
    title: "Mat du berger",
    difficulty: "Débutant",
    description: "Trouvez le coup de mat final avec la dame.",
    fen: "rnbqkbnr/pppp1ppp/8/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
    solution: [{ from: "h5", to: "f7" }],
    hint: "La case f7 n'est défendue que par le roi...",
  },
  {
    id: 'puzzle-4',
    title: "Sacrifice et mat",
    difficulty: "Intermédiaire",
    description: "Sacrifiez votre dame pour un mat imparable.",
    fen: "r1bqk2r/pppp1Qpp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 1",
    solution: [{ from: "f7", to: "f2" }],
    hint: "Regardez les cases autour du roi noir...",
  },
  {
    id: 'puzzle-5',
    title: "Mat avec la tour",
    difficulty: "Intermédiaire",
    description: "Utilisez votre tour pour donner le mat du couloir.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    solution: [{ from: "a1", to: "a8" }],
    hint: "Le roi noir est piégé par ses propres pions.",
  },
  {
    id: 'puzzle-6',
    title: "Double attaque",
    difficulty: "Avancé",
    description: "Trouvez le coup qui crée une double menace irrésistible.",
    fen: "r2qk2r/ppp2ppp/2n1bn2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    solution: [{ from: "c4", to: "b5" }],
    hint: "Le fou peut viser deux cibles en même temps.",
  },
];

const categories = [...new Set(techniques.map(t => t.category))];

const Techniques: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [activeTab, setActiveTab] = useState<'techniques' | 'puzzles'>('techniques');
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);

  const filtered = selectedCategory
    ? techniques.filter(t => t.category === selectedCategory)
    : techniques;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">
          Chess<span className="text-accent">Master</span>
          <span className="text-sm font-body text-muted-foreground ml-3">/ Apprendre</span>
        </h1>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          Menu
        </button>
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
            📖 Techniques
          </button>
          <button
            onClick={() => setActiveTab('puzzles')}
            className={`px-4 py-2 rounded-md text-sm font-body font-medium transition-colors ${
              activeTab === 'puzzles'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🧩 Puzzles
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
                Toutes
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat}
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
                    <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${
                      tech.difficulty === 'Débutant' ? 'bg-chess-valid/10 text-chess-valid' :
                      tech.difficulty === 'Intermédiaire' ? 'bg-accent/10 text-accent' :
                      'bg-destructive/10 text-destructive'
                    }`}>
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

        {activeTab === 'puzzles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {puzzles.map(puzzle => (
              <motion.div
                key={puzzle.id}
                className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-accent/50 transition-colors"
                onClick={() => setSelectedPuzzle(puzzle)}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-semibold text-foreground text-sm">{puzzle.title}</h3>
                  <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${
                    puzzle.difficulty === 'Débutant' ? 'bg-chess-valid/10 text-chess-valid' :
                    puzzle.difficulty === 'Intermédiaire' ? 'bg-accent/10 text-accent' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {puzzle.difficulty}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 font-body">{puzzle.description}</p>
              </motion.div>
            ))}
          </div>
        )}

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
                  <h4 className="text-sm font-display font-semibold text-foreground">Étapes</h4>
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
