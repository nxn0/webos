
import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { WindowState } from '../../types';

interface WindowFrameProps {
  windowState: WindowState;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  windowState,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Taskbar height constant (h-[32px] or [40px])
  const TASKBAR_HEIGHT = 40;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus(windowState.id);
    if (windowState.isMaximized || isMobile) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowState.x,
      y: e.clientY - windowState.y
    });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus(windowState.id);
    if(isMobile) return;

    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: windowState.width,
      startH: windowState.height
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        // Boundary constraints
        const minX = 0;
        const maxX = window.innerWidth - windowState.width;
        
        let minY = 0;
        let maxY = window.innerHeight - windowState.height;

        if (isMobile) {
            minY = TASKBAR_HEIGHT;
        } else {
            // Taskbar is bottom on desktop
            maxY = window.innerHeight - windowState.height - TASKBAR_HEIGHT;
        }

        // Clamp
        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));

        onMove(windowState.id, newX, newY);
      }
      if (isResizing && resizeRef.current) {
        const deltaX = e.clientX - resizeRef.current.startX;
        const deltaY = e.clientY - resizeRef.current.startY;
        
        onResize(
          windowState.id,
          Math.max(300, resizeRef.current.startW + deltaX),
          Math.max(200, resizeRef.current.startH + deltaY)
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, windowState.id, windowState.width, windowState.height, onMove, onResize, isMobile]);

  const isFullscreen = windowState.isMaximized || isMobile;

  // IMPORTANT: Do not return null if minimized. Use display: none instead to preserve State.
  
  return (
    <div
      className={`absolute flex flex-col shadow-2xl rounded-xl overflow-hidden border border-white/10 transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 m-0 rounded-none z-50' : ''
      } bg-neutral-900/95 backdrop-blur-xl text-white`}
      style={{
        left: isFullscreen ? 0 : windowState.x,
        top: isFullscreen ? (isMobile ? '32px' : 0) : windowState.y,
        width: isFullscreen ? '100%' : windowState.width,
        height: isFullscreen ? (isMobile ? 'calc(100% - 32px)' : 'calc(100% - 40px)') : windowState.height,
        zIndex: windowState.zIndex,
        display: windowState.isMinimized ? 'none' : 'flex' // Hide but keep mounted
      }}
      onMouseDown={() => onFocus(windowState.id)}
    >
      {/* Title Bar */}
      <div
        className="h-9 bg-white/5 border-b border-white/10 flex items-center justify-between px-3 select-none cursor-default shrink-0"
        onMouseDown={handleMouseDown}
        onDoubleClick={() => !isMobile && onMaximize(windowState.id)}
      >
        <span className="font-bold text-sm text-neutral-200 truncate flex items-center gap-2 drop-shadow-sm">
            {windowState.title}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); onMinimize(windowState.id); }} className="p-1 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition-colors"><Minus size={14} /></button>
          {!isMobile && (
              <button onClick={(e) => { e.stopPropagation(); onMaximize(windowState.id); }} className="p-1 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition-colors">
                {windowState.isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
              </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onClose(windowState.id); }} className="p-1 hover:bg-red-500/80 hover:text-white rounded text-neutral-300 transition-colors"><X size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-transparent flex flex-col">
        {children}
      </div>

      {/* Resize Handle (Desktop Only) */}
      {!isFullscreen && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 opacity-0 hover:opacity-100"
          onMouseDown={handleResizeStart}
        >
          <svg viewBox="0 0 10 10" className="w-full h-full fill-neutral-500">
            <path d="M10 10L10 0L0 10Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
