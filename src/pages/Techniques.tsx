import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Technique {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  steps: string[];
  positions: string; // FEN or description
}

const techniques: Technique[] = [
  {
    id: 'scholar-mate',
    title: "Mat du Berger",
    category: "Mat rapide",
    difficulty: "Débutant",
    description: "Le mat le plus rapide possible en 4 coups. Idéal pour surprendre un adversaire inexpérimenté.",
    steps: ["1. e4 e5", "2. Fc4 (vise f7)", "3. Dh5 (double menace)", "4. Dxf7# Mat !"],
    positions: "Cible : la case f7, le point le plus faible en début de partie.",
  },
  {
    id: 'back-rank',
    title: "Mat du couloir",
    category: "Patterns de mat",
    difficulty: "Intermédiaire",
    description: "Exploiter un roi coincé sur la première rangée sans case de fuite. La tour ou la dame donne mat.",
    steps: ["Identifier le roi sans case de fuite", "Les pions bloquent les sorties", "Attaquer la rangée arrière avec une tour/dame", "Mat sur la 1ère (ou 8ème) rangée"],
    positions: "Le roi est piégé par ses propres pions (g7, f7, h7).",
  },
  {
    id: 'fork',
    title: "La Fourchette",
    category: "Tactiques",
    difficulty: "Débutant",
    description: "Attaquer deux pièces en même temps avec une seule pièce, forçant l'adversaire à en perdre une.",
    steps: ["Repérer deux pièces adverses mal placées", "Déplacer un cavalier/pion pour attaquer les deux", "L'adversaire ne peut sauver qu'une pièce", "Capturer la pièce abandonnée"],
    positions: "Le cavalier est le roi de la fourchette grâce à son mouvement en L.",
  },
  {
    id: 'pin',
    title: "Le Clouage",
    category: "Tactiques",
    difficulty: "Intermédiaire",
    description: "Immobiliser une pièce adverse car son déplacement exposerait une pièce plus importante derrière elle.",
    steps: ["Aligner votre pièce avec une pièce adverse et une pièce plus importante derrière", "La pièce clouée ne peut plus bouger (ou ne devrait pas)", "Attaquer la pièce clouée avec une autre pièce", "Gagner du matériel"],
    positions: "Le fou et la tour sont les meilleures pièces pour clouer.",
  },
  {
    id: 'discovered-attack',
    title: "Attaque à la découverte",
    category: "Tactiques",
    difficulty: "Avancé",
    description: "Déplacer une pièce pour révéler une attaque d'une autre pièce derrière elle.",
    steps: ["Identifier une ligne d'attaque bloquée par votre propre pièce", "Déplacer la pièce bloquante vers une case menaçante", "L'attaque découverte et l'attaque directe créent une double menace", "L'adversaire ne peut pas tout défendre"],
    positions: "Particulièrement dévastateur quand l'attaque découverte est un échec.",
  },
  {
    id: 'endgame-kp',
    title: "Finale Roi + Pion",
    category: "Finales",
    difficulty: "Intermédiaire",
    description: "Maîtriser la technique de base pour promouvoir un pion avec l'aide du roi.",
    steps: ["Avancez votre roi devant le pion", "Concept de l'opposition : face à face avec le roi adverse", "Le roi protège l'avancée du pion", "Promotion en dame"],
    positions: "La clé : le roi DEVANT le pion, pas derrière.",
  },
  {
    id: 'castling-strategy',
    title: "Stratégie du Roque",
    category: "Stratégie",
    difficulty: "Débutant",
    description: "Quand et comment roquer efficacement pour protéger votre roi et activer votre tour.",
    steps: ["Développez vos pièces mineures d'abord", "Ne déplacez pas votre roi ni vos tours inutilement", "Petit roque (O-O) pour la sécurité classique", "Grand roque (O-O-O) pour attaquer sur l'aile roi"],
    positions: "Roquez tôt dans la partie, idéalement avant le coup 10.",
  },
  {
    id: 'smothered-mate',
    title: "Mat étouffé",
    category: "Patterns de mat",
    difficulty: "Avancé",
    description: "Un mat élégant où le cavalier donne mat car le roi est entouré de ses propres pièces.",
    steps: ["Le roi adverse est dans un coin", "Ses propres pièces l'entourent", "Sacrifice de dame pour forcer la position", "Le cavalier donne mat sur la case critique"],
    positions: "Le cavalier en g8/g1 avec le roi piégé en h8/h1.",
  },
];

const categories = [...new Set(techniques.map(t => t.category))];

const Techniques: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);

  const filtered = selectedCategory
    ? techniques.filter(t => t.category === selectedCategory)
    : techniques;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">
          Chess<span className="text-accent">Master</span>
          <span className="text-sm font-body text-muted-foreground ml-3">/ Techniques</span>
        </h1>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          Menu
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Category filter */}
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

        {/* Techniques grid */}
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

        {/* Detail modal */}
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
                className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
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

                <p className="text-sm font-body text-foreground/80 mb-4 leading-relaxed">
                  {selectedTechnique.description}
                </p>

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

                <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs font-body text-muted-foreground">
                    💡 {selectedTechnique.positions}
                  </p>
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
