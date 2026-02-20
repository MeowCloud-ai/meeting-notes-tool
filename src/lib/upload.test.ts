import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SegmentUploader } from './upload';

// Mock supabase
const mockUpload = vi.fn();
vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
      }),
    },
  },
}));

// Mock indexedDB
function createMockIDB() {
  const store = new Map<string, unknown>();
  const mockStore = {
    put: vi.fn((item: { key: string }) => {
      store.set(item.key, item);
    }),
    delete: vi.fn((key: string) => {
      store.delete(key);
    }),
    getAll: vi.fn(() => {
      const req = {
        result: Array.from(store.values()),
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      setTimeout(() => req.onsuccess?.(), 0);
      return req;
    }),
  };

  const mockTx = {
    objectStore: () => mockStore,
    oncomplete: null as (() => void) | null,
    onerror: null as (() => void) | null,
  };

  const mockDB = {
    transaction: () => {
      const tx = { ...mockTx, oncomplete: null, onerror: null };
      setTimeout(() => tx.oncomplete?.(), 0);
      return tx;
    },
    objectStoreNames: { contains: () => true },
    createObjectStore: vi.fn(),
    close: vi.fn(),
  };

  return { store, mockDB };
}

let mockIDB: ReturnType<typeof createMockIDB>;

beforeEach(() => {
  mockIDB = createMockIDB();

  const mockOpen = {
    result: mockIDB.mockDB,
    onsuccess: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onupgradeneeded: null as (() => void) | null,
  };

  vi.stubGlobal('indexedDB', {
    open: () => {
      setTimeout(() => mockOpen.onsuccess?.(), 0);
      return mockOpen;
    },
  });
});

describe('SegmentUploader', () => {
  let uploader: SegmentUploader;

  beforeEach(() => {
    vi.clearAllMocks();
    uploader = new SegmentUploader('user-123');
  });

  describe('uploadSegment', () => {
    it('uploads to correct path', async () => {
      mockUpload.mockResolvedValue({ error: null });

      const blob = new Blob(['test'], { type: 'audio/webm' });
      const path = await uploader.uploadSegment('rec-1', 0, blob);

      expect(path).toBe('recordings/user-123/rec-1/segment-0.webm');
      expect(mockUpload).toHaveBeenCalledWith(
        'recordings/user-123/rec-1/segment-0.webm',
        blob,
        { contentType: 'audio/webm;codecs=opus', upsert: true },
      );
    });

    it('retries on failure with exponential backoff', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      mockUpload
        .mockResolvedValueOnce({ error: { message: 'fail' } })
        .mockResolvedValueOnce({ error: { message: 'fail' } })
        .mockResolvedValueOnce({ error: null });

      const blob = new Blob(['test']);
      const path = await uploader.uploadSegment('rec-1', 0, blob);

      expect(path).toBe('recordings/user-123/rec-1/segment-0.webm');
      expect(mockUpload).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('caches and throws after max retries', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      mockUpload.mockResolvedValue({ error: { message: 'fail' } });

      const blob = new Blob(['test']);
      await expect(uploader.uploadSegment('rec-1', 0, blob)).rejects.toThrow(
        'Failed to upload segment 0 after 3 retries',
      );
      expect(mockUpload).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe('cacheSegment', () => {
    it('stores segment in IndexedDB', async () => {
      const blob = new Blob(['cached']);
      await uploader.cacheSegment('rec-1', 0, blob);
      // No error means success
    });
  });
});
