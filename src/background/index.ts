import { TabRecorder } from './recorder';

const recorder = new TabRecorder();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ignore messages intended for the offscreen document
  if (message.target === 'offscreen') return false;

  switch (message.type) {
    case 'START_RECORDING': {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ success: false, error: 'No tab ID' });
        return false;
      }
      recorder
        .startRecording(tabId)
        .then(() => sendResponse({ success: true, state: recorder.getState() }))
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

    case 'STOP_RECORDING':
      recorder
        .stopRecording()
        .then(() => sendResponse({ success: true, state: recorder.getState() }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'GET_STATE':
      sendResponse({ success: true, state: recorder.getState() });
      return false;
  }

  return false;
});

console.log('MeowMeet background ready');
