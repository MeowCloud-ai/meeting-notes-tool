import { supabase } from './supabase';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const DB_NAME = 'meowmeet-cache';
const STORE_NAME = 'segments';

export interface CachedSegment {
  key: string;
  recordingId: string;
  segmentIndex: number;
  blob: Blob;
  createdAt: number;
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class SegmentUploader {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async uploadSegment(recordingId: string, segmentIndex: number, blob: Blob): Promise<string> {
    const path = `${this.userId}/${recordingId}/segment_${segmentIndex}.webm`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { error } = await supabase.storage.from('recordings').upload(path, blob, {
        contentType: 'audio/webm;codecs=opus',
        upsert: true,
      });

      if (!error) {
        // Remove from cache if it was cached
        await this.removeCachedSegment(recordingId, segmentIndex).catch(() => {});
        return path;
      }

      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }

    // All retries failed — cache the segment
    await this.cacheSegment(recordingId, segmentIndex, blob);
    throw new Error(`Failed to upload segment ${segmentIndex} after ${MAX_RETRIES} retries`);
  }

  async cacheSegment(recordingId: string, segmentIndex: number, blob: Blob): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: CachedSegment = {
      key: `${recordingId}-${segmentIndex}`,
      recordingId,
      segmentIndex,
      blob,
      createdAt: Date.now(),
    };
    store.put(item);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async flushCache(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const items: CachedSegment[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as CachedSegment[]);
      req.onerror = () => reject(req.error);
    });
    db.close();

    for (const item of items) {
      await this.uploadSegment(item.recordingId, item.segmentIndex, item.blob);
    }
  }

  private async removeCachedSegment(recordingId: string, segmentIndex: number): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(`${recordingId}-${segmentIndex}`);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }
}
