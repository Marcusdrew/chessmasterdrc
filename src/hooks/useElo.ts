import { useState, useCallback } from 'react';
import type { Difficulty } from '@/lib/chessAI';

const ELO_KEY = 'chessmaster_elo';
const HISTORY_KEY = 'chessmaster_elo_history';

const DIFFICULTY_ELO: Record<Difficulty, number> = {
  amateur: 400,
  debutant: 800,
  intermediaire: 1200,
  avance: 1600,
  expert: 2000,
};

function getStoredElo(): number {
  const stored = localStorage.getItem(ELO_KEY);
  return stored ? parseInt(stored, 10) : 1000;
}

function getStoredHistory(): { elo: number; result: string; date: string }[] {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

function calculateEloChange(playerElo: number, opponentElo: number, result: 0 | 0.5 | 1): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(K * (result - expected));
}

export function useElo(difficulty: Difficulty) {
  const [elo, setElo] = useState(getStoredElo);
  const [history, setHistory] = useState(getStoredHistory);

  const updateElo = useCallback((result: 'win' | 'loss' | 'draw') => {
    const opponentElo = DIFFICULTY_ELO[difficulty];
    const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    const change = calculateEloChange(elo, opponentElo, score as 0 | 0.5 | 1);
    const newElo = Math.max(100, elo + change);
    
    const entry = {
      elo: newElo,
      result: `${result === 'win' ? 'V' : result === 'loss' ? 'D' : 'N'} vs ${difficulty} (${change > 0 ? '+' : ''}${change})`,
      date: new Date().toLocaleDateString('fr-FR'),
    };

    setElo(newElo);
    const newHistory = [...history, entry].slice(-20);
    setHistory(newHistory);
    localStorage.setItem(ELO_KEY, String(newElo));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

    return { newElo, change };
  }, [elo, difficulty, history]);

  return { elo, history, updateElo };
}
