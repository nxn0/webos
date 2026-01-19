
import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { 
  UploadCloud, BrainCircuit, Play, CheckCircle2, 
  Download, Activity, 
  Settings, RefreshCw, AlertTriangle, 
  Zap, Database, StopCircle, Box, Layers, Save, XCircle
} from 'lucide-react';

// --- Types & Interfaces ---

type View = 'upload' | 'setup' | 'training' | 'inference';

interface ColumnStats {
    name: string;
    type: 'numeric' | 'categorical';
    uniqueValues: string[]; // For categorical
    min: number; // For numeric
    max: number; // For numeric
    mean: number;
}

interface PreprocessorState {
    columns: ColumnStats[];
    targetCol: string;
    featureCols: string[];
}

interface TrainingLog {
    epoch: number;
    loss: number;
    val_loss?: number;
    metric: number; // Accuracy or MAE
    val_metric?: number;
}

interface ModelConfig {
    id: string;
    name: string;
    description: string;
    layers: number[]; // Array of unit counts per layer. Empty for Linear Regression.
    activation: 'relu' | 'tanh' | 'sigmoid' | 'elu' | 'selu' | 'linear';
    dropout: number; // 0 to 1
    regularizer?: 'l1' | 'l2';
    useNoise?: boolean;
}

// --- Constants: 20 Model Presets ---

const MODEL_PRESETS: ModelConfig[] = [
    { id: 'linear', name: 'Linear Regression', description: '0 Hidden Layers. Direct input-output mapping.', layers: [], activation: 'linear', dropout: 0 },
    { id: 'perceptron', name: 'Simple Perceptron', description: '1 Layer, 8 Neurons. Basic fitting capability.', layers: [8], activation: 'relu', dropout: 0 },
    { id: 'nano', name: 'Nano Network', description: '1 Layer, 16 Neurons. Lightweight and fast.', layers: [16], activation: 'relu', dropout: 0 },
    { id: 'micro', name: 'Micro Network', description: '2 Layers, 16/16 Neurons. Balanced for small data.', layers: [16, 16], activation: 'relu', dropout: 0 },
    { id: 'small', name: 'Small Network', description: '2 Layers, 32/32 Neurons. Standard baseline.', layers: [32, 32], activation: 'relu', dropout: 0 },
    { id: 'medium', name: 'Medium Network', description: '3 Layers, 64/64/64 Neurons. Good for tabular data.', layers: [64, 64, 64], activation: 'relu', dropout: 0 },
    { id: 'large', name: 'Large Network', description: '4 Layers, 128 Neurons each. High capacity.', layers: [128, 128, 128, 128], activation: 'relu', dropout: 0.1 },
    { id: 'xl', name: 'XL Network', description: '5 Layers, 256 Neurons each. Very high capacity.', layers: [256, 256, 256, 256, 256], activation: 'relu', dropout: 0.2 },
    { id: 'pyramid', name: 'Pyramid Architecture', description: 'Tapers down: 128 -> 64 -> 32.', layers: [128, 64, 32], activation: 'relu', dropout: 0 },
    { id: 'inv_pyramid', name: 'Inverted Pyramid', description: 'Expands up: 32 -> 64 -> 128.', layers: [32, 64, 128], activation: 'relu', dropout: 0 },
    { id: 'bottleneck', name: 'Bottleneck Arch', description: 'Compresses then expands: 64 -> 16 -> 64.', layers: [64, 16, 64], activation: 'relu', dropout: 0 },
    { id: 'diamond', name: 'Diamond Arch', description: 'Expands then compresses: 32 -> 128 -> 32.', layers: [32, 128, 32], activation: 'relu', dropout: 0 },
    { id: 'tanh_deep', name: 'Tanh Deep Net', description: '3 Layers, 64 Units, Tanh activation.', layers: [64, 64, 64], activation: 'tanh', dropout: 0 },
    { id: 'sigmoid_deep', name: 'Sigmoid Deep Net', description: '3 Layers, 64 Units, Sigmoid activation.', layers: [64, 64, 64], activation: 'sigmoid', dropout: 0 },
    { id: 'elu_net', name: 'ELU Network', description: 'Exponential Linear Units. Faster convergence.', layers: [64, 64, 64], activation: 'elu', dropout: 0 },
    { id: 'dropout_heavy', name: 'High Dropout Net', description: '3 Layers, 128 Units, 50% Dropout. Max regularization.', layers: [128, 128, 128], activation: 'relu', dropout: 0.5 },
    { id: 'l2_reg', name: 'L2 Ridge Net', description: 'L2 Regularization (Weight Decay).', layers: [64, 64], activation: 'relu', dropout: 0, regularizer: 'l2' },
    { id: 'l1_reg', name: 'L1 Lasso Net', description: 'L1 Regularization (Sparsity).', layers: [128, 128], activation: 'relu', dropout: 0, regularizer: 'l1' },
    { id: 'noisy', name: 'Noisy Input Net', description: 'Adds Gaussian Noise to inputs for robustness.', layers: [64, 64], activation: 'relu', dropout: 0, useNoise: true },
    { id: 'selu_modern', name: 'SELU Modern Net', description: 'Self-Normalizing Neural Network.', layers: [64, 64, 64], activation: 'selu', dropout: 0 },
];

