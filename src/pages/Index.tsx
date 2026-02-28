import React from 'react';
import { useChessGame } from '@/hooks/useChessGame';
import ChessBoard from '@/components/chess/ChessBoard';
import GameSidebar from '@/components/chess/GameSidebar';
import GameHeader from '@/components/chess/GameHeader';

const Index: React.FC = () => {
  const { board, state, handleSquareClick, resetGame, setMode, isInCheck, currentTurn } = useChessGame(true);

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      <GameHeader />
      
      <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-6 px-4 pb-8">
        <ChessBoard
          board={board}
          selectedSquare={state.selectedSquare}
          validMoves={state.validMoves}
          isInCheck={isInCheck}
          currentTurn={currentTurn}
          mode={state.mode}
          onSquareClick={handleSquareClick}
        />
        
        <GameSidebar
          mode={state.mode}
          moveHistory={state.moveHistory}
          capturedWhite={state.capturedWhite}
          capturedBlack={state.capturedBlack}
          currentTurn={currentTurn}
          isAiThinking={state.isAiThinking}
          gameStatus={state.gameStatus}
          winner={state.winner}
          whitePlayer={state.whitePlayer}
          blackPlayer={state.blackPlayer}
          onReset={resetGame}
          onModeChange={setMode}
        />
      </main>
    </div>
  );
};

export default Index;
