
const DB_NAME = 'WebOS_FS';
const STORE_NAME = 'files';
const DB_VERSION = 2;

export interface FSItem {
  path: string; // Full path (key) e.g., "/Music/song.mp3"
  name: string;
  type: 'file' | 'folder';
  parent: string; // Parent folder path e.g., "/Music"
  content?: Blob;
  mimeType?: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

// Helper to normalize paths (remove trailing slashes) for consistent comparison
const normalize = (p: string) => p.replace(/\/+$/, "");

const ensureDirectory = (db: IDBDatabase, path: string, parent: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const name = path.split('/').pop() || 'Untitled';
        
        const getReq = store.get(path);
        
        getReq.onsuccess = () => {
            if (!getReq.result) {
                const addReq = store.put({
                    path,
                    name,
                    type: 'folder',
                    parent,
                    createdAt: Date.now()
                } as FSItem);
                addReq.onsuccess = () => resolve();
                addReq.onerror = (e) => {
                    console.warn(`Failed to create default dir ${path}`, e);
                    resolve(); // Resolve anyway to proceed
                };
            } else {
                resolve();
            }
        };
        getReq.onerror = (e) => {
            console.warn(`Error checking dir ${path}`, e);
            resolve();
        };
    });
};

export const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        store.createIndex('parent', 'parent', { unique: false });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      
      try {
          // Sequentially ensure directories exist to prevent parent/child race conditions
          await ensureDirectory(db, '/Home', 'root');
          await Promise.all([
              ensureDirectory(db, '/Music', '/Home'),
              ensureDirectory(db, '/Documents', '/Home'),
              ensureDirectory(db, '/Images', '/Home'),
          ]);
      } catch (err) {
          console.error("Error initializing file system directories:", err);
      }

      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

export const saveFile = async (file: File, parentPath: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Ensure unique name if conflict? For now, overwrite or simple append.
    const path = `${parentPath === '/' ? '' : parentPath}/${file.name}`;
    
    const item: FSItem = {
      path,
      name: file.name,
      type: 'file',
      parent: parentPath,
      content: file,
      mimeType: file.type,
      createdAt: Date.now()
    };

    const req = store.put(item);
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const createFolder = async (name: string, parentPath: string) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const path = `${parentPath === '/' ? '' : parentPath}/${name}`;
      
      const item: FSItem = {
        path,
        name,
        type: 'folder',
        parent: parentPath,
        createdAt: Date.now()
      };
  
      const req = store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
};

export const listFiles = async (parentPath: string): Promise<FSItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('parent');
    const request = index.getAll(parentPath);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFile = async (path: string): Promise<FSItem | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(path);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};
