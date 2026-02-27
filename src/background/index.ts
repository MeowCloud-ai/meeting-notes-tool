import { TabRecorder } from './recorder';
import { RecordingManager } from '../lib/recording-manager';
import { supabase } from '../lib/supabase';

const recorder = new TabRecorder();
let recordingManager: RecordingManager | null = null;

// Store processing status so popup can read it
async function setProcessingStatus(status: string | null) {
  await chrome.storage.local.set({
    meowmeet_processing: status,
    ...(status && status.startsWith('錯誤') ? { meowmeet_last_error: status } : {}),
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target === 'offscreen') return false;

  switch (message.type) {
    case 'START_RECORDING': {
      chrome.tabs.query({ active: true, currentWindow: true })
        .then(async (tabs) => {
          const tab = tabs[0];
          const tabId = tab?.id;
          if (!tabId) {
            sendResponse({ success: false, error: 'No active tab found' });
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            sendResponse({ success: false, error: 'Not authenticated — please sign out and sign in again' });
            return;
          }

          recordingManager = new RecordingManager(user.id);
          await recordingManager.createRecording(tab.url ?? null, tab.title ?? null);
          recordingManager.startDurationTimers();
          await recorder.startRecording(tabId);
          await setProcessingStatus(null);
          sendResponse({ success: true, state: recorder.getState() });
        })
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    case 'PAUSE_RECORDING':
      recorder
        .pauseRecording()
        .then(() => sendResponse({ success: true, state: recorder.getState() }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'RESUME_RECORDING':
      recorder
        .resumeRecording()
        .then(() => sendResponse({ success: true, state: recorder.getState() }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'STOP_RECORDING': {
      const state = recorder.getState();
      if (!state.isRecording) {
        sendResponse({ success: false, error: 'Not recording' });
        return false;
      }

      const startTime = state.startTime ?? Date.now();
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      // Respond immediately so popup doesn't hang
      setProcessingStatus('正在停止錄音...').catch(() => {});

      recorder
        .stopRecording()
        .then(async (audioBlob) => {
          console.log('Recording stopped, blob size:', audioBlob.size);
          sendResponse({ success: true, state: recorder.getState() });

          // Upload and transcribe in background (after responding to popup)
          if (recordingManager) {
            try {
              await setProcessingStatus('上傳音檔中...');
              await recordingManager.handleSegment(audioBlob);
              await setProcessingStatus('轉錄中...');
              await recordingManager.completeRecording(durationSeconds);
              await setProcessingStatus('完成！');
              console.log('Recording completed and transcription triggered');
            } catch (uploadErr) {
              console.error('Upload/transcription failed:', uploadErr);
              const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
              await setProcessingStatus('❌ ' + errMsg);
              await chrome.storage.local.set({ meowmeet_last_error: errMsg });
              await recordingManager.failRecording(errMsg);
            } finally {
              recordingManager.clearDurationTimers();
              recordingManager = null;
              // Keep error visible for 60s
              setTimeout(() => setProcessingStatus(null), 60000);
            }
          }
        })
        .catch(async (err: Error) => {
          console.error('Stop recording failed:', err);
          await setProcessingStatus('停止失敗: ' + err.message);
          if (recordingManager) {
            await recordingManager.failRecording(err.message);
            recordingManager = null;
          }
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'GET_STATE': {
      chrome.storage.local.get(['meowmeet_processing', 'meowmeet_last_error']).then((result) => {
        sendResponse({
          success: true,
          state: recorder.getState(),
          processing: (result.meowmeet_processing as string) ?? null,
          lastError: (result.meowmeet_last_error as string) ?? null,
        });
      });
      return true;
    }

    case 'CLEAR_ERROR': {
      chrome.storage.local.remove('meowmeet_last_error').then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  }

  return false;
});

console.log('MeowMeet background ready');
