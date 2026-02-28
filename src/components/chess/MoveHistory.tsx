import React from 'react';
import { Move } from 'chess.js';

interface MoveHistoryProps {
  moveHistory: Move[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moveHistory }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <h3 className="text-sm font-display font-semibold text-foreground mb-3">
        Historique des coups
      </h3>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border">
              <th className="py-2 text-left w-8">#</th>
              <th className="py-2 text-left">♔ Blancs</th>
              <th className="py-2 text-left">♚ Noirs</th>
            </tr>
          </thead>
          <tbody>
            {moveHistory.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted-foreground text-xs">
                  Aucun coup joué
                </td>
              </tr>
            ) : (
              Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 text-muted-foreground">{i + 1}.</td>
                  <td className="py-1.5 text-foreground font-medium">{moveHistory[i * 2]?.san}</td>
                  <td className="py-1.5 text-foreground font-medium">{moveHistory[i * 2 + 1]?.san || ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoveHistory;
