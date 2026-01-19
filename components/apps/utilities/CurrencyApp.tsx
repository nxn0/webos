
import React, { useState } from 'react';
import { ArrowRight, Coins } from 'lucide-react';

export const CurrencyApp = () => {
  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  
  const rates: Record<string, number> = { USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, CAD: 1.25, AUD: 1.35 };
  const result = (amount * (rates[to] / rates[from])).toFixed(2);

  return (
    <div className="h-full bg-transparent p-8 flex flex-col justify-center text-neutral-200">
      <h2 className="text-xl font-bold mb-8 text-center flex justify-center items-center gap-2">
          <div className="p-1.5 bg-green-500/20 rounded-full text-green-200 border border-green-500/20"><Coins size={18}/></div> 
          Converter
      </h2>
      
      <div className="space-y-6">
        <div>
            <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-4 text-xl font-mono border border-white/5 rounded-xl bg-black/20 text-neutral-100 focus:border-green-400/50 outline-none backdrop-blur-sm transition-colors" />
        </div>
        
        <div className="flex gap-4 items-end">
            <div className="flex-1">
                <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">From</label>
                <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-3 rounded-xl border border-white/5 bg-black/20 text-neutral-200 outline-none focus:border-green-400/50 backdrop-blur-sm">
                    {Object.keys(rates).map(c => <option key={c} className="bg-neutral-900">{c}</option>)}
                </select>
            </div>
            <div className="pb-3 text-neutral-500"><ArrowRight size={18} /></div>
            <div className="flex-1">
                <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">To</label>
                <select value={to} onChange={e => setTo(e.target.value)} className="w-full p-3 rounded-xl border border-white/5 bg-black/20 text-neutral-200 outline-none focus:border-green-400/50 backdrop-blur-sm">
                    {Object.keys(rates).map(c => <option key={c} className="bg-neutral-900">{c}</option>)}
                </select>
            </div>
        </div>

        <div className="mt-8 p-6 bg-green-500/10 rounded-2xl border border-green-500/20 text-center backdrop-blur-sm">
             <span className="text-xs text-green-300 font-medium uppercase tracking-wider">Converted Amount</span>
             <div className="text-4xl font-bold text-green-100 mt-2">
                {result} <span className="text-lg opacity-70">{to}</span>
             </div>
        </div>
      </div>
    </div>
  );
};
