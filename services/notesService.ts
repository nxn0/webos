
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isSticky: boolean;
  isPinned: boolean;
  position: { x: number; y: number; width: number; height: number; color: string };
  createdAt: number;
  updatedAt: number;
  folder?: string;
  images: string[];
}

const DB_NAME = 'WebOS_Notes';
const STORE_NAME = 'notes';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export const initNotesDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('tags', 'tags', { multiEntry: true });
        store.createIndex('isPinned', 'isPinned', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
};

export const getNotes = async (): Promise<Note[]> => {
  const db = await initNotesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result.sort((a: Note, b: Note) => b.updatedAt - a.updatedAt));
    req.onerror = () => reject(req.error);
  });
};

export const saveNote = async (note: Note): Promise<void> => {
  const db = await initNotesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(note);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteNote = async (id: string): Promise<void> => {
  const db = await initNotesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getPinnedNotes = async (): Promise<Note[]> => {
    const notes = await getNotes();
    return notes.filter(n => n.isPinned);
}
