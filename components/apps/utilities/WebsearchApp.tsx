
import React, { useState, useRef, useEffect } from 'react';
import { performWebSearch } from '../../../services/geminiService';
import { Search, ArrowLeft, RotateCw, Globe, ExternalLink, X, Lock } from 'lucide-react';

interface Source {
    uri: string;
    title: string;
}

interface Message {
    role: 'user' | 'model';
    text: string;
    sources?: Source[];
}

export const WebsearchApp = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Hello! I am your AI Search Assistant. Ask me anything, and I can browse the web for you.' }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeUrl, setActiveUrl] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        const result = await performWebSearch(input);
        
        const modelMsg: Message = { 
            role: 'model', 
            text: result.text,
            sources: result.sources
        };

        setMessages(prev => [...prev, modelMsg]);
        setIsLoading(false);
    };

    const navigateTo = (url: string) => {
        setActiveUrl(url);
        setUrlInput(url);
    };

    const handleBrowserNavigate = (e: React.FormEvent) => {
        e.preventDefault();
        let url = urlInput;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        navigateTo(url);
    };

    const closeBrowser = () => {
        setActiveUrl(null);
        setUrlInput("");
    };

    // --- Browser View ---
    if (activeUrl) {
        return (
            <div className="flex flex-col h-full bg-neutral-900/50 text-neutral-200">
                {/* Browser Toolbar */}
                <div className="h-10 bg-black/20 border-b border-white/5 flex items-center px-2 gap-2">
                    <button onClick={closeBrowser} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-neutral-400">
                        <ArrowLeft size={16} />
                    </button>
                    <button onClick={() => { const u = activeUrl; setActiveUrl(null); setTimeout(() => setActiveUrl(u), 10); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-neutral-400">
                        <RotateCw size={14} />
                    </button>
                    
                    <form onSubmit={handleBrowserNavigate} className="flex-1 flex items-center relative">
                        <Lock size={10} className="absolute left-3 text-green-400/70" />
                        <input 
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            className="w-full h-7 pl-8 pr-4 bg-black/30 border border-white/5 rounded-full text-xs text-neutral-300 outline-none focus:border-blue-400/50 transition-colors shadow-inner"
                        />
                    </form>

                    <button 
                        onClick={() => window.open(activeUrl, '_blank')}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-blue-300/80" 
                        title="Open in real browser"
                    >
                        <ExternalLink size={16} />
                    </button>
                </div>

                {/* Web Content */}
                <div className="flex-1 relative bg-white">
                    <iframe 
                        src={activeUrl} 
                        className="w-full h-full border-none"
                        title="In-app Browser"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        onError={() => alert("Could not load this website. It might block embedding.")}
                    />
                </div>
            </div>
        );
    }

    // --- Chat View ---
    return (
        <div className="flex flex-col h-full bg-transparent text-neutral-200 font-sans">
            {/* Header */}
            <div className="p-3 bg-white/5 border-b border-white/5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-300 border border-blue-400/20">
                    <Globe size={16} />
                </div>
                <div>
                    <h2 className="font-bold text-sm text-neutral-200">Web Search</h2>
                    <p className="text-[10px] text-neutral-500">Powered by Gemini & Google Search</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div 
                            className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-sm border ${
                                msg.role === 'user' 
                                    ? 'bg-blue-400/20 border-blue-400/10 text-blue-100 rounded-br-none' 
                                    : 'bg-white/5 border-white/5 text-neutral-300 rounded-bl-none'
                            }`}
                        >
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>

                        {/* Citations / Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2 ml-2 max-w-[90%] flex flex-wrap gap-2">
                                {msg.sources.map((source, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => navigateTo(source.uri)}
                                        className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors group max-w-full"
                                    >
                                        <div className="w-5 h-5 rounded bg-black/20 flex items-center justify-center text-neutral-400 text-[10px] font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col items-start overflow-hidden text-left">
                                            <span className="text-[11px] font-medium text-neutral-300 truncate w-full group-hover:text-blue-300">{source.title}</span>
                                            <span className="text-[9px] text-neutral-500 truncate w-full">{new URL(source.uri).hostname}</span>
                                        </div>
                                        <ExternalLink size={10} className="text-neutral-500 opacity-0 group-hover:opacity-100 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start">
                         <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-none border border-white/5 flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-200"></span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black/10 border-t border-white/5">
                <form onSubmit={handleSearch} className="relative">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask anything..."
                        className="w-full pl-4 pr-10 py-3 bg-black/30 border border-white/5 focus:border-blue-400/30 rounded-xl outline-none transition-all shadow-inner text-sm text-neutral-200 placeholder:text-neutral-600"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-white/10 text-neutral-300 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Search size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};
