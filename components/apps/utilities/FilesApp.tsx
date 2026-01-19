
import React, { useState, useEffect } from 'react';
import { Folder, File, X, Image as ImageIcon, FileText, Music, Home, ArrowUp, RefreshCw, FolderPlus, UploadCloud, Download } from 'lucide-react';
import { listFiles, FSItem, createFolder, saveFile } from '../../../services/fileSystem';

export const FilesApp = () => {
  const [currentPath, setCurrentPath] = useState('/Home');
  const [files, setFiles] = useState<FSItem[]>([]);
  const [activeFile, setActiveFile] = useState<{name: string, content: React.ReactNode} | null>(null);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    loadFiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const loadFiles = async () => {
      setLoading(true);
      try {
          const list = await listFiles(currentPath);
          setFiles(list);
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };

  const navigate = (item: FSItem) => {
    if (item.type === 'folder') {
        setCurrentPath(item.path);
    } else {
        openFile(item);
    }
  };

  const openFile = (item: FSItem) => {
      let content: React.ReactNode = <div className="text-center p-8 text-neutral-500">Preview not available</div>;
      
      const name = item.name.toLowerCase();
      
      if (item.content) {
          const url = URL.createObjectURL(item.content);
          if (item.mimeType?.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg')) {
             content = <img src={url} alt={item.name} className="max-w-full max-h-[400px] object-contain rounded border border-white/5" />;
          } else if (item.mimeType?.startsWith('audio/') || name.endsWith('.mp3')) {
              content = (
                <div className="flex flex-col items-center gap-4">
                    <Music size={64} className="text-purple-300" />
                    <h3 className="text-lg font-bold text-neutral-200">{item.name}</h3>
                    <audio controls src={url} className="w-full opacity-80" />
                </div>
              );
          } else if (item.mimeType?.startsWith('text/') || name.endsWith('.txt')) {
             content = <div className="p-4 text-sm text-neutral-300">Preview unavailable for text files in this view.</div>;
          }
      }
      
      setActiveFile({ name: item.name, content });
  };

  const goUp = () => {
    if (currentPath === '/Home') return;
    const parts = currentPath.split('/');
    parts.pop();
    const parent = parts.join('/') || '/Home';
    setCurrentPath(parent);
  };

  const handleDownload = (e: React.MouseEvent, item: FSItem) => {
      e.preventDefault();
      e.stopPropagation();
      if (!item.content) return;
      const url = URL.createObjectURL(item.content);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleLocalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setLoading(true);
          const files = Array.from(e.target.files) as File[];
          for (const file of files) {
              await saveFile(file, currentPath);
          }
          await loadFiles();
          setLoading(false);
      }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newFolderName.trim()) {
          await createFolder(newFolderName.trim(), currentPath);
          setNewFolderName("");
          setIsCreatingFolder(false);
          loadFiles();
      }
  }

  return (
    <div className="h-full flex flex-col bg-transparent relative text-neutral-200">
      {/* File Preview Modal */}
      {activeFile && (
          <div className="absolute inset-0 bg-neutral-900/90 z-20 flex flex-col animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
              <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <div className="flex items-center gap-2 font-medium">
                      <File size={16} className="text-blue-300"/>
                      {activeFile.name}
                  </div>
                  <button onClick={() => setActiveFile(null)} className="p-1 hover:bg-white/10 hover:text-red-300 rounded"><X size={20} /></button>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                  {activeFile.content}
              </div>
          </div>
      )}

      {/* Toolbar */}
      <div className="p-2 border-b border-white/5 flex gap-2 items-center bg-white/5 shadow-sm backdrop-blur-sm">
        <button onClick={() => setCurrentPath('/Home')} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="Home">
            <Home size={18} />
        </button>
        <button onClick={goUp} disabled={currentPath === '/Home'} className="p-2 hover:bg-white/10 rounded disabled:opacity-30 text-neutral-400 hover:text-white" title="Up">
            <ArrowUp size={18} />
        </button>
        <button onClick={loadFiles} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="Refresh">
            <RefreshCw size={18} />
        </button>
        
        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <div className="flex-1 px-3 py-1.5 bg-black/20 border border-white/5 rounded text-sm font-mono text-neutral-300 flex items-center gap-1 overflow-hidden whitespace-nowrap">
            <span className="text-neutral-500">root</span> {currentPath}
        </div>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <button onClick={() => setIsCreatingFolder(!isCreatingFolder)} className="p-2 hover:bg-white/10 rounded text-blue-300 hover:text-blue-200" title="New Folder">
            <FolderPlus size={18} />
        </button>
        
        <label className="p-2 hover:bg-white/10 rounded text-green-300 hover:text-green-200 cursor-pointer" title="Import from Device">
            <UploadCloud size={18} />
            <input type="file" multiple className="hidden" onChange={handleLocalImport} />
        </label>
      </div>

      {/* New Folder Input */}
      {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="p-2 bg-black/20 flex gap-2 border-b border-white/5 animate-in slide-in-from-top-2">
              <input 
                autoFocus 
                className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-blue-400/50 text-neutral-200" 
                placeholder="Folder Name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <button type="submit" className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs font-bold text-blue-200 border border-blue-500/10">Create</button>
          </form>
      )}

      {/* File Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
             <div className="text-center text-neutral-500 mt-10">Loading...</div>
        ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 content-start">
                {files.map((item) => (
                <div 
                    key={item.path} 
                    className="group flex flex-col items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer text-neutral-200 transition-colors relative isolate"
                >
                    {/* Navigation Layer - Z-0, covers full area */}
                    <div 
                        className="absolute inset-0 z-0" 
                        onClick={() => navigate(item)}
                        title={item.name}
                    ></div>

                    {/* Icon Visuals - pointer events none to let click pass to Navigation Layer */}
                    <div className="pointer-events-none z-10 flex flex-col items-center w-full">
                        {item.type === 'folder' ? (
                            <Folder size={48} className="text-yellow-200/80 fill-yellow-200/20 drop-shadow-sm group-hover:scale-110 transition-transform" />
                        ) : (
                            item.mimeType?.startsWith('image') ? (
                                <ImageIcon size={48} className="text-purple-300 group-hover:scale-110 transition-transform" />
                            ) : item.mimeType?.startsWith('audio') ? (
                                <Music size={48} className="text-pink-300 group-hover:scale-110 transition-transform" />
                            ) : (
                                <FileText size={48} className="text-neutral-400 group-hover:scale-110 transition-transform" />
                            )
                        )}
                        <span className="text-xs mt-2 text-center break-all font-medium leading-tight group-hover:text-blue-300 line-clamp-2 w-full text-neutral-300">{item.name}</span>
                    </div>
                    
                    {/* Action Layer - Z-20, sits above navigation layer */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {item.type === 'file' && (
                            <button 
                                onClick={(e) => handleDownload(e, item)}
                                className="p-1.5 bg-blue-500/30 border border-blue-400/20 rounded-full hover:bg-blue-500/50 shadow-lg text-blue-100 cursor-pointer"
                                title="Download"
                            >
                                <Download size={12} />
                            </button>
                        )}
                    </div>
                </div>
                ))}
                {files.length === 0 && <div className="col-span-full text-center text-neutral-600 py-10">Folder is empty</div>}
            </div>
        )}
      </div>
    </div>
  );
};
