import React, { useState, useEffect, useRef } from 'react';
import { Move, Chess } from 'chess.js';

interface AiAnalysisProps {
  moveHistory: Move[];
  fen: string;
  currentTurn: string;
  gameStatus: string;
}

interface AnalysisEntry {
  moveNumber: number;
  move: string;
  color: 'w' | 'b';
  analysis: string;
  type: 'good' | 'mistake' | 'tip' | 'info';
}

const typeStyles: Record<string, string> = {
  good: 'border-l-chess-valid text-chess-valid',
  mistake: 'border-l-destructive text-destructive',
  tip: 'border-l-accent text-accent',
  info: 'border-l-muted-foreground text-muted-foreground',
};

const typeIcons: Record<string, string> = {
  good: '✓',
  mistake: '✗',
  tip: '💡',
  info: 'ℹ',
};

const AiAnalysis: React.FC<AiAnalysisProps> = ({ moveHistory, fen, currentTurn, gameStatus }) => {
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moveHistory.length === 0) {
      setAnalyses([]);
      return;
    }

    const lastMove = moveHistory[moveHistory.length - 1];
    if (!lastMove) return;

    setThinking(true);

    // Simulate AI analysis (will be replaced with real AI)
    const timer = setTimeout(() => {
      const analysis = analyzeMove(lastMove, moveHistory, fen);
      setAnalyses(prev => [...prev, analysis]);
      setThinking(false);
    }, 300 + Math.random() * 500);

    return () => clearTimeout(timer);
  }, [moveHistory.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [analyses.length]);

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="text-sm font-display font-semibold text-foreground">
          Analyse IA
        </h3>
        {thinking && (
          <span className="text-xs text-muted-foreground animate-pulse font-body">
            Analyse en cours...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {analyses.length === 0 && !thinking && (
          <p className="text-xs text-muted-foreground font-body py-4 text-center">
            Jouez un coup pour recevoir des conseils de l'IA
          </p>
        )}

        {analyses.map((entry, i) => (
          <div
            key={i}
            className={`border-l-2 pl-3 py-2 text-xs font-body ${typeStyles[entry.type]}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span>{typeIcons[entry.type]}</span>
              <span className="font-medium text-foreground">
                {entry.color === 'w' ? 'Blancs' : 'Noirs'} — {entry.move}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{entry.analysis}</p>
          </div>
        ))}

        {gameStatus !== 'playing' && (
          <div className="border-l-2 border-l-accent pl-3 py-2 text-xs font-body">
            <p className="font-medium text-foreground">
              {gameStatus === 'checkmate' ? '♚ Échec et mat !' : gameStatus === 'draw' ? 'Partie nulle' : 'Pat'}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

function analyzeMove(move: Move, history: Move[], fen: string): AnalysisEntry {
  const moveNum = Math.ceil(history.length / 2);

  // Simple heuristic analysis
  if (move.captured) {
    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const capturedVal = pieceValues[move.captured] || 0;
    const movingVal = pieceValues[move.piece] || 0;

    if (capturedVal > movingVal) {
      return {
        moveNumber: moveNum, move: move.san, color: move.color,
        analysis: `Excellente capture ! Vous gagnez du matériel (${capturedVal - movingVal} points d'avantage).`,
        type: 'good',
      };
    }
    if (capturedVal < movingVal) {
      return {
        moveNumber: moveNum, move: move.san, color: move.color,
        analysis: `Attention : vous échangez une pièce de valeur ${movingVal} contre une de valeur ${capturedVal}. Vérifiez que c'est justifié tactiquement.`,
        type: 'mistake',
      };
    }
    return {
      moveNumber: moveNum, move: move.san, color: move.color,
      analysis: `Échange de pièces de valeur égale. Position équilibrée.`,
      type: 'info',
    };
  }

  if (move.san.includes('+')) {
    return {
      moveNumber: moveNum, move: move.san, color: move.color,
      analysis: `Échec ! Bonne pression sur le roi adverse. Cherchez à maintenir l'initiative.`,
      type: 'good',
    };
  }

  if (move.san === 'O-O' || move.san === 'O-O-O') {
    return {
      moveNumber: moveNum, move: move.san, color: move.color,
      analysis: `Le roque met votre roi en sécurité et active votre tour. Excellent réflexe.`,
      type: 'good',
    };
  }

  // Center control tips
  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  if (centerSquares.includes(move.to)) {
    return {
      moveNumber: moveNum, move: move.san, color: move.color,
      analysis: `Bon contrôle du centre. Les cases centrales sont cruciales pour la domination.`,
      type: 'tip',
    };
  }

  const tips = [
    "Pensez à développer vos pièces mineures en début de partie.",
    "Contrôlez le centre pour limiter les options adverses.",
    "Connectez vos tours pour maximiser leur efficacité.",
    "Gardez une structure de pions solide.",
    "Anticipez les menaces adverses avant de jouer.",
  ];

  return {
    moveNumber: moveNum, move: move.san, color: move.color,
    analysis: tips[Math.floor(Math.random() * tips.length)],
    type: 'tip',
  };
}

export default AiAnalysis;
