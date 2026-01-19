
import React, { useState, useEffect } from 'react';
import { generateQuizQuestion } from '../../../services/geminiService';
import { Loader2 } from 'lucide-react';

export const QuizApp = () => {
  const [currentQ, setCurrentQ] = useState<{question: string, options: string[], answer: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  const loadQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setResult(null);
    const q = await generateQuizQuestion();
    setCurrentQ(q);
    setLoading(false);
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === currentQ?.answer) {
      setScore(s => s + 1);
      setResult('correct');
    } else {
      setResult('wrong');
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-transparent text-neutral-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-purple-300">Gemini Quiz</h2>
        <span className="font-mono bg-purple-500/10 px-2 py-1 rounded text-purple-200 border border-purple-500/20">Score: {score}</span>
      </div>

      {loading && <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-purple-300" size={48} /></div>}
      
      {!loading && currentQ && (
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-medium mb-6 text-center text-neutral-100">{currentQ.question}</h3>
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className={`p-3 rounded-lg text-left transition-colors border shadow-sm ${
                  selected === opt 
                    ? (opt === currentQ.answer ? 'bg-green-500/20 border-green-500/50 text-green-200' : 'bg-red-500/20 border-red-500/50 text-red-200')
                    : 'bg-white/5 border-white/5 hover:border-purple-400/30 backdrop-blur-sm hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {result && (
            <div className="mt-6 text-center">
              <p className={`font-bold ${result === 'correct' ? 'text-green-300' : 'text-red-300'}`}>
                {result === 'correct' ? 'Correct!' : `Wrong! Answer: ${currentQ.answer}`}
              </p>
              <button onClick={loadQuestion} className="mt-2 px-4 py-2 bg-purple-500/20 text-purple-200 border border-purple-500/20 rounded-lg hover:bg-purple-500/30 shadow transition-colors">Next Question</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
