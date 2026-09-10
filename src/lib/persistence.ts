const DB_NAME = "wieditz-db";
const DB_VERSION = 1;
const VIDEO_STORE = "videos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(VIDEO_STORE)) {
        req.result.createObjectStore(VIDEO_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideoToIDB(file: File): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE, "readwrite");
      tx.objectStore(VIDEO_STORE).put(file, "lastVideo");
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    // IDB unavailable — silently ignore
  }
}

export async function loadVideoFromIDB(): Promise<File | null> {
  try {
    const db = await openDB();
    return await new Promise<File | null>((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE, "readonly");
      const req = tx.objectStore(VIDEO_STORE).get("lastVideo");
      req.onsuccess = () => {
        db.close();
        const val = req.result;
        if (!val) { resolve(null); return; }
        if (val instanceof File) { resolve(val); return; }
        if (val instanceof Blob) {
          resolve(new File([val], "restored_video", { type: val.type }));
          return;
        }
        resolve(null);
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

export async function clearVideoFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(VIDEO_STORE, "readwrite");
    tx.objectStore(VIDEO_STORE).delete("lastVideo");
    tx.oncomplete = () => db.close();
  } catch {
    // ignore
  }
}
