
import React, { useState } from 'react';
import { Wand2, Image as ImageIcon, Save } from 'lucide-react';
import { generateImageDescription } from '../../../services/geminiService';
import { saveFile } from '../../../services/fileSystem';

export const AIStudioApp = () => {
    const [prompt, setPrompt] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGen = async () => {
        if(!prompt) return;
        setLoading(true);
        const res = await generateImageDescription(prompt);
        setImage(res);
        setLoading(false);
    }

    const handleSave = async () => {
        if (!image) return;
        try {
            // Convert Base64/DataURL to Blob/File
            const arr = image.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            const file = new File([u8arr], `AI_Gen_${Date.now()}.png`, {type:mime});
            
            await saveFile(file, '/Images');
            alert("Image saved to /Images in Files App");
        } catch (e) {
            console.error("Failed to save", e);
            alert("Failed to save image");
        }
    };

    return (
        <div className="h-full flex flex-col p-4 bg-transparent text-neutral-200">
            <div className="flex items-center gap-2 mb-4 text-pink-300">
                <Wand2 />
                <h2 className="font-bold text-lg">AI Studio</h2>
            </div>
            <div className="flex gap-2 mb-4">
                <input 
                    className="flex-1 bg-black/20 border border-white/5 rounded p-2 text-sm outline-none focus:border-pink-400/50 backdrop-blur-sm text-neutral-200 placeholder:text-neutral-600" 
                    placeholder="Describe an image to generate..."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGen()}
                />
                <button 
                    onClick={handleGen} 
                    disabled={loading}
                    className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/20 px-4 py-2 rounded font-medium disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Thinking...' : 'Generate'}
                </button>
            </div>
            <div className="flex-1 bg-black/20 rounded border border-white/5 flex items-center justify-center overflow-hidden relative flex-col">
                {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div></div>}
                {image ? (
                    <>
                        <img src={image} alt="Generated" className="max-w-full max-h-[80%] object-contain mb-4 border border-white/5 rounded" />
                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-neutral-200 transition-colors">
                            <Save size={16} /> Save to Gallery
                        </button>
                    </>
                ) : (
                    <div className="text-neutral-500 text-center">
                        <ImageIcon className="mx-auto mb-2 opacity-50" size={48} />
                        <p>Enter a prompt to start creating.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
