import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameHeader: React.FC = () => {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border">
      <h1
        className="text-xl font-display font-bold text-foreground cursor-pointer"
        onClick={() => navigate('/')}
      >
        Chess<span className="text-accent">Master</span>
      </h1>
    </header>
  );
};

export default GameHeader;
