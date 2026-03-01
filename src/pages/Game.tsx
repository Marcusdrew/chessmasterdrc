import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useChessGame } from '@/hooks/useChessGame';
import ChessBoard from '@/components/chess/ChessBoard';
import MoveHistory from '@/components/chess/MoveHistory';
import AiAnalysis from '@/components/chess/AiAnalysis';
import type { Difficulty } from '@/lib/chessAI';

const Game: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerColor = (searchParams.get('color') || 'w') as 'w' | 'b';
  const difficulty = (searchParams.get('difficulty') || 'intermediaire') as Difficulty;

  const { fen, board, state, handleSquareClick, undoMove, isInCheck, currentTurn } =
    useChessGame(true, playerColor, difficulty);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">
          Chess<span className="text-accent">Master</span>
        </h1>
        <div className="flex items-center gap-3 font-body text-sm">
          <span className={`flex items-center gap-1.5 ${state.gameStatus === 'playing' ? '' : 'opacity-50'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${currentTurn === 'w' ? 'bg-foreground' : 'bg-foreground/30'}`} />
            {state.gameStatus === 'playing'
              ? state.isAiThinking
                ? 'Adversaire réfléchit...'
                : currentTurn === playerColor ? 'Votre tour' : "Tour de l'adversaire"
              : state.gameStatus === 'checkmate'
                ? `Échec et mat ! ${state.winner === playerColor ? 'Victoire' : 'Défaite'}`
                : state.gameStatus === 'draw' ? 'Partie nulle' : 'Pat'
            }
          </span>
          <button
            onClick={undoMove}
            disabled={state.moveHistory.length === 0 || state.isAiThinking}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↩ Undo
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Menu
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center gap-4 p-4 overflow-hidden">
        <div className="hidden lg:block w-72 h-[560px]">
          <AiAnalysis
            moveHistory={state.moveHistory}
            fen={fen}
            currentTurn={currentTurn}
            gameStatus={state.gameStatus}
            playerColor={playerColor}
          />
        </div>

        <ChessBoard
          board={board}
          selectedSquare={state.selectedSquare}
          validMoves={state.validMoves}
          isInCheck={isInCheck}
          currentTurn={currentTurn}
          playerColor={playerColor}
          onSquareClick={handleSquareClick}
        />

        <div className="hidden lg:block w-56 h-[560px]">
          <MoveHistory moveHistory={state.moveHistory} />
        </div>
      </main>

      <div className="lg:hidden flex gap-2 px-4 pb-4">
        <div className="flex-1 max-h-48">
          <AiAnalysis
            moveHistory={state.moveHistory}
            fen={fen}
            currentTurn={currentTurn}
            gameStatus={state.gameStatus}
            playerColor={playerColor}
          />
        </div>
        <div className="flex-1 max-h-48">
          <MoveHistory moveHistory={state.moveHistory} />
        </div>
      </div>
    </div>
  );
};

export default Game;
