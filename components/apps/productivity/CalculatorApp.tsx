
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, DollarSign, Binary, LineChart, 
  X, ArrowRightLeft, Box, FunctionSquare,
  Menu, Delete
} from 'lucide-react';

// --- Types ---
type CalcMode = 'scientific' | 'converter' | 'finance' | 'programmer' | 'graphing' | 'tools';

// --- Scientific Logic ---
const evaluateExpression = (expr: string) => {
    try {
        // Safe-ish eval for math using Function constructor
        // eslint-disable-next-line no-new-func
        const func = new Function('Math', 'return ' + expr
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/pi/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/\^/g, '**')
        );
        return String(func(Math));
    } catch {
        return "Error";
    }
};

// --- Graphing Logic ---
const drawGraph = (canvas: HTMLCanvasElement, expr: string, range: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0,0,w,h);
    
    // Axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
    ctx.stroke();

    // Plot
    ctx.beginPath();
    ctx.strokeStyle = '#93c5fd'; // Pastel Blue
    ctx.lineWidth = 2;
    
    let started = false;

    // We step through pixels for performance
    for(let px = 0; px < w; px++) {
        const x = (px - w/2) * (range / (w/2));
        try {
            // eslint-disable-next-line no-new-func
            const f = new Function('x', 'Math', `return ${expr
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/log/g, 'Math.log10')
                .replace(/ln/g, 'Math.log')
                .replace(/\^/g, '**')
            }`);
            const y = f(x, Math);
            // Invert y for canvas coords
            const py = h/2 - (y * (h/2) / range);
            
            if (Number.isFinite(py)) {
                if (!started) { ctx.moveTo(px, py); started = true; }
                else ctx.lineTo(px, py);
            } else {
                started = false;
            }
        } catch { started = false; }
    }
    ctx.stroke();
};

