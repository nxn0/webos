
import React, { useState } from 'react';

export const TicTacToeApp = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  
  const winner = calculateWinner(board);

  function calculateWinner(squares: any[]) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  }

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const next = [...board];
    next[i] = xIsNext ? 'X' : 'O';
    setBoard(next);
    setXIsNext(!xIsNext);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-transparent text-neutral-200">
      <div className="mb-4 text-xl font-bold">
        {winner ? `Winner: ${winner}` : `Next: ${xIsNext ? 'X' : 'O'}`}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {board.map((val, i) => (
          <button 
            key={i} 
            onClick={() => handleClick(i)}
            className="w-16 h-16 bg-white/5 shadow-sm rounded-lg text-3xl font-bold text-blue-300 hover:bg-white/10 backdrop-blur-sm transition-colors border border-white/5"
          >
            {val}
          </button>
        ))}
      </div>
      <button onClick={() => setBoard(Array(9).fill(null))} className="mt-6 px-4 py-2 bg-blue-500/20 text-blue-200 border border-blue-500/20 rounded shadow hover:bg-blue-500/30 transition-colors">Reset</button>
    </div>
  );
};
