
import React, { useState, useEffect } from 'react';
import { AppId, WindowState } from './types';
import { Taskbar } from './components/os/Taskbar';
import { StartMenu } from './components/os/StartMenu';
import { WindowFrame } from './components/os/WindowFrame';
import { DesktopIcons } from './components/os/DesktopIcons';
import { ShutdownEasterEgg } from './components/os/ShutdownEasterEgg';

// Imports of Productivity Apps
import { TodoApp } from './components/apps/productivity/TodoApp';
import { NotesApp } from './components/apps/productivity/NotesApp';
import { CalculatorApp } from './components/apps/productivity/CalculatorApp';
import { MLexplorerApp } from './components/apps/MLexplorer/MLexplorerApp';

// Imports of Game Apps
import { GameCenterApp } from './components/apps/GameCenterApp';
import { EasterEggApp } from './components/apps/EasterEggApp';

// Imports of Utility Apps
import { WeatherApp } from './components/apps/utilities/WeatherApp';
import { FilesApp } from './components/apps/utilities/FilesApp';
import { ColorPickerApp } from './components/apps/utilities/ColorPickerApp';
import { WebsearchApp } from './components/apps/utilities/WebsearchApp';

// Imports of Media Apps
import { MediaApp } from './components/apps/media/MediaApp';
import { AIStudioApp } from './components/apps/media/AIStudioApp';
import { ArtEngine } from './components/apps/ArtEngine';

// Imports of Settings Apps
import { SettingsApp } from './components/apps/SettingsApp';

// App Registry
const AppRegistry: Record<AppId, React.FC<any>> = {
  [AppId.ML_EXPLORER]: MLexplorerApp,
  [AppId.TODO]: TodoApp,
  [AppId.NOTES]: NotesApp,
  [AppId.CALCULATOR]: CalculatorApp,
  [AppId.GAME_CENTER]: GameCenterApp,
  [AppId.EASTER_EGG]: EasterEggApp,
  [AppId.WEBSEARCH]: WebsearchApp,
  [AppId.WEATHER]: WeatherApp,
  [AppId.FILES]: FilesApp,
  [AppId.COLOR_PICKER]: ColorPickerApp,
  [AppId.MEDIA]: MediaApp,
  [AppId.AI_STUDIO]: AIStudioApp,
  [AppId.ART_ENGINE]: ArtEngine,
  [AppId.SETTINGS]: SettingsApp,
};

const DEFAULT_BG = "https://picsum.photos/id/11/1920/1080";