export const CalculatorApp = () => {
    const [mode, setMode] = useState<CalcMode>('scientific');
    const [showMenu, setShowMenu] = useState(false);
    
    // --- Scientific State ---
    const [display, setDisplay] = useState('0');
    const [history, setHistory] = useState<string[]>([]);
    
    // --- Converter State ---
    const [convType, setConvType] = useState('length');
    const [convVal, setConvVal] = useState('1');
    const [convFrom, setConvFrom] = useState('m');
    const [convTo, setConvTo] = useState('ft');
    
    // --- Finance State ---
    const [finType, setFinType] = useState('loan');
    const [finPrincipal, setFinPrincipal] = useState('10000');
    const [finRate, setFinRate] = useState('5');
    const [finTime, setFinTime] = useState('12'); // months
    
    // --- Programmer State ---
    const [progVal, setProgVal] = useState<number>(0); // Canonical Decimal Value
    const [progInput, setProgInput] = useState<string>("0"); // Current active input text
    const [progActiveBase, setProgActiveBase] = useState<number>(10); // Current active base being typed

    // --- Graphing State ---
    const [graphExpr, setGraphExpr] = useState('sin(x) * x');
    const graphRef = useRef<HTMLCanvasElement>(null);

    // --- Utility State ---
    const [utilType, setUtilType] = useState('bmi');
    const [bmiH, setBmiH] = useState('175');
    const [bmiW, setBmiW] = useState('70');
    const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
    const [date2, setDate2] = useState(new Date().toISOString().split('T')[0]);

    // --- Handlers ---
    const handleSciInput = (val: string) => {
        if (val === 'C') { setDisplay('0'); return; }
        if (val === 'DEL') { setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0'); return; }
        if (val === '=') {
            const res = evaluateExpression(display);
            setHistory(prev => [display + ' = ' + res, ...prev].slice(0, 10));
            setDisplay(res);
            return;
        }
        setDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
    };

    const convert = () => {
        const v = parseFloat(convVal);
        if (isNaN(v)) return '---';
        
        // Simple scaling factors (relative to base unit)
        const factors: any = {
            length: { m: 1, cm: 0.01, mm: 0.001, km: 1000, in: 0.0254, ft: 0.3048, mi: 1609.34, yd: 0.9144 },
            mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 },
            temp: { C: 'c', F: 'f', K: 'k' },
            data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }
        };

        if (convType === 'temp') {
            let cel = v;
            if (convFrom === 'F') cel = (v - 32) * 5/9;
            if (convFrom === 'K') cel = v - 273.15;
            
            if (convTo === 'C') return cel.toFixed(2);
            if (convTo === 'F') return (cel * 9/5 + 32).toFixed(2);
            if (convTo === 'K') return (cel + 273.15).toFixed(2);
        } else {
            const f = factors[convType];
            if (!f || !f[convFrom] || !f[convTo]) return '---';
            const base = v * f[convFrom];
            return (base / f[convTo]).toFixed(4);
        }
        return '---';
    };

    const calculateFinance = () => {
        const P = parseFloat(finPrincipal);
        const r = parseFloat(finRate) / 100 / 12;
        const n = parseFloat(finTime);
        if (isNaN(P) || isNaN(r) || isNaN(n)) return '---';

        if (finType === 'loan') {
            // EMI
            if (r === 0) return (P/n).toFixed(2);
            const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            return emi.toFixed(2);
        } else {
            // Compound Interest (Annual compounding approx)
            const amount = P * Math.pow(1 + parseFloat(finRate)/100, n/12);
            return amount.toFixed(2);
        }
    };

    const calculateBMI = () => {
        const h = parseFloat(bmiH) / 100; // cm to m
        const w = parseFloat(bmiW);
        if(!h || !w) return "---";
        return (w / (h*h)).toFixed(1);
    }

    const calculateDateDiff = () => {
        const d1 = new Date(date1).getTime();
        const d2 = new Date(date2).getTime();
        const diff = Math.abs(d2 - d1);
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days + " days";
    }

    // --- Programmer Logic ---
    const updateProgrammer = (valueStr: string, base: number) => {
        setProgInput(valueStr);
        setProgActiveBase(base);
        
        if (!valueStr.trim()) {
            setProgVal(0);
            return;
        }

        try {
            let expr = valueStr.toUpperCase();
            
            // Normalize keywords to operators
            expr = expr
                .replace(/\bAND\b/g, '&')
                .replace(/\bOR\b/g, '|')
                .replace(/\bXOR\b/g, '^')
                .replace(/\bNOT\b/g, '~')
                .replace(/\bMOD\b/g, '%')
                .replace(/<</g, '<<')
                .replace(/>>/g, '>>');

            // Tokenizer: Split by operators but keep them
            // Operators: + - * / % & | ^ ~ << >> ( )
            const tokens = expr.split(/([+\-*/%&|^~()]+|<<|>>)/);
            
            let evalStr = "";
            
            for (const token of tokens) {
                if (!token.trim()) continue;
                
                // If it is an operator
                if (/^([+\-*/%&|^~()]+|<<|>>)$/.test(token)) {
                    evalStr += token;
                } else {
                    // It must be a number in the current base
                    // We try to parse it. If it fails (e.g. typing "A" in binary), we skip evaluation
                    // but we still allow the user to type it (controlled by state).
                    const intVal = parseInt(token.trim(), base);
                    if (!isNaN(intVal)) {
                        evalStr += intVal;
                    } else {
                        throw new Error("Invalid digit for base");
                    }
                }
            }
            
            // Safe Eval
            // eslint-disable-next-line no-new-func
            const res = new Function('return ' + evalStr)();
            if (Number.isFinite(res)) {
                // Use unsigned shift to treat as 32-bit unsigned integer for display
                setProgVal(res >>> 0);
            }
        } catch (e) {
            // Partial expression or invalid syntax - ignore update to progVal
            // But state progInput is already updated so user sees what they type
        }
    };

    const handleProgBtnClick = (char: string) => {
        if (char === '=') {
            setProgInput(progVal.toString(progActiveBase).toUpperCase());
            return;
        }
        if (char === 'CLR') {
            setProgInput('0');
            setProgVal(0);
            return;
        }
        if (char === 'BS') {
            const newVal = progInput.length > 1 ? progInput.slice(0, -1) : '0';
            updateProgrammer(newVal, progActiveBase);
            return;
        }
        
        const isOp = ['+','-','*','/','AND','OR','XOR','MOD','<<','>>'].includes(char);
        const spacing = isOp ? ` ${char} ` : char;
        const newVal = progInput === '0' && !isOp ? char : progInput + spacing;
        
        updateProgrammer(newVal, progActiveBase);
    };

    const activateBase = (base: number) => {
        setProgActiveBase(base);
        setProgInput(progVal.toString(base).toUpperCase());
    };

    useEffect(() => {
        if (mode === 'graphing' && graphRef.current) {
            drawGraph(graphRef.current, graphExpr, 10);
        }
    }, [mode, graphExpr]);

    // --- Renderers ---

    const renderMenu = () => (
        <div className={`absolute left-0 top-0 bottom-0 w-64 bg-neutral-900/95 backdrop-blur-md border-r border-white/10 z-20 flex flex-col transition-transform duration-300 ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-blue-600/10">
                <span className="font-bold text-lg text-white">Calculator</span>
                <button onClick={() => setShowMenu(false)}><X className="text-neutral-400 hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {[
                    { id: 'scientific', icon: <Calculator size={18}/>, label: 'Scientific' },
                    { id: 'converter', icon: <ArrowRightLeft size={18}/>, label: 'Converter' },
                    { id: 'finance', icon: <DollarSign size={18}/>, label: 'Finance' },
                    { id: 'programmer', icon: <Binary size={18}/>, label: 'Programmer' },
                    { id: 'graphing', icon: <LineChart size={18}/>, label: 'Graphing' },
                    { id: 'tools', icon: <Box size={18}/>, label: 'Tools & Utilities' },
                ].map((m) => (
                    <button 
                        key={m.id}
                        onClick={() => { setMode(m.id as CalcMode); setShowMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${mode === m.id ? 'bg-blue-500/20 text-blue-100 border border-blue-500/10' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        {m.icon}
                        <span className="font-semibold">{m.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderScientific = () => (
        <div className="flex flex-col h-full bg-transparent">
            <div className="flex-1 bg-black/20 p-6 text-right flex flex-col justify-end break-words relative overflow-hidden">
                <div className="text-neutral-400 font-semibold text-sm mb-2 h-6">{history[0]}</div>
                <div className="text-5xl md:text-6xl font-light text-white font-mono tracking-tight">{display}</div>
            </div>
            <div className="bg-white/5 p-2 grid grid-cols-5 gap-1.5 h-[65%] border-t border-white/10 backdrop-blur-sm">
                {[
                    'sin', 'cos', 'tan', 'C', 'DEL',
                    'asin', 'acos', 'atan', '(', ')',
                    'sqrt', 'x^2', '1/x', '%', '/',
                    '7', '8', '9', '*', 'log',
                    '4', '5', '6', '-', 'ln',
                    '1', '2', '3', '+', 'e',
                    '0', '.', 'pi', '=', '^'
                ].map(btn => (
                    <button 
                        key={btn}
                        onClick={() => handleSciInput(btn === 'x^2' ? '^2' : btn)}
                        className={`rounded-lg text-lg font-bold transition-all active:scale-95 flex items-center justify-center border border-white/5 shadow-sm ${
                            btn === '=' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border-transparent' :
                            ['C', 'DEL'].includes(btn) ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border-red-500/20' :
                            ['/', '*', '-', '+'].includes(btn) ? 'bg-orange-500/20 text-orange-200 hover:bg-orange-500/30 border-orange-500/20' :
                            ['sin','cos','tan','log','ln','sqrt','^','(',')','asin','acos','atan','1/x','pi','e','x^2','%'].includes(btn) ? 'bg-black/40 text-neutral-400 hover:bg-black/50' :
                            'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        {btn === 'sqrt' ? '√' : btn}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderProgrammer = () => {
        return (
            <div className="p-6 flex flex-col h-full text-white bg-transparent overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-200"><Binary className="text-purple-300"/> Programmer</h2>
                
                <div className="space-y-3 mb-6">
                    {[
                        { label: 'HEX', base: 16, color: 'text-purple-300' },
                        { label: 'DEC', base: 10, color: 'text-blue-300' },
                        { label: 'OCT', base: 8, color: 'text-orange-300' },
                        { label: 'BIN', base: 2, color: 'text-green-300' },
                    ].map(item => {
                        const isActive = progActiveBase === item.base;
                        const value = isActive ? progInput : progVal.toString(item.base).toUpperCase();

                        return (
                            <div 
                                key={item.base} 
                                className={`p-3 rounded-xl border transition-colors flex items-center gap-4 ${isActive ? 'bg-white/10 border-blue-400/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                onClick={() => activateBase(item.base)}
                            >
                                <span className={`font-bold w-10 ${item.color}`}>{item.label}</span>
                                <input 
                                    className="flex-1 bg-transparent outline-none font-mono text-lg text-white placeholder:text-neutral-600 uppercase"
                                    value={value}
                                    onChange={(e) => updateProgrammer(e.target.value, item.base)}
                                    onFocus={() => activateBase(item.base)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setProgInput(progVal.toString(progActiveBase).toUpperCase());
                                        }
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-5 gap-2 flex-1">
                    {[
                        'A', 'B', 'C', '(', ')',
                        'D', 'E', 'F', '+', '-',
                        'AND', 'OR', 'XOR', '*', '/',
                        'NOT', '<<', '>>', '=', 'BS'
                    ].map(btn => (
                        <button
                            key={btn}
                            onClick={() => handleProgBtnClick(btn)}
                            className={`rounded-lg font-bold text-sm md:text-base py-3 transition-colors flex items-center justify-center shadow-sm border border-white/5 ${
                                ['=','BS'].includes(btn) ? 'bg-blue-600 hover:bg-blue-500 text-white' : 
                                ['A','B','C','D','E','F'].includes(btn) ? 'bg-black/40 text-purple-300 hover:bg-black/50 font-mono' :
                                ['AND','OR','XOR','NOT','<<','>>'].includes(btn) ? 'bg-black/40 text-orange-300 hover:bg-black/50 text-xs font-bold' :
                                'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                        >
                            {btn === 'BS' ? <Delete size={18}/> : btn}
                        </button>
                    ))}
                    
                    {/* Clear Button spans full width of last available spot if needed, or we just add a 5th col above */}
                     <button
                            onClick={() => handleProgBtnClick('CLR')}
                            className="col-span-full rounded-lg font-bold text-sm md:text-base py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/20 flex items-center justify-center"
                        >
                            Clear All
                    </button>
                </div>
            </div>
        );
    }

    const renderConverter = () => (
        <div className="p-6 flex flex-col h-full text-white bg-transparent">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-orange-200"><ArrowRightLeft/> Unit Converter</h2>
             <div className="flex gap-2 mb-6 bg-white/10 p-1 rounded-lg">
                {['length', 'mass', 'temp', 'data'].map(t => (
                    <button 
                        key={t} onClick={() => {
                            setConvType(t);
                            if(t === 'length') { setConvFrom('m'); setConvTo('ft'); }
                            if(t === 'mass') { setConvFrom('kg'); setConvTo('lb'); }
                            if(t === 'temp') { setConvFrom('C'); setConvTo('F'); }
                            if(t === 'data') { setConvFrom('MB'); setConvTo('GB'); }
                        }}
                        className={`flex-1 py-2 px-3 rounded capitalize text-sm font-bold transition-colors ${convType === t ? 'bg-white/20 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <div className="space-y-6">
                <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                    <label className="text-neutral-400 text-xs font-bold uppercase mb-2 block">From</label>
                    <div className="flex gap-2">
                        <input type="number" value={convVal} onChange={e => setConvVal(e.target.value)} className="flex-1 bg-transparent border-b border-white/20 p-2 text-xl font-bold outline-none focus:border-blue-400 text-white"/>
                        <select value={convFrom} onChange={e => setConvFrom(e.target.value)} className="bg-white/10 rounded p-2 text-white outline-none border border-white/10 font-bold">
                            {convType === 'length' && ['m','cm','mm','km','in','ft','mi','yd'].map(u => <option key={u} className="text-black">{u}</option>)}
                            {convType === 'mass' && ['kg','g','mg','lb','oz'].map(u => <option key={u} className="text-black">{u}</option>)}
                            {convType === 'temp' && ['C','F','K'].map(u => <option key={u} className="text-black">{u}</option>)}
                            {convType === 'data' && ['B','KB','MB','GB','TB'].map(u => <option key={u} className="text-black">{u}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                    <label className="text-neutral-400 text-xs font-bold uppercase mb-2 block">To</label>
                    <div className="flex gap-2">
                        <div className="flex-1 border-b border-white/20 p-2 text-xl font-bold text-blue-200">{convert()}</div>
                        <select value={convTo} onChange={e => setConvTo(e.target.value)} className="bg-white/10 rounded p-2 text-white outline-none border border-white/10 font-bold">
                             {convType === 'length' && ['m','cm','mm','km','in','ft','mi','yd'].map(u => <option key={u} className="text-black">{u}</option>)}
                            {convType === 'mass' && ['kg','g','mg','lb','oz'].map(u => <option key={u} className="text-black">{u}</option>)}
                            {convType === 'temp' && ['C','F','K'].map(u => <option key={u} className="text-black">{u}</option>)}
                            {convType === 'data' && ['B','KB','MB','GB','TB'].map(u => <option key={u} className="text-black">{u}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFinance = () => (
        <div className="p-6 flex flex-col h-full text-white bg-transparent">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-300"><DollarSign/> Finance</h2>
             <div className="space-y-4">
                {['Principal', 'Rate', 'Time'].map((label, i) => (
                    <div key={label}>
                        <label className="text-neutral-400 text-xs font-bold uppercase mb-1 block">{label}</label>
                        <input type="number" 
                            value={i===0 ? finPrincipal : i===1 ? finRate : finTime}
                            onChange={e => i===0 ? setFinPrincipal(e.target.value) : i===1 ? setFinRate(e.target.value) : setFinTime(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded p-3 text-white outline-none focus:border-green-400/50" 
                        />
                    </div>
                ))}
                 <div className="mt-6 p-6 bg-green-900/20 border border-green-500/30 rounded-xl text-center shadow-lg">
                    <span className="text-sm text-green-300 font-bold uppercase tracking-wider">Result</span>
                    <div className="text-4xl font-bold text-white mt-2">${calculateFinance()}</div>
                </div>
             </div>
        </div>
    );

    const renderGraphing = () => (
         <div className="flex flex-col h-full text-white bg-transparent">
            <div className="p-3 border-b border-white/10 flex gap-2 items-center bg-black/20">
                <FunctionSquare className="text-blue-300" size={20} />
                <span className="font-mono font-bold text-neutral-300">f(x) =</span>
                <input 
                    className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-1.5 font-mono text-sm outline-none focus:border-blue-400/50 text-white font-bold"
                    value={graphExpr}
                    onChange={e => setGraphExpr(e.target.value)}
                />
            </div>
            <div className="flex-1 relative bg-transparent flex items-center justify-center overflow-hidden">
                <canvas ref={graphRef} width={800} height={600} className="w-full h-full object-contain" />
            </div>
         </div>
    );

     const renderTools = () => (
        <div className="p-6 text-white h-full overflow-y-auto bg-transparent">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-200"><Box/> Tools</h2>
             <div className="flex gap-2 mb-6 bg-white/10 p-1 rounded-lg border border-white/10">
                <button onClick={() => setUtilType('bmi')} className={`flex-1 py-2 rounded text-sm font-bold ${utilType === 'bmi' ? 'bg-white/10 text-white' : 'text-neutral-400'}`}>BMI</button>
                <button onClick={() => setUtilType('date')} className={`flex-1 py-2 rounded text-sm font-bold ${utilType === 'date' ? 'bg-white/10 text-white' : 'text-neutral-400'}`}>Date Diff</button>
             </div>
             {utilType === 'bmi' && (
                 <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                     <div className="flex justify-between items-center">
                         <span className="text-neutral-400 font-bold">BMI Result</span>
                         <span className="text-2xl font-bold text-white">{calculateBMI()}</span>
                     </div>
                     <div className="mt-4 flex gap-2">
                         <input type="number" placeholder="Height (cm)" value={bmiH} onChange={e => setBmiH(e.target.value)} className="w-1/2 bg-white/5 rounded p-2 text-white border border-white/10"/>
                         <input type="number" placeholder="Weight (kg)" value={bmiW} onChange={e => setBmiW(e.target.value)} className="w-1/2 bg-white/5 rounded p-2 text-white border border-white/10"/>
                     </div>
                 </div>
             )}
              {utilType === 'date' && (
                 <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                     <div className="flex justify-between items-center">
                         <span className="text-neutral-400 font-bold">Difference</span>
                         <span className="text-2xl font-bold text-white">{calculateDateDiff()}</span>
                     </div>
                      <div className="space-y-3 mt-4">
                            <input type="date" value={date1} onChange={e => setDate1(e.target.value)} className="w-full bg-white/5 rounded p-2 border border-white/10 text-white" />
                            <input type="date" value={date2} onChange={e => setDate2(e.target.value)} className="w-full bg-white/5 rounded p-2 border border-white/10 text-white" />
                        </div>
                 </div>
             )}
        </div>
    );

    return (
        <div className="h-full flex flex-col relative overflow-hidden text-sm md:text-base bg-transparent text-white font-sans">
            {/* Header / Mode Switcher */}
            <div className="h-10 bg-white/5 flex items-center px-4 justify-between border-b border-white/10 shrink-0 z-30 backdrop-blur-md">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition-colors">
                    <Menu size={18} />
                </button>
                <span className="font-bold text-white capitalize text-sm">{mode} Mode</span>
                <div className="w-8"></div> 
            </div>

            {/* Side Menu */}
            {renderMenu()}

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden bg-transparent">
                {mode === 'scientific' && renderScientific()}
                {mode === 'converter' && renderConverter()}
                {mode === 'finance' && renderFinance()}
                {mode === 'programmer' && renderProgrammer()}
                {mode === 'graphing' && renderGraphing()}
                {mode === 'tools' && renderTools()}
            </div>
        </div>
    );
};
