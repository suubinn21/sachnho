import type { PersonalBookRecord, PersonalTrackRecord } from '../data/types';

const DB_NAME = 'SachCuaDangDB';
const DB_VERSION = 1;
const STORE_BOOKS = 'personal_books';
const STORE_TRACKS = 'personal_tracks';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Không thể mở IndexedDB.'));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function putToStore<T>(storeName: string, record: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listPersonalBooks(): Promise<PersonalBookRecord[]> {
  const items = await getAllFromStore<PersonalBookRecord>(STORE_BOOKS);
  return items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function addPersonalBook(record: PersonalBookRecord): Promise<void> {
  await putToStore(STORE_BOOKS, record);
}

export async function removePersonalBook(id: string): Promise<void> {
  await deleteFromStore(STORE_BOOKS, id);
}

export async function listPersonalTracks(): Promise<PersonalTrackRecord[]> {
  const items = await getAllFromStore<PersonalTrackRecord>(STORE_TRACKS);
  return items.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}

export async function addPersonalTrack(record: PersonalTrackRecord): Promise<void> {
  await putToStore(STORE_TRACKS, record);
}

export async function removePersonalTrack(id: string): Promise<void> {
  await deleteFromStore(STORE_TRACKS, id);
}