// --- Component ---

export const MLexplorerApp = () => {
    // UI State
    const [view, setView] = useState<View>('upload');
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

    // Data State
    const [rawData, setRawData] = useState<any[]>([]);
    const [preprocessor, setPreprocessor] = useState<PreprocessorState | null>(null);
    const [targetCol, setTargetCol] = useState<string>('');
    const [droppedCols, setDroppedCols] = useState<string[]>([]);

    // Model Config State
    const [selectedModelId, setSelectedModelId] = useState<string>(MODEL_PRESETS[4].id);
    const [customConfig, setCustomConfig] = useState<ModelConfig>(MODEL_PRESETS[4]);
    const [epochs, setEpochs] = useState<number>(50);

    // Training State
    const [isTraining, setIsTraining] = useState(false);
    const [logs, setLogs] = useState<TrainingLog[]>([]);
    const [currentEpoch, setCurrentEpoch] = useState(0);
    const [model, setModel] = useState<tf.LayersModel | null>(null);

    // Inference State
    const [inferenceInput, setInferenceInput] = useState<Record<string, string>>({});
    const [inferenceResult, setInferenceResult] = useState<string | null>(null);

    const log = (msg: string) => setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    // --- Data Processing ---

    const analyzeData = (data: any[]) => {
        if (!data.length) return;
        const columns: ColumnStats[] = Object.keys(data[0]).map(key => {
            const values = data.map(d => d[key]);
            const isNumeric = values.every(v => !isNaN(Number(v)));
            
            if (isNumeric) {
                const nums = values.map(v => Number(v));
                return {
                    name: key,
                    type: 'numeric',
                    min: Math.min(...nums),
                    max: Math.max(...nums),
                    mean: nums.reduce((a, b) => a + b, 0) / nums.length,
                    uniqueValues: []
                };
            } else {
                return {
                    name: key,
                    type: 'categorical',
                    uniqueValues: Array.from(new Set(values)),
                    min: 0,
                    max: 0,
                    mean: 0
                };
            }
        });

        // Heuristic: Last column is target
        const target = columns[columns.length - 1].name;
        const features = columns.filter(c => c.name !== target).map(c => c.name);

        setPreprocessor({ columns, targetCol: target, featureCols: features });
        setTargetCol(target);
        log(`Analyzed ${data.length} rows, ${columns.length} columns.`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        log(`Uploading ${file.name}...`);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setRawData(results.data);
                analyzeData(results.data);
                setDroppedCols([]); // Reset dropped columns
                setView('setup');
                log('Upload complete. Please configure columns.');
            },
            error: (err: any) => log(`Error parsing CSV: ${err.message}`)
        });
    };

    // --- Training Logic ---

    const prepareTensors = () => {
        if (!preprocessor) return null;
        
        const features = rawData.map(row => {
            const rowData: number[] = [];
            preprocessor.featureCols.forEach(colName => {
                if (droppedCols.includes(colName)) return;
                const colStats = preprocessor.columns.find(c => c.name === colName)!;
                const val = row[colName];

                if (colStats.type === 'numeric') {
                    // Normalize
                    const num = Number(val);
                    rowData.push((num - colStats.mean) / (colStats.max - colStats.min || 1));
                } else {
                    // One-hot (Simplified: Label Encode for now to keep input dims sane)
                    const idx = colStats.uniqueValues.indexOf(val);
                    rowData.push(idx); 
                }
            });
            return rowData;
        });

        const targets = rawData.map(row => {
            const colStats = preprocessor.columns.find(c => c.name === targetCol)!;
            const val = row[targetCol] as any;
            if (colStats.type === 'numeric') {
                return Number(val);
            } else {
                return colStats.uniqueValues.indexOf(val);
            }
        });

        const xs = tf.tensor2d(features);
        // Determine output shape/type
        const targetStats = preprocessor.columns.find(c => c.name === targetCol)!;
        let ys;
        if (targetStats.type === 'numeric') {
             // CRITICAL FIX: Normalize target values for regression tasks
             // Neural networks converge poorly with large unscaled outputs.
             const normalizedTargets = targets.map(t => (Number(t) - targetStats.mean) / (targetStats.max - targetStats.min || 1));
             ys = tf.tensor2d(normalizedTargets, [targets.length, 1]);
        } else {
             // For classification, use one-hot
             ys = tf.oneHot(tf.tensor1d(targets, 'int32'), targetStats.uniqueValues.length);
        }

        return { xs, ys, inputShape: features[0].length, outputShape: targetStats.type === 'numeric' ? 1 : targetStats.uniqueValues.length, isRegression: targetStats.type === 'numeric' };
    };

    const startTraining = async () => {
        if (!preprocessor) return;
        
        // Ensure we have active features
        const activeFeatures = preprocessor.featureCols.filter(c => !droppedCols.includes(c));
        if (activeFeatures.length === 0) {
            log("Error: No input features selected.");
            return;
        }

        setIsTraining(true);
        setLogs([]);
        log('Preprocessing data...');

        const tensors = prepareTensors();
        if (!tensors) {
            log('Failed to prepare data.');
            setIsTraining(false);
            return;
        }

        const { xs, ys, inputShape, outputShape, isRegression } = tensors;

        log(`Building model: ${customConfig.name}`);
        const m = tf.sequential();

        let isFirstLayer = true;

        // Hidden Layers Loop
        for (let i = 0; i < customConfig.layers.length; i++) {
            const layerConfig: any = {
                units: customConfig.layers[i],
                activation: customConfig.activation,
            };

            // If it's the first layer, specify input shape
            if (isFirstLayer) {
                layerConfig.inputShape = [inputShape];
                isFirstLayer = false;
            }

            // Apply Regularizers
            if (customConfig.regularizer === 'l1') layerConfig.kernelRegularizer = tf.regularizers.l1({ l1: 0.01 });
            if (customConfig.regularizer === 'l2') layerConfig.kernelRegularizer = tf.regularizers.l2({ l2: 0.01 });

            m.add(tf.layers.dense(layerConfig));

            // Apply Gaussian Noise (Robustness)
            if (customConfig.useNoise && i === 0) {
                m.add(tf.layers.gaussianNoise({ rate: 0.1 }));
            }

            // Apply Dropout
            if (customConfig.dropout > 0) {
                m.add(tf.layers.dropout({ rate: customConfig.dropout }));
            }
        }

        // Output Layer
        const outputConfig: any = { 
            units: outputShape, 
            activation: isRegression ? 'linear' : 'softmax' 
        };
        
        // If we had no hidden layers (Linear Regression), the output layer connects to input
        if (isFirstLayer) {
            outputConfig.inputShape = [inputShape];
        }

        m.add(tf.layers.dense(outputConfig));

        m.compile({
            optimizer: tf.train.adam(0.01),
            loss: isRegression ? 'meanSquaredError' : 'categoricalCrossentropy',
            metrics: isRegression ? ['mae'] : ['accuracy']
        });

        setModel(m);
        log('Training started...');

        try {
            await m.fit(xs, ys, {
                epochs: epochs,
                batchSize: 32,
                validationSplit: 0.2,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        setCurrentEpoch(epoch + 1);
                        setLogs(prev => [...prev, {
                            epoch: epoch + 1,
                            loss: logs?.loss || 0,
                            val_loss: logs?.val_loss,
                            metric: (isRegression ? logs?.mae : logs?.acc) || 0,
                            val_metric: (isRegression ? logs?.val_mae : logs?.val_acc)
                        }]);
                    },
                    onTrainEnd: () => {
                        setIsTraining(false);
                        log('Training finished!');
                        setView('inference');
                    }
                }
            });
        } catch (error: any) {
            log(`Training failed: ${error.message}`);
            setIsTraining(false);
        }

        xs.dispose();
        ys.dispose();
    };

    // --- Inference Logic ---
    const runInference = () => {
        if (!model || !preprocessor) return;
        
        const rowData: number[] = [];
        preprocessor.featureCols.forEach(colName => {
            if (droppedCols.includes(colName)) return;
            const colStats = preprocessor.columns.find(c => c.name === colName)!;
            const rawVal = inferenceInput[colName];

            if (colStats.type === 'numeric') {
                // Default to mean if input is empty to avoid skewing prediction with 0s
                const num = (rawVal === undefined || rawVal === '') ? colStats.mean : Number(rawVal);
                rowData.push((num - colStats.mean) / (colStats.max - colStats.min || 1));
            } else {
                const idx = colStats.uniqueValues.indexOf(rawVal || colStats.uniqueValues[0]);
                rowData.push(idx);
            }
        });

        const tensor = tf.tensor2d([rowData]);
        const pred = model.predict(tensor) as tf.Tensor;
        const resData = pred.dataSync();
        const resArr = Array.from(resData) as number[];
        
        const targetStats = preprocessor.columns.find(c => c.name === targetCol)!;
        if (targetStats.type === 'numeric') {
            // De-normalize the regression output to get actual scale value
            const range = targetStats.max - targetStats.min || 1;
            const denormalized = (resArr[0] * range) + targetStats.mean;
            setInferenceResult(denormalized.toFixed(4));
        } else {
            const maxVal = Math.max(...resArr);
            const maxIdx = resArr.indexOf(maxVal);
            setInferenceResult(`${targetStats.uniqueValues[maxIdx]} (${(resArr[maxIdx] * 100).toFixed(1)}%)`);
        }
        tensor.dispose();
        pred.dispose();
    };

    const handleExport = async () => {
        if (!model) return;
        try {
            await model.save('downloads://trained-model');
            log('Model downloaded successfully (.json + .bin)');
        } catch (e: any) {
            log(`Export failed: ${e.message}`);
        }
    };

    // --- Renderers ---

    return (
        <div className="flex h-full bg-transparent text-neutral-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-black/20 border-r border-white/5 flex flex-col shrink-0">
                <div className="p-4 border-b border-white/5">
                    <h2 className="font-bold flex items-center gap-2 text-cyan-300"><BrainCircuit/> ML Explorer</h2>
                </div>
                <div className="p-2 space-y-1">
                    <button onClick={() => setView('upload')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 ${view === 'upload' ? 'bg-cyan-500/20 text-cyan-200' : 'text-neutral-400 hover:bg-white/5'}`}>
                        <UploadCloud size={18}/> Data Upload
                    </button>
                    <button disabled={!preprocessor} onClick={() => setView('setup')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 disabled:opacity-30 ${view === 'setup' ? 'bg-cyan-500/20 text-cyan-200' : 'text-neutral-400 hover:bg-white/5'}`}>
                        <Settings size={18}/> Configuration
                    </button>
                    <button disabled={!preprocessor} onClick={() => setView('training')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 disabled:opacity-30 ${view === 'training' ? 'bg-cyan-500/20 text-cyan-200' : 'text-neutral-400 hover:bg-white/5'}`}>
                        <Activity size={18}/> Training
                    </button>
                    <button disabled={!model} onClick={() => setView('inference')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 disabled:opacity-30 ${view === 'inference' ? 'bg-cyan-500/20 text-cyan-200' : 'text-neutral-400 hover:bg-white/5'}`}>
                        <Zap size={18}/> Inference
                    </button>
                </div>
                
                {/* Status Panel */}
                <div className="mt-auto p-4 border-t border-white/5 text-xs text-neutral-500 space-y-2">
                    <div className="flex justify-between"><span>Status:</span> <span className={isTraining ? "text-yellow-400" : "text-green-400"}>{isTraining ? 'Training...' : 'Idle'}</span></div>
                    <div className="flex justify-between"><span>Backend:</span> <span>{tf.getBackend()}</span></div>
                    <div className="flex justify-between"><span>Memory:</span> <span>{(tf.memory().numBytes / 1024 / 1024).toFixed(2)} MB</span></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-transparent relative flex flex-col">
                {view === 'upload' && (
                    <div className="p-8 flex flex-col items-center justify-center h-full overflow-y-auto">
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:bg-white/5 transition-colors w-full max-w-xl shrink-0">
                            <UploadCloud size={64} className="mx-auto text-cyan-400 mb-4 opacity-50"/>
                            <h3 className="text-xl font-bold mb-2">Upload Dataset</h3>
                            <p className="text-neutral-500 mb-6">Drag & drop CSV file or click to browse</p>
                            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium cursor-pointer transition-colors">Select CSV</label>
                        </div>
                        {rawData.length > 0 && (
                            <div className="mt-8 w-full max-w-4xl bg-black/20 rounded-xl overflow-hidden border border-white/5 shrink-0">
                                <div className="p-4 border-b border-white/5 font-bold">Data Preview ({rawData.length} rows)</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white/5 text-neutral-400">
                                            <tr>{Object.keys(rawData[0]).slice(0, 8).map(h => <th key={h} className="p-3">{h}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {rawData.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                    {Object.values(row).slice(0, 8).map((v: any, j) => <td key={j} className="p-3 truncate max-w-[150px]">{v}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {view === 'setup' && preprocessor && (
                    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
                        {/* Target Selection & Features - Combined Row for space efficiency */}
                        <div className="flex gap-6 min-h-[180px] shrink-0">
                            <div className="flex-1 bg-black/20 p-6 rounded-xl border border-white/5 flex flex-col">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-200"><CheckCircle2 size={20}/> Target Variable</h3>
                                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start custom-scrollbar pr-1">
                                    {preprocessor.columns.map(col => (
                                        <button 
                                            key={col.name}
                                            onClick={() => { 
                                                setTargetCol(col.name); 
                                                setDroppedCols(prev => prev.filter(c => c !== col.name));
                                                setPreprocessor({...preprocessor, targetCol: col.name}); 
                                            }}
                                            className={`p-3 rounded-lg border text-left transition-all ${targetCol === col.name ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-100' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                        >
                                            <div className="font-bold truncate text-xs">{col.name}</div>
                                            <div className="text-[10px] opacity-50 capitalize">{col.type}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 bg-black/20 p-6 rounded-xl border border-white/5 flex flex-col">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-200"><Box size={20}/> Input Features</h3>
                                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start custom-scrollbar pr-1">
                                    {preprocessor.columns.filter(c => c.name !== targetCol).map(col => {
                                        const isDropped = droppedCols.includes(col.name);
                                        return (
                                            <button 
                                                key={col.name}
                                                onClick={() => {
                                                    if (isDropped) {
                                                        setDroppedCols(prev => prev.filter(c => c !== col.name));
                                                    } else {
                                                        setDroppedCols(prev => [...prev, col.name]);
                                                    }
                                                }}
                                                className={`p-3 rounded-lg border text-left transition-all flex justify-between items-center group ${
                                                    isDropped 
                                                    ? 'bg-red-500/5 border-red-500/10 text-neutral-500 hover:bg-red-500/10' 
                                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-100 hover:bg-blue-500/20'
                                                }`}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <div className={`font-bold truncate text-xs ${isDropped ? 'line-through decoration-red-500/50' : ''}`}>{col.name}</div>
                                                </div>
                                                {isDropped ? <XCircle size={14} className="text-red-500/50 group-hover:text-red-500 flex-shrink-0" /> : <CheckCircle2 size={14} className="text-blue-400/50 group-hover:text-blue-400 flex-shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Model Configuration - Fills remaining space */}
                        <div className="bg-black/20 p-6 rounded-xl border border-white/5 flex-1 min-h-0 flex flex-col">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-200 shrink-0"><Layers size={20}/> Model Architecture</h3>
                            <div className="flex gap-6 flex-1 min-h-0">
                                <div className="w-1/3 space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
                                    {MODEL_PRESETS.map(preset => (
                                        <button 
                                            key={preset.id}
                                            onClick={() => { setSelectedModelId(preset.id); setCustomConfig(preset); }}
                                            className={`w-full text-left p-3 rounded border transition-all ${selectedModelId === preset.id ? 'bg-purple-500/20 border-purple-500/50 text-purple-100' : 'bg-white/5 border-transparent hover:bg-white/10 text-neutral-400'}`}
                                        >
                                            <div className="font-bold text-sm">{preset.name}</div>
                                            <div className="text-[10px] opacity-70">{preset.description}</div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 bg-white/5 rounded-xl p-6 border border-white/5 h-full overflow-y-auto custom-scrollbar">
                                    <h4 className="font-bold text-neutral-200 mb-6">Configuration: {customConfig.name}</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs uppercase text-neutral-500 font-bold">Layers (Units per layer)</label>
                                            {customConfig.layers.length > 0 ? (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {customConfig.layers.map((units, i) => (
                                                        <div key={i} className="flex flex-col items-center gap-1">
                                                            <div className="w-12 h-12 bg-cyan-500/20 rounded flex items-center justify-center border border-cyan-500/30 font-bold">{units}</div>
                                                            {i < customConfig.layers.length - 1 && <div className="w-0.5 h-4 bg-white/10"></div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-sm text-neutral-400 italic">No hidden layers (Linear)</div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs uppercase text-neutral-500 font-bold block mb-2">Activation</label>
                                                <select 
                                                    value={customConfig.activation} 
                                                    onChange={e => setCustomConfig({...customConfig, activation: e.target.value as any})}
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-neutral-200 outline-none focus:border-cyan-500/50"
                                                >
                                                    {['relu', 'tanh', 'sigmoid', 'elu', 'selu', 'linear'].map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs uppercase text-neutral-500 font-bold block mb-2">Dropout</label>
                                                <input 
                                                    type="range" min="0" max="0.9" step="0.1" 
                                                    value={customConfig.dropout} 
                                                    onChange={e => setCustomConfig({...customConfig, dropout: Number(e.target.value)})}
                                                    className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                />
                                                <div className="text-right text-xs text-neutral-400 mt-1">{Math.round(customConfig.dropout * 100)}%</div>
                                            </div>
                                            <div>
                                                <label className="text-xs uppercase text-neutral-500 font-bold block mb-2">Regularizer</label>
                                                <div className="text-sm text-neutral-300">{customConfig.regularizer?.toUpperCase() || 'None'}</div>
                                            </div>
                                            <div>
                                                <label className="text-xs uppercase text-neutral-500 font-bold block mb-2">Gaussian Noise</label>
                                                <div className="text-sm text-neutral-300">{customConfig.useNoise ? 'Enabled' : 'Disabled'}</div>
                                            </div>
                                            <div>
                                                <label className="text-xs uppercase text-neutral-500 font-bold block mb-2">Training Epochs</label>
                                                <input 
                                                    type="number" min="1" max="1000" 
                                                    value={epochs} 
                                                    onChange={e => setEpochs(Number(e.target.value))}
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-neutral-200 outline-none focus:border-cyan-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'training' && (
                    <div className="p-6 h-full flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-100">Training Dashboard</h2>
                                <p className="text-neutral-500 text-sm">Epoch: {currentEpoch} / {epochs}</p>
                            </div>
                            <button 
                                onClick={startTraining} 
                                disabled={isTraining}
                                className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all ${isTraining ? 'bg-neutral-700 text-neutral-500' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                            >
                                {isTraining ? <RefreshCw className="animate-spin" size={20}/> : <Play size={20}/>}
                                {isTraining ? 'Training...' : 'Start Training'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 mb-4">
                            {/* Loss Chart */}
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col min-h-0">
                                <h3 className="text-sm font-bold text-neutral-400 mb-2 shrink-0">Loss</h3>
                                <div className="flex-1 min-h-0 relative">
                                    <Line 
                                        data={{
                                            labels: logs.map(l => l.epoch),
                                            datasets: [
                                                { label: 'Train Loss', data: logs.map(l => l.loss), borderColor: '#06b6d4', tension: 0.2 },
                                                { label: 'Val Loss', data: logs.map(l => l.val_loss), borderColor: '#f472b6', tension: 0.2 }
                                            ]
                                        }}
                                        options={{ maintainAspectRatio: false, responsive: true, animation: { duration: 0 } }}
                                    />
                                </div>
                            </div>

                            {/* Metric Chart */}
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col min-h-0">
                                <h3 className="text-sm font-bold text-neutral-400 mb-2 shrink-0">Metric</h3>
                                <div className="flex-1 min-h-0 relative">
                                    <Line 
                                        data={{
                                            labels: logs.map(l => l.epoch),
                                            datasets: [
                                                { label: 'Train Metric', data: logs.map(l => l.metric), borderColor: '#22c55e', tension: 0.2 },
                                                { label: 'Val Metric', data: logs.map(l => l.val_metric), borderColor: '#fbbf24', tension: 0.2 }
                                            ]
                                        }}
                                        options={{ maintainAspectRatio: false, responsive: true, animation: { duration: 0 } }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Console - Fixed smaller height */}
                        <div className="h-32 bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-xs overflow-y-auto text-neutral-300 shrink-0">
                            {consoleLogs.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                    </div>
                )}

                {view === 'inference' && preprocessor && (
                    <div className="p-8 h-full flex flex-col items-center justify-center overflow-y-auto">
                        <div className="max-w-2xl w-full bg-black/20 rounded-xl border border-white/5 p-8 shadow-2xl backdrop-blur-md shrink-0">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-green-300"><Zap/> Live Inference</h2>
                                <button onClick={handleExport} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-neutral-300 transition-colors">
                                    <Save size={14}/> Export Model
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {preprocessor.featureCols.map(col => {
                                    if(droppedCols.includes(col)) return null;
                                    const stats = preprocessor.columns.find(c => c.name === col)!;
                                    return (
                                        <div key={col}>
                                            <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">{col}</label>
                                            {stats.type === 'numeric' ? (
                                                <input 
                                                    type="number"
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-neutral-200 outline-none focus:border-green-500/50"
                                                    placeholder={`Mean: ${stats.mean.toFixed(2)}`}
                                                    onChange={e => setInferenceInput({...inferenceInput, [col]: e.target.value})}
                                                />
                                            ) : (
                                                <select 
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-neutral-200 outline-none focus:border-green-500/50"
                                                    onChange={e => setInferenceInput({...inferenceInput, [col]: e.target.value})}
                                                >
                                                    {stats.uniqueValues.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <button onClick={runInference} className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold shadow-lg transition-transform active:scale-95 mb-6">
                                Predict
                            </button>

                            {inferenceResult && (
                                <div className="text-center p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                                    <div className="text-sm text-green-400 font-bold uppercase tracking-wider mb-2">Prediction Result</div>
                                    <div className="text-4xl font-bold text-white">{inferenceResult}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
