import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordingManager, MAX_RECORDING_DURATION_MS, DURATION_WARNING_MS } from './recording-manager';

// Mock supabase
const mockFrom = vi.fn();
const mockFunctions = { invoke: vi.fn() };

vi.mock('./supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    functions: { invoke: (...args: unknown[]) => mockFunctions.invoke(...args) },
  },
}));

vi.mock('./upload', () => {
  const MockUploader = vi.fn();
  MockUploader.prototype.uploadSegment = vi.fn().mockResolvedValue('path');
  MockUploader.prototype.flushCache = vi.fn().mockResolvedValue(undefined);
  return { SegmentUploader: MockUploader };
});

vi.mock('./api', () => ({
  triggerSegmentTranscription: vi.fn().mockResolvedValue(undefined),
  triggerStitchTranscripts: vi.fn().mockResolvedValue(undefined),
  triggerTranscription: vi.fn().mockResolvedValue(undefined),
}));

function mockChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe('RecordingManager', () => {
  let manager: RecordingManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    manager = new RecordingManager('user-1');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createRecording', () => {
    it('creates a recording and sets session', async () => {
      const chain = mockChain({ id: 'rec-1' });
      mockFrom.mockReturnValue(chain);

      const id = await manager.createRecording('https://meet.google.com/abc', 'Test Meeting');
      expect(id).toBe('rec-1');
      expect(manager.getSession()).toEqual({
        recordingId: 'rec-1',
        segmentCount: 0,
        status: 'recording',
      });
    });

    it('throws on insert error', async () => {
      const chain = mockChain(null, { message: 'db error' });
      mockFrom.mockReturnValue(chain);

      await expect(manager.createRecording(null, null)).rejects.toThrow('Failed to create recording');
    });
  });

  describe('handleSegment', () => {
    it('increments segment count and inserts segment row', async () => {
      // Setup session
      const createChain = mockChain({ id: 'rec-1' });
      mockFrom.mockReturnValue(createChain);
      await manager.createRecording(null, null);

      // For handleSegment calls
      const segChain = mockChain();
      mockFrom.mockReturnValue(segChain);

      const blob = new Blob(['test'], { type: 'audio/webm' });
      await manager.handleSegment(blob);

      expect(manager.getSession()?.segmentCount).toBe(1);
    });

    it('throws if no session', async () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      await expect(manager.handleSegment(blob)).rejects.toThrow('No active session');
    });
  });

  describe('duration timers', () => {
    it('fires warning at 55 minutes', () => {
      const onWarning = vi.fn();
      manager.setOnWarning(onWarning);
      manager.startDurationTimers();

      vi.advanceTimersByTime(DURATION_WARNING_MS);
      expect(onWarning).toHaveBeenCalledOnce();
    });

    it('fires auto-stop at 60 minutes', () => {
      const onAutoStop = vi.fn();
      manager.setOnAutoStop(onAutoStop);
      manager.startDurationTimers();

      vi.advanceTimersByTime(MAX_RECORDING_DURATION_MS);
      expect(onAutoStop).toHaveBeenCalledOnce();
    });

    it('clears timers', () => {
      const onWarning = vi.fn();
      manager.setOnWarning(onWarning);
      manager.startDurationTimers();
      manager.clearDurationTimers();

      vi.advanceTimersByTime(MAX_RECORDING_DURATION_MS);
      expect(onWarning).not.toHaveBeenCalled();
    });
  });

  describe('completeRecording', () => {
    it('throws if no session', async () => {
      await expect(manager.completeRecording(300)).rejects.toThrow('No active session');
    });
  });

  describe('failRecording', () => {
    it('does nothing if no session', async () => {
      await expect(manager.failRecording('test')).resolves.toBeUndefined();
    });
  });
});
