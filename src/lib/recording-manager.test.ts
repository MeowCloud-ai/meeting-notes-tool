import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordingManager } from './recording-manager';

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockGetUser = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'recordings') {
        return {
          insert: (data: unknown) => {
            mockInsert(data);
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({ data: { id: 'rec-abc' }, error: null }),
              }),
            };
          },
          update: (data: unknown) => {
            mockUpdate(data);
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        };
      }
      return {};
    },
    auth: {
      getUser: () => mockGetUser(),
    },
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

describe('RecordingManager', () => {
  let manager: RecordingManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    manager = new RecordingManager('user-1');
  });

  describe('createRecording', () => {
    it('creates a recording and returns id', async () => {
      const id = await manager.createRecording('https://meet.google.com', 'Meeting');
      expect(id).toBe('rec-abc');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Meeting',
          status: 'recording',
          tab_url: 'https://meet.google.com',
        }),
      );
    });

    it('uses default title when tabTitle is null', async () => {
      await manager.createRecording(null, null);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Untitled Recording' }),
      );
    });
  });

  describe('handleSegment', () => {
    it('increments segment count', async () => {
      await manager.createRecording(null, 'Test');
      await manager.handleSegment(new Blob(['data']));

      const session = manager.getSession();
      expect(session?.segmentCount).toBe(1);
      expect(mockUpdate).toHaveBeenCalledWith({ segment_count: 1 });
    });

    it('throws without active session', async () => {
      await expect(manager.handleSegment(new Blob())).rejects.toThrow('No active session');
    });
  });

  describe('completeRecording', () => {
    it('updates status to uploading', async () => {
      await manager.createRecording(null, 'Test');
      await manager.completeRecording(120);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'uploading',
          duration_seconds: 120,
        }),
      );
    });
  });

  describe('getSession', () => {
    it('returns null when no session', () => {
      expect(manager.getSession()).toBeNull();
    });

    it('returns session copy', async () => {
      await manager.createRecording(null, 'Test');
      const session = manager.getSession();
      expect(session?.recordingId).toBe('rec-abc');
      expect(session?.status).toBe('recording');
    });
  });
});
