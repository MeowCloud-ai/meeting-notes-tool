/**
 * TabRecorder — coordinates tab audio recording via offscreen document.
 *
 * Flow:
 * 1. SW calls chrome.tabCapture.getMediaStreamId() to get a streamId
 * 2. SW ensures an offscreen document is alive
 * 3. SW sends streamId to offscreen doc which creates MediaRecorder
 * 4. Offscreen doc handles chunks & returns base64 audio on stop
 */

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  tabId: number | null;
}

const INITIAL_STATE: RecordingState = {
  isRecording: false,
  isPaused: false,
  startTime: null,
  tabId: null,
};

export class TabRecorder {
  private state: RecordingState = { ...INITIAL_STATE };

  async startRecording(tabId: number): Promise<void> {
    if (this.state.isRecording) {
      throw new Error('Already recording');
    }

    await this.ensureOffscreenDocument();

    const streamId = await this.getMediaStreamId(tabId);

    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_START_RECORDING',
      target: 'offscreen',
      streamId,
    });

    this.state = {
      isRecording: true,
      isPaused: false,
      startTime: Date.now(),
      tabId,
    };

    await this.updateBadge();
  }

  async pauseRecording(): Promise<void> {
    if (!this.state.isRecording || this.state.isPaused) return;

    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_PAUSE_RECORDING',
      target: 'offscreen',
    });

    this.state.isPaused = true;
    await this.updateBadge();
  }

  async resumeRecording(): Promise<void> {
    if (!this.state.isRecording || !this.state.isPaused) return;

    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_RESUME_RECORDING',
      target: 'offscreen',
    });

    this.state.isPaused = false;
    await this.updateBadge();
  }

  async stopRecording(): Promise<Blob> {
    if (!this.state.isRecording) {
      throw new Error('Not recording');
    }

    const response = (await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_STOP_RECORDING',
      target: 'offscreen',
    })) as { audioBase64: string; mimeType: string };

    this.state = { ...INITIAL_STATE };
    await this.updateBadge();

    const binary = atob(response.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: response.mimeType });
  }

  getState(): RecordingState {
    return { ...this.state };
  }

  private async getMediaStreamId(tabId: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
        if (chrome.runtime.lastError || !id) {
          reject(new Error(chrome.runtime.lastError?.message ?? 'getMediaStreamId failed'));
        } else {
          resolve(id);
        }
      });
    });
  }

  private async updateBadge(): Promise<void> {
    if (this.state.isRecording && !this.state.isPaused) {
      await chrome.action.setBadgeText({ text: 'REC' });
      await chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    } else if (this.state.isRecording && this.state.isPaused) {
      await chrome.action.setBadgeText({ text: '||' });
      await chrome.action.setBadgeBackgroundColor({ color: '#EAB308' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  }

  private async ensureOffscreenDocument(): Promise<void> {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    });
    if (contexts.length > 0) return;

    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'Recording tab audio via MediaRecorder',
    });
  }
}
