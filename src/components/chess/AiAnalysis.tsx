import React, { useState, useEffect, useRef } from 'react';
import { Move, Chess } from 'chess.js';

interface AiAnalysisProps {
  moveHistory: Move[];
  fen: string;
  currentTurn: string;
  gameStatus: string;
  playerColor: 'w' | 'b';
}

interface AnalysisEntry {
  moveNumber: number;
  move: string;
  from: string;
  to: string;
  analysis: string;
  suggestion?: string;
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

const AiAnalysis: React.FC<AiAnalysisProps> = ({ moveHistory, fen, currentTurn, gameStatus, playerColor }) => {
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAnalyzedRef = useRef(0);

  useEffect(() => {
    if (moveHistory.length === 0) {
      setAnalyses([]);
      lastAnalyzedRef.current = 0;
      return;
    }

    // Only analyze player's moves
    const lastMove = moveHistory[moveHistory.length - 1];
    if (!lastMove || lastMove.color !== playerColor) return;
    if (moveHistory.length <= lastAnalyzedRef.current) return;

    lastAnalyzedRef.current = moveHistory.length;
    setThinking(true);

    const timer = setTimeout(() => {
      const analysis = analyzeMove(lastMove, moveHistory, fen, playerColor);
      setAnalyses(prev => [...prev, analysis]);
      setThinking(false);
    }, 300 + Math.random() * 500);

    return () => clearTimeout(timer);
  }, [moveHistory.length, playerColor]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [analyses.length]);

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="text-sm font-display font-semibold text-foreground">
          Conseils IA
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
            Jouez un coup pour recevoir des conseils
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
                {entry.from} → {entry.to}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{entry.analysis}</p>
            {entry.suggestion && (
              <p className="text-foreground mt-1 font-medium">
                💡 Suggestion : {entry.suggestion}
              </p>
            )}
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

function analyzeMove(move: Move, history: Move[], fen: string, playerColor: 'w' | 'b'): AnalysisEntry {
  const moveNum = Math.ceil(history.length / 2);
  const base = { moveNumber: moveNum, move: move.san, from: move.from, to: move.to };

  // Try to find a better alternative
  const tempGame = new Chess();
  // Replay up to just before this move
  const movesBeforeThis = history.slice(0, -1);
  for (const m of movesBeforeThis) {
    tempGame.move(m.san);
  }
  const alternatives = tempGame.moves({ verbose: true });

  // Find a capturing move as suggestion if player didn't capture
  const captureMoves = alternatives.filter(m => m.captured && m.from !== move.from);
  const suggestion = captureMoves.length > 0 && !move.captured
    ? `Vous auriez pu jouer ${captureMoves[0].from} → ${captureMoves[0].to} pour capturer.`
    : undefined;

  if (move.captured) {
    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const capturedVal = pieceValues[move.captured] || 0;
    const movingVal = pieceValues[move.piece] || 0;

    if (capturedVal > movingVal) {
      return { ...base, analysis: `Excellente capture ! Gain de ${capturedVal - movingVal} points de matériel.`, type: 'good' };
    }
    if (capturedVal < movingVal) {
      return { ...base, analysis: `Attention : échange défavorable (${movingVal} pts contre ${capturedVal} pts).`, type: 'mistake', suggestion };
    }
    return { ...base, analysis: `Échange de pièces de valeur égale.`, type: 'info' };
  }

  if (move.san.includes('+')) {
    return { ...base, analysis: `Échec ! Bonne pression. Maintenez l'initiative.`, type: 'good' };
  }

  if (move.san === 'O-O' || move.san === 'O-O-O') {
    return { ...base, analysis: `Le roque sécurise votre roi et active la tour. Excellent.`, type: 'good' };
  }

  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  if (centerSquares.includes(move.to)) {
    return { ...base, analysis: `Bon contrôle du centre.`, type: 'tip', suggestion };
  }

  const tips = [
    "Développez vos pièces mineures rapidement.",
    "Contrôlez le centre pour dominer la position.",
    "Connectez vos tours sur la rangée arrière.",
    "Gardez une structure de pions solide.",
    "Anticipez les menaces avant de jouer.",
  ];

  return {
    ...base,
    analysis: tips[Math.floor(Math.random() * tips.length)],
    type: 'tip',
    suggestion,
  };
}

export default AiAnalysis;
