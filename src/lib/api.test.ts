import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  triggerSegmentTranscription,
  triggerStitchTranscripts,
  triggerTranscription,
  triggerSummarization,
  getTranscript,
  getSummary,
} from './api';

const mockInvoke = vi.fn();
const mockFrom = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('triggerSegmentTranscription', () => {
    it('invokes transcribe with segment mode', async () => {
      mockInvoke.mockResolvedValue({ error: null });
      await triggerSegmentTranscription('rec-1', 0);
      expect(mockInvoke).toHaveBeenCalledWith('transcribe', {
        body: { recordingId: 'rec-1', segmentIndex: 0, mode: 'segment' },
      });
    });

    it('throws on error', async () => {
      mockInvoke.mockResolvedValue({ error: { message: 'fail' } });
      await expect(triggerSegmentTranscription('rec-1', 0)).rejects.toThrow(
        'Segment transcription failed',
      );
    });
  });

  describe('triggerStitchTranscripts', () => {
    it('invokes transcribe with stitch mode', async () => {
      mockInvoke.mockResolvedValue({ error: null });
      await triggerStitchTranscripts('rec-1');
      expect(mockInvoke).toHaveBeenCalledWith('transcribe', {
        body: { recordingId: 'rec-1', mode: 'stitch' },
      });
    });
  });

  describe('triggerTranscription (legacy)', () => {
    it('invokes transcribe without mode', async () => {
      mockInvoke.mockResolvedValue({ error: null });
      await triggerTranscription('rec-1');
      expect(mockInvoke).toHaveBeenCalledWith('transcribe', {
        body: { recordingId: 'rec-1' },
      });
    });
  });

  describe('triggerSummarization', () => {
    it('invokes summarize', async () => {
      mockInvoke.mockResolvedValue({ error: null });
      await triggerSummarization('rec-1');
      expect(mockInvoke).toHaveBeenCalledWith('summarize', {
        body: { recordingId: 'rec-1' },
      });
    });
  });

  describe('getTranscript', () => {
    it('returns transcript data', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 't-1' }, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getTranscript('rec-1');
      expect(result).toEqual({ id: 't-1' });
    });

    it('returns null on error', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getTranscript('rec-1');
      expect(result).toBeNull();
    });
  });

  describe('getSummary', () => {
    it('returns null on error', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getSummary('rec-1');
      expect(result).toBeNull();
    });
  });
});
