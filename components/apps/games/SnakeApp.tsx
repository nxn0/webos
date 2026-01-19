
import React, { useState, useEffect, useRef } from 'react';

export const SnakeApp = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 1;
    let dy = 0;
    const gridSize = 20;
    const tileCount = 20; // 400x400 canvas

    const loop = setInterval(() => {
      const head = {x: snake[0].x + dx, y: snake[0].y + dy};
      
      if (head.x < 0) head.x = tileCount - 1;
      if (head.x >= tileCount) head.x = 0;
      if (head.y < 0) head.y = tileCount - 1;
      if (head.y >= tileCount) head.y = 0;

      for (let cell of snake) {
        if (cell.x === head.x && cell.y === head.y) {
          setGameOver(true);
          setRunning(false);
          return;
        }
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#0a0a0a'; // Dark neutral background
      ctx.fillRect(0,0, 400, 400);
      ctx.fillStyle = '#86efac'; // Pastel Green
      snake.forEach(part => ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2));
      ctx.fillStyle = '#fca5a5'; // Pastel Red
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    }, 100);

    const handleKey = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp': if (dy !== 1) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (dy !== -1) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (dx !== 1) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx !== -1) { dx = 1; dy = 0; } break;
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      clearInterval(loop);
      document.removeEventListener('keydown', handleKey);
    };
  }, [running]);

  return (
    <div className="h-full bg-transparent flex flex-col items-center justify-center text-neutral-200">
      <div className="mb-2 flex justify-between w-64 text-sm font-bold">
        <span>Score: {score}</span>
        {gameOver && <span className="text-red-300">GAME OVER</span>}
      </div>
      <canvas ref={canvasRef} width="400" height="400" className="border border-white/10 shadow-xl rounded-lg bg-black/40 w-64 h-64 md:w-80 md:h-80" />
      {!running && (
        <button onClick={() => { setRunning(true); setGameOver(false); setScore(0); }} className="mt-4 px-6 py-2 bg-green-500/20 text-green-200 border border-green-500/20 rounded shadow hover:bg-green-500/30 transition-colors">
          {gameOver ? 'Try Again' : 'Start Game'}
        </button>
      )}
    </div>
  );
};