export default function App() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  // Settings State
  const [bgImage, setBgImage] = useState(DEFAULT_BG);
  const [isDark, setIsDark] = useState(true);
  const [userName, setUserName] = useState("Guest User");
  const [accentColor, setAccentColor] = useState("blue-500");

  useEffect(() => {
    // Force dark mode for the aesthetic
    document.documentElement.classList.add('dark');
    
    // Load persisted settings
    const savedName = localStorage.getItem('os_username');
    if (savedName) setUserName(savedName);
    
    const savedAccent = localStorage.getItem('os_accent');
    if (savedAccent) setAccentColor(savedAccent);
    
    const savedBg = localStorage.getItem('os_bg');
    if (savedBg) setBgImage(savedBg);

  }, []);

  // Persist settings
  useEffect(() => { localStorage.setItem('os_username', userName); }, [userName]);
  useEffect(() => { localStorage.setItem('os_accent', accentColor); }, [accentColor]);
  useEffect(() => { localStorage.setItem('os_bg', bgImage); }, [bgImage]);

  const openApp = (appId: AppId) => {
    const existing = windows.find(w => w.appId === appId);
    if (existing) {
      focusWindow(existing.id);
      return;
    }

    const id = `${appId}-${Date.now()}`;
    const offset = windows.length * 30;
    
    let defaultW = 700;
    let defaultH = 500;
    
    if ([AppId.CALCULATOR, AppId.COLOR_PICKER, AppId.WEATHER].includes(appId)) {
        defaultW = 340;
        defaultH = 480;
    }
    else if (appId === AppId.GAME_CENTER) {
        defaultW = 500;
        defaultH = 600;
    }
    else if (appId === AppId.ART_ENGINE || appId === AppId.ML_EXPLORER || appId === AppId.FILES || appId === AppId.SETTINGS || appId === AppId.MEDIA) {
        defaultW = 900;
        defaultH = 650;
    }
    else if (appId === AppId.WEBSEARCH) {
        defaultW = 800;
        defaultH = 550;
    }

    const newWindow: WindowState = {
      id,
      appId,
      title: getTitle(appId),
      x: 50 + (offset % 100),
      y: 30 + (offset % 100),
      width: defaultW,
      height: defaultH,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
    };
    setWindows([...windows, newWindow]);
    setNextZIndex(z => z + 1);
    setActiveWindowId(id);
  };

  const getTitle = (id: AppId) => {
    if (id === AppId.ML_EXPLORER) return "MLexplorer - Studio";
    if (id === AppId.EASTER_EGG) return "???";
    return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '); 
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setWindows(windows.map(w => w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w));
    setNextZIndex(z => z + 1);
  };

  const toggleMinimize = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  };

  const toggleMaximize = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const moveWindow = (id: string, x: number, y: number) => {
    setWindows(windows.map(w => w.id === id ? { ...w, x, y } : w));
  };

  const resizeWindow = (id: string, width: number, height: number) => {
    setWindows(windows.map(w => w.id === id ? { ...w, width, height } : w));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDesktopClick = () => {
    setContextMenu(null);
    setIsStartOpen(false);
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden bg-cover bg-center transition-all duration-500 relative select-none font-sans text-neutral-200"
      style={{ backgroundImage: `url(${bgImage})` }}
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >
      {/* Shutdown Overlay */}
      {isShuttingDown && <ShutdownEasterEgg onClose={() => setIsShuttingDown(false)} />}

      {/* Desktop Layer */}
      <DesktopIcons onAppClick={openApp} />

      {/* Context Menu */}
      {contextMenu && (
        <div 
            className="fixed bg-neutral-900/70 backdrop-blur-xl shadow-2xl rounded-xl py-1 w-56 z-[2000] border border-white/10 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
            style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
        >
            <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-sm font-medium text-neutral-200">Refresh Desktop</button>
            <div className="h-px bg-white/10 my-1"></div>
            <button onClick={() => setBgImage(`https://picsum.photos/1920/1080?random=${Date.now()}`)} className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-sm text-neutral-200">Next Background</button>
            <button onClick={() => openApp(AppId.SETTINGS)} className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-sm text-neutral-200">Settings</button>
        </div>
      )}

      {/* Windows Layer */}
      {windows.map(win => {
        const Component = AppRegistry[win.appId];
        // Pass common props + specific ones for Settings
        const props = win.appId === AppId.SETTINGS 
            ? { setBg: setBgImage, userName, setUserName }
            : {};

        return (
            <WindowFrame
                key={win.id}
                windowState={win}
                onClose={closeWindow}
                onFocus={focusWindow}
                onMinimize={toggleMinimize}
                onMaximize={toggleMaximize}
                onMove={moveWindow}
                onResize={resizeWindow}
            >
                <Component {...props} />
            </WindowFrame>
        );
      })}

      {/* OS UI Layer */}
      <StartMenu 
        isOpen={isStartOpen} 
        onClose={() => setIsStartOpen(false)}
        onAppClick={openApp}
        onShutdown={() => setIsShuttingDown(true)}
        userName={userName}
      />

      <Taskbar 
        openWindows={windows} 
        activeWindowId={activeWindowId} 
        onStartClick={(e?: React.MouseEvent) => { e?.stopPropagation(); setIsStartOpen(!isStartOpen); }}
        onWindowClick={(id) => {
            const win = windows.find(w => w.id === id);
            if (win?.isMinimized || activeWindowId !== id) {
                focusWindow(id);
            } else {
                toggleMinimize(id);
            }
        }}
        isStartOpen={isStartOpen}
        accentColor={accentColor}
      />
    </div>
  );
}
