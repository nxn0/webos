
import React from 'react';
import { AppId, Category } from './types';
import { 
    CheckSquare, StickyNote, Calculator, 
    Gamepad2,
    Cloud, Folder, Palette, Globe,
    PlayCircle, Wand2, PenTool,
    Settings, BrainCircuit
} from 'lucide-react';

export const CATEGORIES: Category[] = ['Productivity', 'Games', 'Utilities', 'Media'];

export const APPS_MAP: Record<Category, { id: AppId; name: string; icon: React.ReactNode }[]> = {
  Productivity: [
    { id: AppId.ML_EXPLORER, name: 'ML Explorer', icon: <BrainCircuit className="text-cyan-500" /> },
    { id: AppId.TODO, name: 'Todo', icon: <CheckSquare className="text-blue-500" /> },
    { id: AppId.NOTES, name: 'Notes', icon: <StickyNote className="text-yellow-500" /> },
    { id: AppId.CALCULATOR, name: 'Calculator', icon: <Calculator className="text-gray-500" /> },
  ],
  Games: [
    { id: AppId.GAME_CENTER, name: 'Game Center', icon: <Gamepad2 className="text-indigo-500" /> },
  ],
  Utilities: [
    { id: AppId.WEBSEARCH, name: 'Web Search', icon: <Globe className="text-blue-400" /> },
    { id: AppId.WEATHER, name: 'Weather', icon: <Cloud className="text-blue-400" /> },
    { id: AppId.FILES, name: 'Files', icon: <Folder className="text-orange-400" /> },
    { id: AppId.COLOR_PICKER, name: 'Colors', icon: <Palette className="text-purple-400" /> },
    { id: AppId.SETTINGS, name: 'Settings', icon: <Settings className="text-gray-400" /> },
  ],
  Media: [
    { id: AppId.MEDIA, name: 'Media Center', icon: <PlayCircle className="text-pink-500" /> },
    { id: AppId.AI_STUDIO, name: 'AI Studio', icon: <Wand2 className="text-purple-500" /> },
    { id: AppId.ART_ENGINE, name: 'Artengine', icon: <PenTool className="text-orange-500" /> },
  ],
};
