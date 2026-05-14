import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PieceInfo {
  symbol: string;
  name: string;
  value: number;
  movement: string;
  utility: string;
  tips: string[];
}

const pieces: PieceInfo[] = [
  {
    symbol: '♙',
    name: 'Pion',
    value: 1,
    movement: "Avance d'1 case (2 au premier coup). Capture en diagonale. Promeut en arrivant sur la dernière rangée.",
    utility: "Squelette de la position. Contrôle le centre, protège les pièces et peut devenir une dame.",
    tips: [
      "Ne créez pas de pions doublés ou isolés sans raison.",
      "Un pion passé en finale vaut souvent une victoire.",
      "Au centre (e4, d4, e5, d5), le pion est le plus puissant.",
    ],
  },
  {
    symbol: '♘',
    name: 'Cavalier',
    value: 3,
    movement: "Se déplace en L (2+1 cases). Seule pièce qui saute par-dessus les autres.",
    utility: "Excellent dans les positions fermées. Crée des fourchettes redoutables.",
    tips: [
      "Placez-le au centre (f3, c3, f6, c6) pour son rayonnement maximal.",
      "Évitez le bord : « cavalier au bord, cavalier mort ».",
      "Cherchez les fourchettes roi + dame ou roi + tour.",
    ],
  },
  {
    symbol: '♗',
    name: 'Fou',
    value: 3,
    movement: "Se déplace en diagonale, sans limite de distance. Reste sur sa couleur de case.",
    utility: "Roi des positions ouvertes. La paire de fous est un avantage durable.",
    tips: [
      "Conservez vos deux fous le plus longtemps possible.",
      "Un fou actif sur une longue diagonale (fianchetto) est très puissant.",
      "Évitez de bloquer vos fous derrière vos propres pions.",
    ],
  },
  {
    symbol: '♖',
    name: 'Tour',
    value: 5,
    movement: "Se déplace en ligne droite (rangées et colonnes), sans limite de distance.",
    utility: "Reine des colonnes ouvertes et de la 7ème rangée. Décisive en finale.",
    tips: [
      "Doublez vos tours sur une colonne ouverte.",
      "Une tour sur la 7ème rangée vaut souvent un pion.",
      "Activez vos tours par le roque le plus tôt possible.",
    ],
  },
  {
    symbol: '♕',
    name: 'Dame',
    value: 9,
    movement: "Combine la tour et le fou : lignes, colonnes et diagonales sans limite.",
    utility: "La pièce la plus puissante. À utiliser pour attaquer, pas pour défendre seule.",
    tips: [
      "Ne sortez pas la dame trop tôt — elle se fait chasser.",
      "Coordonnez-la avec une autre pièce pour menacer le mat.",
      "En finale, elle peut faire mat à elle seule avec le roi.",
    ],
  },
  {
    symbol: '♔',
    name: 'Roi',
    value: Infinity,
    movement: "Se déplace d'1 case dans toutes les directions. Ne peut jamais être en échec après un coup.",
    utility: "À protéger en ouverture, pièce active en finale.",
    tips: [
      "Roquez tôt pour mettre votre roi à l'abri.",
      "En finale, centralisez le roi : c'est une pièce forte (≈ 4 points).",
      "Méfiez-vous du mat du couloir : aérez vos pions du roque.",
    ],
  },
];

interface ConceptInfo {
  title: string;
  emoji: string;
  body: string;
}

