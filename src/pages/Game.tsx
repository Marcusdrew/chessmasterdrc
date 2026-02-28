import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useChessGame } from '@/hooks/useChessGame';
import ChessBoard from '@/components/chess/ChessBoard';
import MoveHistory from '@/components/chess/MoveHistory';
import AiAnalysis from '@/components/chess/AiAnalysis';

const Game: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerColor = (searchParams.get('color') || 'w') as 'w' | 'b';
  const difficulty = searchParams.get('difficulty') || 'intermediaire';

  const { fen, board, state, handleSquareClick, resetGame, isInCheck, currentTurn } =
    useChessGame(true, playerColor);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">
          Chess<span className="text-accent">Master</span>
        </h1>
        <div className="flex items-center gap-3 font-body text-sm">
          <span className={`flex items-center gap-1.5 ${state.gameStatus === 'playing' ? '' : 'opacity-50'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${currentTurn === 'w' ? 'bg-foreground' : 'bg-foreground/30'}`} />
            {state.gameStatus === 'playing'
              ? state.isAiThinking
                ? 'IA réfléchit...'
                : currentTurn === playerColor ? 'Votre tour' : 'Tour de l\'IA'
              : state.gameStatus === 'checkmate'
                ? `Échec et mat ! ${state.winner === playerColor ? 'Victoire' : 'Défaite'}`
                : state.gameStatus === 'draw' ? 'Partie nulle' : 'Pat'
            }
          </span>
          <button
            onClick={resetGame}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Rejouer
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Menu
          </button>
        </div>
      </header>

      {/* Game layout */}
      <main className="flex-1 flex items-start justify-center gap-4 p-4 overflow-hidden">
        {/* AI Analysis - Left */}
        <div className="hidden lg:block w-72 h-[560px]">
          <AiAnalysis
            moveHistory={state.moveHistory}
            fen={fen}
            currentTurn={currentTurn}
            gameStatus={state.gameStatus}
          />
        </div>

        {/* Board - Center */}
        <ChessBoard
          board={board}
          selectedSquare={state.selectedSquare}
          validMoves={state.validMoves}
          isInCheck={isInCheck}
          currentTurn={currentTurn}
          playerColor={playerColor}
          onSquareClick={handleSquareClick}
        />

        {/* Move History - Right */}
        <div className="hidden lg:block w-56 h-[560px]">
          <MoveHistory moveHistory={state.moveHistory} />
        </div>
      </main>

      {/* Mobile panels */}
      <div className="lg:hidden flex gap-2 px-4 pb-4">
        <div className="flex-1 max-h-48">
          <AiAnalysis
            moveHistory={state.moveHistory}
            fen={fen}
            currentTurn={currentTurn}
            gameStatus={state.gameStatus}
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
