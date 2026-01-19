
import React, { useState } from 'react';
import { Gamepad2, ArrowLeft, Ghost, Trophy, HelpCircle, Grid3X3 } from 'lucide-react';
import { TicTacToeApp } from './games/TicTacToeApp';
import { SnakeApp } from './games/SnakeApp';
import { ClickerApp } from './games/ClickerApp';
import { QuizApp } from './games/QuizApp';

type GameType = 'menu' | 'tictactoe' | 'snake' | 'clicker' | 'quiz';

export const GameCenterApp = () => {
    const [activeGame, setActiveGame] = useState<GameType>('menu');

    const games = [
        { id: 'tictactoe', name: 'Tic Tac Toe', icon: <Grid3X3 size={32} className="text-indigo-400"/>, desc: 'Classic 3x3 strategy' },
        { id: 'snake', name: 'Snake', icon: <Ghost size={32} className="text-green-400"/>, desc: 'Don\'t hit the wall!' },
        { id: 'clicker', name: 'Clicker', icon: <Trophy size={32} className="text-yellow-400"/>, desc: 'Addictive clicking' },
        { id: 'quiz', name: 'Gemini Quiz', icon: <HelpCircle size={32} className="text-purple-400"/>, desc: 'AI-generated trivia' },
    ];

    if (activeGame === 'menu') {
        return (
            <div className="h-full flex flex-col bg-transparent text-neutral-200 p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/20">
                        <Gamepad2 size={32} className="text-indigo-300"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Game Center</h2>
                        <p className="text-neutral-500 text-sm">Select a game to play</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {games.map(g => (
                        <button
                            key={g.id}
                            onClick={() => setActiveGame(g.id as GameType)}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex flex-col items-center text-center transition-all hover:scale-105 group"
                        >
                            <div className="mb-3 p-3 bg-black/20 rounded-full group-hover:bg-black/40 transition-colors">
                                {g.icon}
                            </div>
                            <h3 className="font-bold text-neutral-200">{g.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1">{g.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-transparent text-neutral-200">
            <div className="h-12 border-b border-white/5 flex items-center px-4 bg-black/10">
                <button 
                    onClick={() => setActiveGame('menu')}
                    className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16}/> Back to Menu
                </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {activeGame === 'tictactoe' && <TicTacToeApp />}
                {activeGame === 'snake' && <SnakeApp />}
                {activeGame === 'clicker' && <ClickerApp />}
                {activeGame === 'quiz' && <QuizApp />}
            </div>
        </div>
    );
};
