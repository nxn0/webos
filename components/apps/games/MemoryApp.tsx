
import React, { useState, useEffect } from 'react';

export const MemoryApp = () => {
  const icons = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
  const [cards, setCards] = useState<{id: number, icon: string, flipped: boolean, matched: boolean}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);

  useEffect(() => {
    const deck = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon, flipped: false, matched: false }));
    setCards(deck);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFlip = (index: number) => {
    if (flipped.length === 2 || cards[index].flipped || cards[index].matched) return;
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    setFlipped([...flipped, index]);
  };

  useEffect(() => {
    if (flipped.length === 2) {
      const [a, b] = flipped;
      if (cards[a].icon === cards[b].icon) {
        setCards(c => c.map((card, i) => (i === a || i === b) ? {...card, matched: true} : card));
        setFlipped([]);
      } else {
        setTimeout(() => {
          setCards(c => c.map((card, i) => (i === a || i === b) ? {...card, flipped: false} : card));
          setFlipped([]);
        }, 1000);
      }
    }
  }, [flipped, cards]);

  return (
    <div className="h-full p-4 grid grid-cols-4 gap-2 bg-transparent overflow-auto">
      {cards.map((card, i) => (
        <button 
          key={i} 
          onClick={() => handleFlip(i)}
          className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all transform shadow-sm border border-white/5 ${card.flipped || card.matched ? 'bg-white/10 rotate-0' : 'bg-green-500/20 rotate-180 text-transparent'}`}
        >
          {card.flipped || card.matched ? card.icon : '?'}
        </button>
      ))}
    </div>
  );
};
