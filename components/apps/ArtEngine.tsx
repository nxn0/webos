
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Brush, Eraser, Layers, Download, Upload, Plus, Trash2, Eye, EyeOff, 
  Undo2, Redo2, Palette, Settings, Image as ImageIcon,
  MoreVertical, ChevronDown, ChevronRight, Move, PaintBucket, Pipette,
  Maximize, Minimize, Save, FileImage, MousePointer2, Scissors, Copy,
  Check, X, FolderOpen, PenTool, Sliders, Menu
} from 'lucide-react';
import { saveFile, listFiles, getFile, FSItem } from '../../services/fileSystem';

// --- Types & Interfaces ---

interface Point { x: number; y: number; pressure: number; }

interface BrushSettings {
  id: string;
  name: string;
  size: number;
  opacity: number; // 0-1
  flow: number; // 0-1, affects density per step
  hardness: number; // 0-1
  spacing: number; // 0.05 - 1.0 (fraction of size)
  smoothing: number; // 0-20
  blendMode: GlobalCompositeOperation;
  shape: 'circle' | 'square' | 'calligraphy';
  scatter: number; // 0-100
  isEraser: boolean;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  canvas: HTMLCanvasElement;
}

interface HistoryState {
    layerId: string;
    imageData: ImageData;
    previousImageData: ImageData;
}

// --- Constants ---

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const BLEND_MODES: GlobalCompositeOperation[] = [
    'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 
    'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

const BRUSH_PRESETS: BrushSettings[] = [
    { id: 'pencil', name: 'Pencil (HB)', size: 3, opacity: 0.9, flow: 1, hardness: 0.8, spacing: 0.1, smoothing: 2, blendMode: 'source-over', shape: 'circle', scatter: 0, isEraser: false },
    { id: 'pen', name: 'Ink Pen', size: 4, opacity: 1, flow: 1, hardness: 1, spacing: 0.05, smoothing: 5, blendMode: 'source-over', shape: 'circle', scatter: 0, isEraser: false },
    { id: 'marker', name: 'Marker', size: 15, opacity: 0.5, flow: 1, hardness: 0.9, spacing: 0.1, smoothing: 3, blendMode: 'multiply', shape: 'square', scatter: 0, isEraser: false },
    { id: 'airbrush', name: 'Airbrush', size: 80, opacity: 0.3, flow: 0.1, hardness: 0, spacing: 0.1, smoothing: 5, blendMode: 'source-over', shape: 'circle', scatter: 0, isEraser: false },
    { id: 'calligraphy', name: 'Calligraphy', size: 10, opacity: 1, flow: 1, hardness: 1, spacing: 0.05, smoothing: 8, blendMode: 'source-over', shape: 'calligraphy', scatter: 0, isEraser: false },
    { id: 'watercolor', name: 'Watercolor', size: 50, opacity: 0.2, flow: 0.1, hardness: 0.2, spacing: 0.2, smoothing: 3, blendMode: 'multiply', shape: 'circle', scatter: 2, isEraser: false },
    { id: 'oil', name: 'Oil Paint', size: 30, opacity: 1, flow: 0.8, hardness: 0.6, spacing: 0.05, smoothing: 4, blendMode: 'source-over', shape: 'circle', scatter: 0, isEraser: false },
    { id: 'spray', name: 'Spray Can', size: 60, opacity: 0.8, flow: 0.2, hardness: 0, spacing: 0.05, smoothing: 0, blendMode: 'source-over', shape: 'circle', scatter: 30, isEraser: false },
    { id: 'chalk', name: 'Chalk', size: 20, opacity: 0.9, flow: 0.5, hardness: 0.8, spacing: 0.4, smoothing: 1, blendMode: 'source-over', shape: 'square', scatter: 5, isEraser: false },
    { id: 'charcoal', name: 'Charcoal', size: 25, opacity: 0.7, flow: 0.4, hardness: 0.4, spacing: 0.2, smoothing: 1, blendMode: 'darken', shape: 'circle', scatter: 10, isEraser: false },
    { id: 'highlighter', name: 'Highlighter', size: 25, opacity: 0.4, flow: 1, hardness: 0, spacing: 0.1, smoothing: 4, blendMode: 'multiply', shape: 'square', scatter: 0, isEraser: false },
    { id: 'pixel', name: 'Pixel Art', size: 1, opacity: 1, flow: 1, hardness: 1, spacing: 1, smoothing: 0, blendMode: 'source-over', shape: 'square', scatter: 0, isEraser: false },
    { id: 'eraser_hard', name: 'Eraser (Hard)', size: 20, opacity: 1, flow: 1, hardness: 1, spacing: 0.1, smoothing: 0, blendMode: 'destination-out', shape: 'circle', scatter: 0, isEraser: true },
    { id: 'eraser_soft', name: 'Eraser (Soft)', size: 50, opacity: 0.5, flow: 0.5, hardness: 0, spacing: 0.1, smoothing: 2, blendMode: 'destination-out', shape: 'circle', scatter: 0, isEraser: true },
    { id: 'blender', name: 'Soft Blender', size: 100, opacity: 0.1, flow: 0.1, hardness: 0, spacing: 0.5, smoothing: 0, blendMode: 'overlay', shape: 'circle', scatter: 0, isEraser: false },
    { id: 'noise', name: 'Noise Texture', size: 40, opacity: 0.5, flow: 0.5, hardness: 0.5, spacing: 0.5, smoothing: 0, blendMode: 'overlay', shape: 'circle', scatter: 50, isEraser: false },
    { id: 'stars', name: 'Stars', size: 15, opacity: 1, flow: 1, hardness: 1, spacing: 2.0, smoothing: 0, blendMode: 'screen', shape: 'circle', scatter: 100, isEraser: false },
    { id: 'clouds', name: 'Clouds', size: 120, opacity: 0.2, flow: 0.1, hardness: 0, spacing: 0.5, smoothing: 5, blendMode: 'lighten', shape: 'circle', scatter: 20, isEraser: false },
    { id: 'grass', name: 'Grass', size: 10, opacity: 0.8, flow: 0.8, hardness: 0.5, spacing: 0.2, smoothing: 2, blendMode: 'source-over', shape: 'calligraphy', scatter: 15, isEraser: false },
    { id: 'details', name: 'Fine Details', size: 1, opacity: 0.8, flow: 1, hardness: 1, spacing: 0.1, smoothing: 10, blendMode: 'source-over', shape: 'circle', scatter: 0, isEraser: false },
];

// --- Helper Functions ---

const createLayerCanvas = (width: number, height: number): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
};

const copyCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
    const c = createLayerCanvas(source.width, source.height);
    c.getContext('2d')!.drawImage(source, 0, 0);
    return c;
};

const distance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
const angle = (p1: Point, p2: Point) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

// --- Component ---

export const ArtEngine = () => {
    // --- State ---
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Brush State
    const [currentBrush, setCurrentBrush] = useState<BrushSettings>(BRUSH_PRESETS[0]);
    const [primaryColor, setPrimaryColor] = useState('#000000');
    const [tool, setTool] = useState<'brush' | 'move' | 'fill' | 'picker'>('brush');
    
    // UI State
    const [showLayers, setShowLayers] = useState(true);
    const [showBrushSettings, setShowBrushSettings] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [fileModalOpen, setFileModalOpen] = useState(false);
    const [virtualFiles, setVirtualFiles] = useState<FSItem[]>([]);
    
    // Mobile Specific State
    const [mobilePanel, setMobilePanel] = useState<'none' | 'tools' | 'properties' | 'layers' | 'actions'>('none');

    // Refs for Drawing Engine (Mutable state for performance)
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const layerCanvasRefs = useRef<Record<string, HTMLCanvasElement>>({});
    
    // Stable Refs for drawing loop access
    const stateRef = useRef({
        layers,
        activeLayerId,
        currentBrush,
        primaryColor,
        tool,
        zoom,
        pan
    });

    // Update stateRef whenever relevant state changes
    useEffect(() => {
        stateRef.current = { layers, activeLayerId, currentBrush, primaryColor, tool, zoom, pan };
    }, [layers, activeLayerId, currentBrush, primaryColor, tool, zoom, pan]);

    const isDrawing = useRef(false);
    const lastPos = useRef<Point | null>(null);
    const smoothedPos = useRef<Point | null>(null);
    const requestRef = useRef<number | null>(null);
    
    // --- Initialization ---

    useEffect(() => {
        // Initialize with background layer if empty
        if (layers.length === 0) {
            const bgCanvas = createLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            const ctx = bgCanvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            const bgLayer: Layer = {
                id: 'layer-bg',
                name: 'Background',
                visible: true,
                opacity: 1,
                blendMode: 'source-over',
                canvas: bgCanvas
            };
            
            const layer1Canvas = createLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            const layer1: Layer = {
                id: 'layer-1',
                name: 'Layer 1',
                visible: true,
                opacity: 1,
                blendMode: 'source-over',
                canvas: layer1Canvas
            };

            setLayers([bgLayer, layer1]);
            setActiveLayerId(layer1.id);
        }
    }, [layers.length]);

    // --- History System ---

    const recordHistoryStep = (layerId: string, preImageData: ImageData) => {
        const layer = stateRef.current.layers.find(l => l.id === layerId);
        if(!layer) return;
        const ctx = layer.canvas.getContext('2d')!;
        const postImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const step: HistoryState = {
            layerId,
            previousImageData: preImageData,
            imageData: postImageData
        };

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(step);
        if (newHistory.length > 20) newHistory.shift(); // Limit history

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }

    const undo = () => {
        if (historyIndex < 0) return;
        const step = history[historyIndex];
        const layer = layers.find(l => l.id === step.layerId);
        if (layer) {
            const ctx = layer.canvas.getContext('2d')!;
            ctx.putImageData(step.previousImageData, 0, 0);
            
            // Update Visuals
            const visCanvas = layerCanvasRefs.current[layer.id];
            if (visCanvas) {
                const visCtx = visCanvas.getContext('2d')!;
                visCtx.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
                visCtx.drawImage(layer.canvas, 0, 0);
            }
            setLayers([...layers]);
        }
        setHistoryIndex(historyIndex - 1);
    };

    const redo = () => {
        if (historyIndex >= history.length - 1) return;
        const step = history[historyIndex + 1];
        const layer = layers.find(l => l.id === step.layerId);
        if (layer) {
            const ctx = layer.canvas.getContext('2d')!;
            ctx.putImageData(step.imageData, 0, 0);

            // Update Visuals
            const visCanvas = layerCanvasRefs.current[layer.id];
            if (visCanvas) {
                const visCtx = visCanvas.getContext('2d')!;
                visCtx.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
                visCtx.drawImage(layer.canvas, 0, 0);
            }
            setLayers([...layers]);
        }
        setHistoryIndex(historyIndex + 1);
    };

    // --- Drawing Logic ---

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
        const container = mainCanvasRef.current;
        if (!container) return { x: 0, y: 0, pressure: 0.5 };
        
        const rect = container.getBoundingClientRect();
        let clientX, clientY, force = 0.5;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            force = (e.touches[0] as any).force || 0.5;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        // Calculate scaling factor between visual size and internal canvas size
        // This robustly handles zoom, flex shrinking, and transforms
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
            pressure: force
        };
    };

    const drawBrushPoint = (ctx: CanvasRenderingContext2D, p: Point, settings: BrushSettings, color: string) => {
        ctx.globalCompositeOperation = settings.isEraser ? 'destination-out' : settings.blendMode;
        ctx.globalAlpha = settings.opacity * settings.flow;
        
        // Scatter
        let dx = 0, dy = 0;
        if (settings.scatter > 0) {
            const r = settings.size * (settings.scatter / 100);
            dx = (Math.random() - 0.5) * r;
            dy = (Math.random() - 0.5) * r;
        }

        const x = p.x + dx;
        const y = p.y + dy;
        const size = settings.size * (settings.id === 'pencil' || settings.id === 'pen' ? 1 : p.pressure); // Pressure sensitivity

        ctx.fillStyle = color;
        ctx.beginPath();
        
        if (settings.shape === 'square') {
            ctx.fillRect(x - size/2, y - size/2, size, size);
        } else if (settings.shape === 'calligraphy') {
            ctx.ellipse(x, y, size/2, size/8, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Circle / Default
            if (settings.hardness < 1) {
                const grad = ctx.createRadialGradient(x, y, 0, x, y, size/2);
                grad.addColorStop(0, color);
                grad.addColorStop(settings.hardness, color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(x - size/2, y - size/2, size, size);
            } else {
                ctx.arc(x, y, size/2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    // Interpolated drawing
    const drawStroke = (ctx: CanvasRenderingContext2D, p1: Point, p2: Point, settings: BrushSettings, color: string) => {
        const dist = distance(p1, p2);
        const ang = angle(p1, p2);
        const stepSize = Math.max(0.5, settings.size * settings.spacing); // Smaller steps for smoother lines
        
        // Always draw at least once
        if (dist < stepSize) {
             drawBrushPoint(ctx, p2, settings, color);
             return;
        }

        for (let i = 0; i < dist; i += stepSize) {
            const t = i / dist;
            const x = p1.x + Math.cos(ang) * i;
            const y = p1.y + Math.sin(ang) * i;
            // Linear interpolate pressure
            const pressure = p1.pressure * (1 - t) + p2.pressure * t;
            drawBrushPoint(ctx, { x, y, pressure }, settings, color);
        }
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { tool, activeLayerId, layers, primaryColor } = stateRef.current;

        if (tool !== 'brush' && tool !== 'move' && tool !== 'fill' && tool !== 'picker') return;
        if ('button' in e && e.button === 2) return; // Right click ignore

        const p = getCanvasPoint(e);

        // Tools Handling
        if (tool === 'picker') {
            const layer = layers.find(l => l.id === activeLayerId);
            if(layer) {
                const ctx = layer.canvas.getContext('2d')!;
                const pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
                const hex = "#" + ((1 << 24) | (pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16).slice(1);
                setPrimaryColor(hex);
                setTool('brush');
            }
            return;
        }

        if (tool === 'fill') {
            const layer = layers.find(l => l.id === activeLayerId);
            if(layer) {
                // Save state for undo
                const ctx = layer.canvas.getContext('2d')!;
                const pre = ctx.getImageData(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
                
                ctx.fillStyle = primaryColor;
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
                ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT); 
                
                // Update visuals
                const visCanvas = layerCanvasRefs.current[layer.id];
                if (visCanvas) {
                    const visCtx = visCanvas.getContext('2d')!;
                    visCtx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
                    visCtx.drawImage(layer.canvas, 0, 0);
                }

                recordHistoryStep(layer.id, pre);
                setLayers([...layers]); // Trigger render to update thumbnail if we had one
            }
            return;
        }

        // Brush Start
        if (tool === 'brush') {
            isDrawing.current = true;
            lastPos.current = p;
            smoothedPos.current = p;

            // Snapshot for undo
            const layer = layers.find(l => l.id === activeLayerId);
            if (layer) {
                const ctx = layer.canvas.getContext('2d')!;
                // Store PRE-drawing state attached to the layer object temporarily
                (layer as any)._preStrokeData = ctx.getImageData(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            
            // Start Loop
            if (!requestRef.current) {
                requestRef.current = requestAnimationFrame(drawTick);
            }
        } else if (tool === 'move') {
             isDrawing.current = true;
             lastPos.current = p;
        }
    };

    const drawTick = () => {
        if (!isDrawing.current) {
            requestRef.current = null;
            return;
        }

        const { activeLayerId, layers, currentBrush, primaryColor, tool } = stateRef.current;
        const layer = layers.find(l => l.id === activeLayerId);

        if (layer && lastPos.current && smoothedPos.current && tool === 'brush') {
            const ctx = layer.canvas.getContext('2d')!;
            
            // Stabilizer math
            const target = lastPos.current;
            const current = smoothedPos.current;
            const smoothing = Math.max(1, currentBrush.smoothing);
            
            const next = {
                x: current.x + (target.x - current.x) / smoothing,
                y: current.y + (target.y - current.y) / smoothing,
                pressure: target.pressure
            };

            // Draw to offscreen canvas (Data)
            drawStroke(ctx, current, next, currentBrush, primaryColor);

            // Sync to On-Screen Canvas (Visual) - Direct Manipulation
            const visCanvas = layerCanvasRefs.current[layer.id];
            if (visCanvas) {
                const visCtx = visCanvas.getContext('2d')!;
                visCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                visCtx.drawImage(layer.canvas, 0, 0);
            }

            smoothedPos.current = next;
        }

        requestRef.current = requestAnimationFrame(drawTick);
    };

    const handlePointerMove = (e: any) => {
        const p = getCanvasPoint(e);
        const { tool, zoom } = stateRef.current;

        // Move Tool (Pan)
        if (tool === 'move' && isDrawing.current) {
             const rect = mainCanvasRef.current?.getBoundingClientRect();
             if (rect) {
                 // movementX/Y are screen pixels, we just add them to pan
                 setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
             }
             return;
        }

        if (isDrawing.current) {
            lastPos.current = p;
        }
    };

    const stopDrawing = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        if (requestRef.current !== null) {
             cancelAnimationFrame(requestRef.current);
             requestRef.current = null;
        }
        
        const { activeLayerId, layers } = stateRef.current;
        const layer = layers.find(l => l.id === activeLayerId);
        
        // Save History
        if (layer && (layer as any)._preStrokeData) {
            recordHistoryStep(layer.id, (layer as any)._preStrokeData);
            delete (layer as any)._preStrokeData;
        }
    };

    // --- Layer Management ---

    const addLayer = () => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            name: `Layer ${layers.length + 1}`,
            visible: true,
            opacity: 1,
            blendMode: 'source-over',
            canvas: createLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
        };
        setLayers([newLayer, ...layers]);
        setActiveLayerId(newLayer.id);
    };

    const deleteLayer = (id: string) => {
        if (layers.length <= 1) return;
        const newLayers = layers.filter(l => l.id !== id);
        setLayers(newLayers);
        if (activeLayerId === id) setActiveLayerId(newLayers[0].id);
    };

    const duplicateLayer = (id: string) => {
        const source = layers.find(l => l.id === id);
        if (!source) return;
        
        const newCanvas = copyCanvas(source.canvas);
        const newLayer: Layer = {
            ...source,
            id: `layer-${Date.now()}`,
            name: `${source.name} Copy`,
            canvas: newCanvas
        };
        setLayers([newLayer, ...layers]);
    };

    const mergeDown = (index: number) => {
        if (index >= layers.length - 1) return;
        const top = layers[index];
        const bottom = layers[index + 1];
        
        const ctx = bottom.canvas.getContext('2d')!;
        ctx.globalAlpha = top.opacity;
        ctx.globalCompositeOperation = top.blendMode;
        ctx.drawImage(top.canvas, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        
        // Update bottom visual
        const visCanvas = layerCanvasRefs.current[bottom.id];
        if (visCanvas) {
             const visCtx = visCanvas.getContext('2d')!;
             visCtx.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
             visCtx.drawImage(bottom.canvas, 0, 0);
        }

        const newLayers = layers.filter(l => l.id !== top.id);
        setLayers(newLayers);
        setActiveLayerId(bottom.id);
    };

    // --- File Operations ---

    const handleExport = async () => {
        const finalCanvas = createLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        const ctx = finalCanvas.getContext('2d')!;
        
        // Composite
        [...layers].reverse().forEach(layer => {
            if (!layer.visible) return;
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode;
            ctx.drawImage(layer.canvas, 0, 0);
        });
        
        finalCanvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], `artwork_${Date.now()}.png`, { type: 'image/png' });
                await saveFile(file, '/Images');
                alert('Saved to /Images in File System');
            }
        });
    };

    const handleImportImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const newLayer: Layer = {
                id: `layer-${Date.now()}`,
                name: file.name,
                visible: true,
                opacity: 1,
                blendMode: 'source-over',
                canvas: createLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
            };
            const ctx = newLayer.canvas.getContext('2d')!;
            const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (CANVAS_WIDTH - w)/2, (CANVAS_HEIGHT - h)/2, w, h);
            
            setLayers([newLayer, ...layers]);
            setActiveLayerId(newLayer.id);
        };
    };

    const loadVirtualFiles = async () => {
        try {
            const files = await listFiles('/Images');
            const imgFiles = files.filter(f => f.mimeType?.startsWith('image/'));
            setVirtualFiles(imgFiles);
            setFileModalOpen(true);
        } catch (e) { console.error(e); }
    };

    const importVirtualFile = async (item: FSItem) => {
        if (!item.content) return;
        const img = new Image();
        img.src = URL.createObjectURL(item.content);
        img.onload = () => {
             const newLayer: Layer = {
                id: `layer-${Date.now()}`,
                name: item.name,
                visible: true,
                opacity: 1,
                blendMode: 'source-over',
                canvas: createLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
            };
            const ctx = newLayer.canvas.getContext('2d')!;
            const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (CANVAS_WIDTH - w)/2, (CANVAS_HEIGHT - h)/2, w, h);
            setLayers([newLayer, ...layers]);
            setActiveLayerId(newLayer.id);
            setFileModalOpen(false);
        };
    }

    // --- Render ---

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-neutral-200 select-none overflow-hidden font-sans">
            
            {/* Desktop Top Toolbar - Hidden on Mobile */}
            <div className="hidden md:flex h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] items-center px-4 gap-4 z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <Brush size={18} className="text-blue-400" />
                    <span className="font-bold text-sm hidden md:block">ArtEngine Pro</span>
                </div>
                
                <div className="h-6 w-px bg-white/10 mx-2"></div>
                
                <div className="flex items-center gap-1">
                    <button onClick={undo} disabled={historyIndex < 0} className="p-2 hover:bg-white/10 rounded disabled:opacity-30"><Undo2 size={16}/></button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-white/10 rounded disabled:opacity-30"><Redo2 size={16}/></button>
                </div>

                <div className="h-6 w-px bg-white/10 mx-2"></div>

                {/* Brush Quick Settings */}
                <div className="flex items-center gap-4 flex-1 overflow-x-auto no-scrollbar">
                     <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded">
                         <span className="text-xs text-neutral-400">Size</span>
                         <input type="range" min="1" max="200" value={currentBrush.size} onChange={e => setCurrentBrush({...currentBrush, size: Number(e.target.value)})} className="w-24 h-1 accent-blue-500" />
                         <span className="text-xs w-6">{currentBrush.size}</span>
                     </div>
                     <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded">
                         <span className="text-xs text-neutral-400">Opacity</span>
                         <input type="range" min="0" max="1" step="0.01" value={currentBrush.opacity} onChange={e => setCurrentBrush({...currentBrush, opacity: Number(e.target.value)})} className="w-24 h-1 accent-blue-500" />
                         <span className="text-xs w-8">{Math.round(currentBrush.opacity * 100)}%</span>
                     </div>
                     <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded">
                         <span className="text-xs text-neutral-400">Smooth</span>
                         <input type="range" min="0" max="20" value={currentBrush.smoothing} onChange={e => setCurrentBrush({...currentBrush, smoothing: Number(e.target.value)})} className="w-16 h-1 accent-blue-500" />
                     </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={loadVirtualFiles} className="p-2 hover:bg-white/10 rounded text-neutral-300" title="Import from FS"><FolderOpen size={18}/></button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold transition-colors"><Download size={14}/> Export</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Desktop Left Toolbar - Hidden on Mobile */}
                <div className="hidden md:flex w-14 bg-[#252525] border-r border-[#3d3d3d] flex-col items-center py-4 gap-2 z-20 shrink-0">
                    {[
                        { id: 'move', icon: <Move size={20}/>, label: 'Move' },
                        { id: 'brush', icon: <Brush size={20}/>, label: 'Brush' },
                        { id: 'eraser', icon: <Eraser size={20}/>, label: 'Eraser', action: () => setCurrentBrush(BRUSH_PRESETS.find(b => b.id === 'eraser_hard') || BRUSH_PRESETS[0]) },
                        { id: 'fill', icon: <PaintBucket size={20}/>, label: 'Fill' },
                        { id: 'picker', icon: <Pipette size={20}/>, label: 'Picker' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => {
                                if (t.action) t.action();
                                setTool(t.id as any);
                            }}
                            className={`p-3 rounded-xl transition-colors relative group ${tool === t.id ? 'bg-blue-500 text-white shadow-lg' : 'text-neutral-400 hover:bg-white/10 hover:text-white'}`}
                            title={t.label}
                        >
                            {t.icon}
                        </button>
                    ))}
                    
                    <div className="h-px w-8 bg-white/10 my-2"></div>
                    
                    {/* Primary Color */}
                    <div className="relative group">
                         <input 
                            type="color" 
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 p-0 cursor-pointer"
                         />
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div 
                    className="flex-1 bg-[#121212] overflow-hidden relative flex items-center justify-center min-w-0 min-h-0"
                    onWheel={(e) => {
                        if (e.ctrlKey) {
                            e.preventDefault();
                            setZoom(z => Math.max(0.1, Math.min(5, z - e.deltaY * 0.001)));
                        }
                    }}
                >
                    {/* Workspace Background */}
                    <div 
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    ></div>

                    <div 
                        ref={mainCanvasRef}
                        className="relative shadow-2xl bg-white cursor-crosshair flex-shrink-0"
                        style={{
                            width: CANVAS_WIDTH,
                            height: CANVAS_HEIGHT,
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'top left',
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={handlePointerMove}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={stopDrawing}
                    >
                        {/* Render Layers */}
                        {[...layers].reverse().map(layer => (
                            <canvas
                                key={layer.id}
                                ref={(el) => {
                                    if (el) {
                                        layerCanvasRefs.current[layer.id] = el;
                                        const ctx = el.getContext('2d')!;
                                        ctx.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
                                        ctx.drawImage(layer.canvas, 0, 0);
                                    }
                                }}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                style={{
                                    opacity: layer.opacity,
                                    mixBlendMode: layer.blendMode as any,
                                    display: layer.visible ? 'block' : 'none',
                                    zIndex: activeLayerId === layer.id ? 10 : 1
                                }}
                            />
                        ))}
                    </div>

                    {/* Mobile Panels Overlay */}
                    {mobilePanel !== 'none' && (
                        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#3d3d3d] p-4 max-h-[50vh] overflow-y-auto z-20 shadow-2xl rounded-t-2xl animate-in slide-in-from-bottom-5">
                            {/* Tools Panel Content */}
                            {mobilePanel === 'tools' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-neutral-500 uppercase">Tools & Color</h3>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { id: 'move', icon: <Move size={20}/> },
                                            { id: 'brush', icon: <Brush size={20}/> },
                                            { id: 'eraser', icon: <Eraser size={20}/>, action: () => setCurrentBrush(BRUSH_PRESETS.find(b => b.id === 'eraser_hard') || BRUSH_PRESETS[0]) },
                                            { id: 'fill', icon: <PaintBucket size={20}/> },
                                            { id: 'picker', icon: <Pipette size={20}/> },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => { if(t.action) t.action(); setTool(t.id as any); }}
                                                className={`aspect-square flex items-center justify-center rounded-xl transition-all ${tool === t.id ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                            >
                                                {t.icon}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-10 bg-white/5 rounded-lg flex items-center px-2">
                                            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent border-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-neutral-500 uppercase">Brushes</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {BRUSH_PRESETS.slice(0, 8).map(b => (
                                                <button key={b.id} onClick={() => { setCurrentBrush(b); setTool('brush'); }} className={`aspect-square rounded flex flex-col items-center justify-center border ${currentBrush.id === b.id ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-transparent'}`}>
                                                    <div className="w-2 h-2 rounded-full bg-current mb-1"></div>
                                                    <span className="text-[8px] truncate w-full text-center px-1">{b.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Properties Panel Content */}
                            {mobilePanel === 'properties' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-neutral-500 uppercase">Brush Properties</h3>
                                    <div className="space-y-4 bg-white/5 p-4 rounded-xl">
                                        <div>
                                            <div className="flex justify-between text-xs text-neutral-300 mb-2">Size <span>{currentBrush.size}px</span></div>
                                            <input type="range" min="1" max="200" value={currentBrush.size} onChange={e => setCurrentBrush({...currentBrush, size: Number(e.target.value)})} className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-neutral-300 mb-2">Opacity <span>{Math.round(currentBrush.opacity * 100)}%</span></div>
                                            <input type="range" min="0" max="1" step="0.01" value={currentBrush.opacity} onChange={e => setCurrentBrush({...currentBrush, opacity: Number(e.target.value)})} className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-neutral-300 mb-2">Smoothing <span>{currentBrush.smoothing}</span></div>
                                            <input type="range" min="0" max="20" value={currentBrush.smoothing} onChange={e => setCurrentBrush({...currentBrush, smoothing: Number(e.target.value)})} className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Layers Panel Content */}
                            {mobilePanel === 'layers' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-neutral-500 uppercase">Layers</h3>
                                        <button onClick={addLayer} className="p-2 bg-blue-600 rounded text-white text-xs font-bold flex items-center gap-1"><Plus size={14}/> Add</button>
                                    </div>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {layers.map((layer, index) => (
                                            <div key={layer.id} className={`flex items-center gap-2 p-2 rounded-lg border ${activeLayerId === layer.id ? 'bg-blue-600/20 border-blue-500/30' : 'bg-white/5 border-transparent'}`} onClick={() => setActiveLayerId(layer.id)}>
                                                <button onClick={(e) => { e.stopPropagation(); const ls = [...layers]; ls[index].visible = !ls[index].visible; setLayers(ls); }} className={`text-neutral-400 ${layer.visible ? 'text-white' : 'opacity-50'}`}>
                                                    {layer.visible ? <Eye size={16}/> : <EyeOff size={16}/>}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium truncate text-neutral-200">{layer.name}</div>
                                                </div>
                                                {activeLayerId === layer.id && (
                                                    <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="text-neutral-500 hover:text-red-400"><Trash2 size={14}/></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-400">Layer Opacity</span>
                                            <input type="range" min="0" max="1" step="0.01" value={layers.find(l => l.id === activeLayerId)?.opacity || 1} onChange={(e) => setLayers(layers.map(l => l.id === activeLayerId ? {...l, opacity: Number(e.target.value)} : l))} className="flex-1 h-1 accent-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions Panel Content */}
                            {mobilePanel === 'actions' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-neutral-500 uppercase">Actions</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={undo} disabled={historyIndex < 0} className="p-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30"><Undo2 size={18}/> Undo</button>
                                        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30"><Redo2 size={18}/> Redo</button>
                                        <button onClick={handleExport} className="p-3 bg-blue-600/20 text-blue-200 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2"><Download size={18}/> Export PNG</button>
                                        <button onClick={loadVirtualFiles} className="p-3 bg-white/5 rounded-xl flex items-center justify-center gap-2"><FolderOpen size={18}/> Import</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Desktop Right Sidebar - Hidden on Mobile */}
                <div className="hidden md:flex w-72 bg-[#252525] border-l border-[#3d3d3d] flex-col z-20 shrink-0">
                    
                    {/* Brush Presets Panel */}
                    <div className="h-1/2 flex flex-col border-b border-[#3d3d3d]">
                        <div className="p-3 bg-[#2d2d2d] font-bold text-xs uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                            Brushes
                            <Settings size={14} className="cursor-pointer hover:text-white" onClick={() => setShowBrushSettings(!showBrushSettings)}/>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="grid grid-cols-4 gap-2">
                                {BRUSH_PRESETS.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => {
                                            setCurrentBrush(b);
                                            setTool('brush');
                                        }}
                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${currentBrush.id === b.id ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-black/20 border-transparent hover:bg-white/5'}`}
                                        title={b.name}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-current mb-1" style={{opacity: b.opacity}}></div>
                                        <span className="text-[9px] truncate w-full text-center px-1">{b.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Advanced Settings (Collapsible) */}
                            {showBrushSettings && (
                                <div className="mt-4 p-3 bg-black/20 rounded-lg space-y-3">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-neutral-400 mb-1">Flow</div>
                                        <input type="range" min="0.01" max="1" step="0.01" value={currentBrush.flow} onChange={e => setCurrentBrush({...currentBrush, flow: Number(e.target.value)})} className="w-full h-1 accent-blue-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] text-neutral-400 mb-1">Hardness</div>
                                        <input type="range" min="0" max="1" step="0.1" value={currentBrush.hardness} onChange={e => setCurrentBrush({...currentBrush, hardness: Number(e.target.value)})} className="w-full h-1 accent-blue-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] text-neutral-400 mb-1">Scatter</div>
                                        <input type="range" min="0" max="100" value={currentBrush.scatter} onChange={e => setCurrentBrush({...currentBrush, scatter: Number(e.target.value)})} className="w-full h-1 accent-blue-500" />
                                    </div>
                                    <div className="flex gap-2 text-[10px]">
                                        <span className="text-neutral-400">Mode:</span>
                                        <select 
                                            value={currentBrush.blendMode} 
                                            onChange={e => setCurrentBrush({...currentBrush, blendMode: e.target.value as any})}
                                            className="bg-black/40 border border-white/10 rounded px-1"
                                        >
                                            {BLEND_MODES.slice(0, 5).map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Layers Panel */}
                    <div className="flex-1 flex flex-col bg-[#202020]">
                        <div className="p-3 bg-[#2d2d2d] font-bold text-xs uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                            Layers
                            <div className="flex gap-1">
                                <button onClick={addLayer} className="p-1 hover:bg-white/10 rounded"><Plus size={14}/></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {layers.map((layer, index) => (
                                <div 
                                    key={layer.id}
                                    className={`group flex items-center gap-2 p-2 rounded-lg border transition-all ${activeLayerId === layer.id ? 'bg-blue-600/20 border-blue-500/30' : 'bg-[#2a2a2a] border-transparent hover:bg-[#333]'}`}
                                    onClick={() => setActiveLayerId(layer.id)}
                                >
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); const ls = [...layers]; ls[index].visible = !ls[index].visible; setLayers(ls); }}
                                        className={`text-neutral-500 hover:text-white ${layer.visible ? 'opacity-100' : 'opacity-30'}`}
                                    >
                                        {layer.visible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                    </button>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate text-neutral-200">{layer.name}</div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[9px] text-neutral-500">{Math.round(layer.opacity * 100)}%</span>
                                            <span className="text-[9px] text-neutral-500 uppercase">{layer.blendMode === 'source-over' ? 'Normal' : layer.blendMode}</span>
                                        </div>
                                    </div>

                                    {/* Layer Actions */}
                                    {activeLayerId === layer.id && (
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="hover:text-red-400 text-neutral-500"><Trash2 size={12}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} className="hover:text-blue-400 text-neutral-500"><Copy size={12}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); mergeDown(index); }} className="hover:text-green-400 text-neutral-500"><ChevronDown size={12}/></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Selected Layer Properties */}
                        <div className="p-3 border-t border-[#3d3d3d] bg-[#252525] space-y-2">
                             <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-neutral-400 w-12">Opacity</span>
                                 <input 
                                    type="range" min="0" max="1" step="0.01" 
                                    value={layers.find(l => l.id === activeLayerId)?.opacity || 1}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setLayers(layers.map(l => l.id === activeLayerId ? {...l, opacity: val} : l));
                                    }}
                                    className="flex-1 h-1 accent-blue-500"
                                />
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-neutral-400 w-12">Blend</span>
                                 <select 
                                    value={layers.find(l => l.id === activeLayerId)?.blendMode || 'source-over'}
                                    onChange={(e) => {
                                        setLayers(layers.map(l => l.id === activeLayerId ? {...l, blendMode: e.target.value as any} : l));
                                    }}
                                    className="flex-1 bg-black/40 border border-white/10 rounded text-xs px-1 py-0.5 text-neutral-300 outline-none"
                                >
                                    {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Toolbar - Visible only on Mobile */}
            <div className="md:hidden h-16 bg-[#252525] border-t border-[#3d3d3d] flex justify-around items-center z-30 shrink-0 pb-1">
                <button onClick={() => setMobilePanel(p => p === 'tools' ? 'none' : 'tools')} className={`p-2 rounded flex flex-col items-center gap-1 ${mobilePanel === 'tools' || tool !== 'move' ? 'text-blue-400' : 'text-neutral-400'}`}>
                    <Brush size={20} />
                    <span className="text-[10px] font-medium">Tools</span>
                </button>
                <button onClick={() => setMobilePanel(p => p === 'properties' ? 'none' : 'properties')} className={`p-2 rounded flex flex-col items-center gap-1 ${mobilePanel === 'properties' ? 'text-blue-400' : 'text-neutral-400'}`}>
                    <Sliders size={20} />
                    <span className="text-[10px] font-medium">Props</span>
                </button>
                <button onClick={() => setMobilePanel(p => p === 'layers' ? 'none' : 'layers')} className={`p-2 rounded flex flex-col items-center gap-1 ${mobilePanel === 'layers' ? 'text-blue-400' : 'text-neutral-400'}`}>
                    <Layers size={20} />
                    <span className="text-[10px] font-medium">Layers</span>
                </button>
                <button onClick={() => setMobilePanel(p => p === 'actions' ? 'none' : 'actions')} className={`p-2 rounded flex flex-col items-center gap-1 ${mobilePanel === 'actions' ? 'text-blue-400' : 'text-neutral-400'}`}>
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Actions</span>
                </button>
            </div>

            {/* Import Modal */}
            {fileModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-[#252525] border border-white/10 rounded-xl w-96 max-h-[80vh] flex flex-col shadow-2xl m-4">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Import from FS</h3>
                            <button onClick={() => setFileModalOpen(false)}><X size={16} className="text-neutral-400"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {virtualFiles.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500">No images found in /Images</div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {virtualFiles.map(f => (
                                        <button 
                                            key={f.path}
                                            onClick={() => importVirtualFile(f)}
                                            className="p-2 hover:bg-white/5 rounded border border-white/5 flex flex-col items-center gap-2"
                                        >
                                            <FileImage size={24} className="text-blue-400"/>
                                            <span className="text-xs truncate w-full text-center text-neutral-300">{f.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                         <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                             <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                 Upload from Local Device
                                 <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleImportImage(e); setFileModalOpen(false); }}/>
                             </label>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};
