import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabRecorder } from './recorder';

// Mock chrome APIs
const mockChrome = {
  tabCapture: {
    getMediaStreamId: vi.fn(),
  },
  runtime: {
    sendMessage: vi.fn(),
    getContexts: vi.fn(),
    lastError: null as chrome.runtime.LastError | null,
    ContextType: { OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT' },
  },
  offscreen: {
    createDocument: vi.fn(),
    Reason: { USER_MEDIA: 'USER_MEDIA' },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
};

vi.stubGlobal('chrome', mockChrome);

describe('TabRecorder', () => {
  let recorder: TabRecorder;

  beforeEach(() => {
    vi.clearAllMocks();
    recorder = new TabRecorder();

    // Default mocks
    mockChrome.runtime.getContexts.mockResolvedValue([]);
    mockChrome.offscreen.createDocument.mockResolvedValue(undefined);
    mockChrome.action.setBadgeText.mockResolvedValue(undefined);
    mockChrome.action.setBadgeBackgroundColor.mockResolvedValue(undefined);

    mockChrome.tabCapture.getMediaStreamId.mockImplementation(
      (_opts: unknown, cb: (id: string) => void) => {
        cb('mock-stream-id');
      },
    );

    mockChrome.runtime.sendMessage.mockResolvedValue({ success: true, micEnabled: true });
  });

  describe('getState', () => {
    it('returns initial idle state', () => {
      const state = recorder.getState();
      expect(state.isRecording).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.startTime).toBeNull();
      expect(state.tabId).toBeNull();
      expect(state.micEnabled).toBe(false);
    });
  });

  describe('startRecording', () => {
    it('sets recording state', async () => {
      await recorder.startRecording(42);
      const state = recorder.getState();
      expect(state.isRecording).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.tabId).toBe(42);
      expect(state.startTime).toBeTypeOf('number');
    });

    it('creates offscreen document if none exists', async () => {
      await recorder.startRecording(1);
      expect(mockChrome.offscreen.createDocument).toHaveBeenCalledWith({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Recording tab audio via MediaRecorder',
      });
    });

    it('skips offscreen creation if already exists', async () => {
      mockChrome.runtime.getContexts.mockResolvedValue([{ contextType: 'OFFSCREEN_DOCUMENT' }]);
      await recorder.startRecording(1);
      expect(mockChrome.offscreen.createDocument).not.toHaveBeenCalled();
    });

    it('sends start message to offscreen with streamId and enableMic', async () => {
      await recorder.startRecording(1);
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'OFFSCREEN_START_RECORDING',
        target: 'offscreen',
        streamId: 'mock-stream-id',
        enableMic: true,
      });
    });

    it('tracks micEnabled from offscreen response', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({ success: true, micEnabled: false });
      await recorder.startRecording(1);
      expect(recorder.getState().micEnabled).toBe(false);
    });

    it('sets red REC badge', async () => {
      await recorder.startRecording(1);
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: 'REC' });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#EF4444',
      });
    });

    it('throws if already recording', async () => {
      await recorder.startRecording(1);
      await expect(recorder.startRecording(2)).rejects.toThrow('Already recording');
    });

    it('throws on tabCapture failure', async () => {
      mockChrome.tabCapture.getMediaStreamId.mockImplementation(
        (_opts: unknown, cb: (id: string | undefined) => void) => {
          mockChrome.runtime.lastError = { message: 'Permission denied' };
          cb(undefined);
          mockChrome.runtime.lastError = null;
        },
      );
      await expect(recorder.startRecording(1)).rejects.toThrow('Permission denied');
    });
  });

  describe('pauseRecording', () => {
    it('sets paused state', async () => {
      await recorder.startRecording(1);
      await recorder.pauseRecording();
      const state = recorder.getState();
      expect(state.isPaused).toBe(true);
      expect(state.isRecording).toBe(true);
    });

    it('sets yellow pause badge', async () => {
      await recorder.startRecording(1);
      vi.clearAllMocks();
      mockChrome.action.setBadgeText.mockResolvedValue(undefined);
      mockChrome.action.setBadgeBackgroundColor.mockResolvedValue(undefined);
      mockChrome.runtime.sendMessage.mockResolvedValue({ success: true });

      await recorder.pauseRecording();
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '||' });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#EAB308',
      });
    });

    it('does nothing if not recording', async () => {
      await recorder.pauseRecording();
      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('resumeRecording', () => {
    it('resumes from paused state', async () => {
      await recorder.startRecording(1);
      await recorder.pauseRecording();
      await recorder.resumeRecording();
      const state = recorder.getState();
      expect(state.isPaused).toBe(false);
      expect(state.isRecording).toBe(true);
    });

    it('does nothing if not paused', async () => {
      await recorder.startRecording(1);
      vi.clearAllMocks();
      await recorder.resumeRecording();
      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('stopRecording', () => {
    it('resets state and returns blob', async () => {
      // Mock stop response with base64 audio
      const testData = 'hello';
      const base64 = btoa(testData);
      mockChrome.runtime.sendMessage.mockImplementation(
        (msg: { type: string; target?: string }) => {
          if (msg.type === 'OFFSCREEN_STOP_RECORDING') {
            return Promise.resolve({
              audioBase64: base64,
              mimeType: 'audio/webm;codecs=opus',
            });
          }
          return Promise.resolve({ success: true });
        },
      );

      await recorder.startRecording(1);
      const blob = await recorder.stopRecording();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/webm;codecs=opus');
      expect(blob.size).toBe(testData.length);

      const state = recorder.getState();
      expect(state.isRecording).toBe(false);
      expect(state.tabId).toBeNull();
    });

    it('clears badge', async () => {
      mockChrome.runtime.sendMessage.mockImplementation(
        (msg: { type: string; target?: string }) => {
          if (msg.type === 'OFFSCREEN_STOP_RECORDING') {
            return Promise.resolve({ audioBase64: btoa('x'), mimeType: 'audio/webm' });
          }
          return Promise.resolve({ success: true });
        },
      );

      await recorder.startRecording(1);
      vi.clearAllMocks();
      mockChrome.action.setBadgeText.mockResolvedValue(undefined);
      mockChrome.action.setBadgeBackgroundColor.mockResolvedValue(undefined);

      await recorder.stopRecording();
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('throws if not recording', async () => {
      await expect(recorder.stopRecording()).rejects.toThrow('Not recording');
    });
  });

  describe('full lifecycle', () => {
    it('start → pause → resume → stop', async () => {
      const base64 = btoa('audio-data');
      mockChrome.runtime.sendMessage.mockImplementation(
        (msg: { type: string; target?: string }) => {
          if (msg.type === 'OFFSCREEN_STOP_RECORDING') {
            return Promise.resolve({
              audioBase64: base64,
              mimeType: 'audio/webm;codecs=opus',
            });
          }
          return Promise.resolve({ success: true });
        },
      );

      await recorder.startRecording(10);
      expect(recorder.getState().isRecording).toBe(true);

      await recorder.pauseRecording();
      expect(recorder.getState().isPaused).toBe(true);

      await recorder.resumeRecording();
      expect(recorder.getState().isPaused).toBe(false);

      const blob = await recorder.stopRecording();
      expect(blob.size).toBeGreaterThan(0);
      expect(recorder.getState().isRecording).toBe(false);
    });
  });
});
