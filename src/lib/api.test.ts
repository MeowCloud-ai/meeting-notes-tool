import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerTranscription, triggerSummarization, getTranscript, getSummary } from './api';

// Mock supabase
const mockInvoke = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return { single: () => mockSingle() };
          },
        };
      },
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('triggerTranscription', () => {
  it('calls transcribe edge function', async () => {
    mockInvoke.mockResolvedValue({ data: {}, error: null });
    await triggerTranscription('rec-123');
    expect(mockInvoke).toHaveBeenCalledWith('transcribe', { body: { recordingId: 'rec-123' } });
  });

  it('throws on error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(triggerTranscription('rec-123')).rejects.toThrow('Transcription failed');
  });
});

describe('triggerSummarization', () => {
  it('calls summarize edge function', async () => {
    mockInvoke.mockResolvedValue({ data: {}, error: null });
    await triggerSummarization('rec-123');
    expect(mockInvoke).toHaveBeenCalledWith('summarize', { body: { recordingId: 'rec-123' } });
  });

  it('throws on error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(triggerSummarization('rec-123')).rejects.toThrow('Summarization failed');
  });
});

describe('getTranscript', () => {
  it('returns transcript data', async () => {
    const transcript = { id: 't1', recording_id: 'rec-123', content: 'hello' };
    mockSingle.mockResolvedValue({ data: transcript, error: null });
    const result = await getTranscript('rec-123');
    expect(result).toEqual(transcript);
  });

  it('returns null on error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const result = await getTranscript('rec-999');
    expect(result).toBeNull();
  });
});

describe('getSummary', () => {
  it('returns summary data', async () => {
    const summary = { id: 's1', recording_id: 'rec-123', raw_summary: 'test' };
    mockSingle.mockResolvedValue({ data: summary, error: null });
    const result = await getSummary('rec-123');
    expect(result).toEqual(summary);
  });

  it('returns null on error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const result = await getSummary('rec-999');
    expect(result).toBeNull();
  });
});
