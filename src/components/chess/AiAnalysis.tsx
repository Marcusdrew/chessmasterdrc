import React, { useState, useEffect, useRef } from 'react';
import { Move, Chess } from 'chess.js';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

interface AiAnalysisProps {
  moveHistory: Move[];
  fen: string;
  currentTurn: string;
  gameStatus: string;
  playerColor: 'w' | 'b';
  onHint?: () => void;
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

const AiAnalysis: React.FC<AiAnalysisProps> = ({ moveHistory, fen, currentTurn, gameStatus, playerColor, onHint }) => {
  const { t } = useTranslation();
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

    const lastMove = moveHistory[moveHistory.length - 1];
    if (!lastMove || lastMove.color !== playerColor) return;
    if (moveHistory.length <= lastAnalyzedRef.current) return;

    lastAnalyzedRef.current = moveHistory.length;
    setThinking(true);

    const timer = setTimeout(() => {
      const analysis = analyzeMove(lastMove, moveHistory, fen, playerColor, t);
      if (analysis) {
        setAnalyses(prev => [...prev, analysis]);
      }
      setThinking(false);
    }, 300 + Math.random() * 500);

    return () => clearTimeout(timer);
  }, [moveHistory.length, playerColor]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [analyses.length]);

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-display font-semibold text-foreground">
            {t('aiCoach.title')}
          </h3>
          {thinking && (
            <span className="text-xs text-muted-foreground animate-pulse font-body">
              {t('aiCoach.analyzing')}
            </span>
          )}
        </div>
        {onHint && gameStatus === 'playing' && (
          <button
            onClick={onHint}
            className="px-2.5 py-1 rounded bg-accent/10 text-accent text-xs font-body font-medium hover:bg-accent/20 transition-colors"
          >
            💡 {t('aiCoach.hint')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {analyses.length === 0 && !thinking && (
          <p className="text-xs text-muted-foreground font-body py-4 text-center">
            {t('aiCoach.playToGetTips')}
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
                💡 {entry.suggestion}
              </p>
            )}
          </div>
        ))}

        {gameStatus !== 'playing' && (
          <div className="border-l-2 border-l-accent pl-3 py-2 text-xs font-body">
            <p className="font-medium text-foreground">
              {gameStatus === 'checkmate' ? `♚ ${t('aiCoach.checkmate')}` : gameStatus === 'draw' ? `🤝 ${t('aiCoach.draw')}` : `🤝 ${t('aiCoach.stalemate')}`}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

function analyzeMove(move: Move, history: Move[], fen: string, playerColor: 'w' | 'b', t: TFunction): AnalysisEntry | null {
  const moveNum = Math.ceil(history.length / 2);
  const base = { moveNumber: moveNum, move: move.san, from: move.from, to: move.to };

  const tempGame = new Chess();
  const movesBeforeThis = history.slice(0, -1);
  for (const m of movesBeforeThis) {
    tempGame.move(m.san);
  }
  const alternatives = tempGame.moves({ verbose: true });

  if (move.captured) {
    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const capturedVal = pieceValues[move.captured] || 0;
    const movingVal = pieceValues[move.piece] || 0;

    const afterMove = new Chess();
    for (const m of history) afterMove.move(m.san);
    const opponentResponses = afterMove.moves({ verbose: true });
    const isRecapturable = opponentResponses.some(m => m.to === move.to);

    if (capturedVal > movingVal + 1) {
      return { ...base, analysis: t('aiCoach.tips.greatCapture'), type: 'good' };
    }
    if (capturedVal < movingVal && isRecapturable) {
      return {
        ...base,
        analysis: t('aiCoach.tips.badExchange', {
          piece: pieceName(move.piece, t),
          value: movingVal,
          captured: pieceName(move.captured, t),
          capturedValue: capturedVal,
        }),
        type: 'mistake',
      };
    }
    if (capturedVal === movingVal) {
      return { ...base, analysis: t('aiCoach.tips.equalExchange'), type: 'info' };
    }
    return { ...base, analysis: t('aiCoach.tips.captureDone'), type: 'info' };
  }

  if (move.san.includes('+')) {
    return { ...base, analysis: t('aiCoach.tips.check'), type: 'good' };
  }

  if (move.san === 'O-O' || move.san === 'O-O-O') {
    return { ...base, analysis: t('aiCoach.tips.castling'), type: 'good' };
  }

  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  if (centerSquares.includes(move.to) && move.piece === 'p') {
    return { ...base, analysis: t('aiCoach.tips.centerControl'), type: 'good' };
  }

  const playerMoveCount = history.filter(m => m.color === playerColor).length;
  if (playerMoveCount <= 5) {
    if (move.piece === 'n' || move.piece === 'b') {
      return { ...base, analysis: t('aiCoach.tips.minorDevelopment'), type: 'good' };
    }
    if (move.piece === 'q' && playerMoveCount <= 3) {
      return { ...base, analysis: t('aiCoach.tips.earlyQueen'), type: 'tip' };
    }
    if (move.piece === 'p' && !centerSquares.includes(move.to)) {
      const flankFiles = ['a', 'b', 'g', 'h'];
      if (flankFiles.includes(move.to[0])) {
        return { ...base, analysis: t('aiCoach.tips.flankPawn'), type: 'tip' };
      }
    }
  }

  if (playerMoveCount <= 6) {
    const playerMoves = history.filter(m => m.color === playerColor);
    const previousMovesWithSamePiece = playerMoves.slice(0, -1).filter(m => m.piece === move.piece && m.to === move.from);
    if (previousMovesWithSamePiece.length > 0 && move.piece !== 'p') {
      return { ...base, analysis: t('aiCoach.tips.samePieceTwice'), type: 'tip' };
    }
  }

  if (move.piece === 'k' && playerMoveCount <= 15) {
    return { ...base, analysis: t('aiCoach.tips.kingMoved'), type: 'tip' };
  }

  return null;
}

function pieceName(type: string, t: TFunction): string {
  return t(`aiCoach.pieceNames.${type}`, { defaultValue: type });
}

export default AiAnalysis;
