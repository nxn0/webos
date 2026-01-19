
import React from 'react';

export enum AppId {
  // Productivity
  TODO = 'todo',
  NOTES = 'notes',
  CALCULATOR = 'calculator',
  ML_EXPLORER = 'mlexplorer',
  
  // Games
  GAME_CENTER = 'gamecenter',
  EASTER_EGG = 'easteregg',

  // Utilities
  WEATHER = 'weather',
  FILES = 'files',
  COLOR_PICKER = 'colorpicker',
  WEBSEARCH = 'websearch',
  SETTINGS = 'settings',

  // Media (Merged)
  MEDIA = 'media',
  AI_STUDIO = 'aistudio',
  ART_ENGINE = 'artengine',
}

export type Category = 'Productivity' | 'Games' | 'Utilities' | 'Media';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface AppConfig {
  id: AppId;
  name: string;
  icon: React.ReactNode;
  category: Category;
  component: React.FC;
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface SystemTheme {
  isDark: boolean;
  background: string;
  accentColor: string;
}