const concepts: ConceptInfo[] = [
  {
    title: "Échec, mat et pat",
    emoji: '⚔️',
    body: "L'échec est une attaque sur le roi : on doit obligatoirement la parer. Le mat survient quand aucune parade n'existe — la partie est terminée. Le pat est une nulle : le joueur au trait n'a aucun coup légal mais n'est pas en échec.",
  },
  {
    title: "Le roque",
    emoji: '🏰',
    body: "Coup spécial qui déplace le roi de 2 cases vers une tour, et place la tour de l'autre côté. Conditions : ni le roi ni la tour n'ont bougé, aucune pièce entre eux, le roi n'est pas en échec et ne traverse pas une case attaquée.",
  },
  {
    title: "La prise en passant",
    emoji: '↘️',
    body: "Si un pion adverse avance de 2 cases et arrive à côté du vôtre, vous pouvez le capturer comme s'il n'avait avancé que d'1 case. À jouer immédiatement, sinon le droit est perdu.",
  },
  {
    title: "La promotion",
    emoji: '👑',
    body: "Un pion qui atteint la dernière rangée se transforme en dame, tour, fou ou cavalier (au choix). Souvent en dame, mais une sous-promotion en cavalier peut donner un mat surprise.",
  },
  {
    title: "Phases de la partie",
    emoji: '📚',
    body: "Ouverture (1-15) : développer ses pièces, contrôler le centre, mettre le roi à l'abri. Milieu de jeu : créer des plans tactiques et stratégiques. Finale : activer le roi et promouvoir un pion.",
  },
  {
    title: "Valeur des pièces",
    emoji: '⚖️',
    body: "Pion = 1, Cavalier = 3, Fou = 3, Tour = 5, Dame = 9, Roi = ∞. Ces valeurs guident vos échanges, mais l'activité d'une pièce compte autant que sa valeur théorique.",
  },
];

const eloExplained = {
  title: "Comment fonctionne votre ELO",
  emoji: '📈',
  body: `Le système ELO mesure votre niveau réel par rapport à vos adversaires. Vous démarrez à 1000.

Chaque IA a un score fixe :
• Amateur : 400  • Débutant : 800  • Intermédiaire : 1200  • Avancé : 1600  • Expert : 2000

Après chaque partie, votre ELO varie selon la formule :
ΔELO = K × (Résultat − Espérance)

— K = 32 (facteur de volatilité)
— Résultat : 1 (victoire), 0.5 (nulle), 0 (défaite)
— Espérance : probabilité de gagner calculée d'après l'écart de niveau

Concrètement : battre un adversaire bien plus fort rapporte beaucoup, perdre contre un plus faible coûte cher. Une partie sans coup joué ne change pas votre ELO.`,
};

const Apprendre: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPiece, setSelectedPiece] = useState<PieceInfo | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<ConceptInfo | null>(null);
  const [showElo, setShowElo] = useState(false);

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
        {/* Pieces */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">Les Pièces</h2>
          <p className="text-sm font-body text-muted-foreground mb-5">
            Découvrez chaque pièce : déplacement, valeur, utilité et conseils d'expert.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pieces.map(p => (
              <motion.div
                key={p.name}
                onClick={() => setSelectedPiece(p)}
                whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-accent/50 transition-colors flex flex-col items-center text-center"
              >
                <div className="text-5xl mb-2 text-foreground">{p.symbol}</div>
                <h3 className="font-display font-semibold text-foreground">{p.name}</h3>
                <p className="text-xs font-body text-muted-foreground mt-1">
                  Valeur : {p.value === Infinity ? '∞' : p.value}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Concepts */}
        <section className="mb-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">Règles & Concepts</h2>
          <p className="text-sm font-body text-muted-foreground mb-5">
            Les règles essentielles et les notions à maîtriser pour bien jouer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concepts.map(c => (
              <motion.div
                key={c.title}
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
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">Système de classement</h2>
          <p className="text-sm font-body text-muted-foreground mb-5">
            Comprenez comment votre score évolue après chaque partie.
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
              ΔELO = K × (Résultat − Espérance). Cliquez pour la formule complète.
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
                        Valeur : {selectedPiece.value === Infinity ? '∞ (inestimable)' : selectedPiece.value + ' points'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPiece(null)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-display font-semibold text-accent uppercase tracking-wider mb-1">Déplacement</h4>
                    <p className="text-sm font-body text-foreground/80">{selectedPiece.movement}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-display font-semibold text-accent uppercase tracking-wider mb-1">Utilité</h4>
                    <p className="text-sm font-body text-foreground/80">{selectedPiece.utility}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-display font-semibold text-accent uppercase tracking-wider mb-2">Conseils</h4>
                    <ul className="space-y-2">
                      {selectedPiece.tips.map((t, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-accent text-xs mt-1">▸</span>
                          <span className="text-sm font-body text-foreground/80">{t}</span>
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
