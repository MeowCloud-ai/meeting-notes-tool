import { showCompliancePrompt } from './compliance';
import { showRecordingIndicator, hideRecordingIndicator } from './indicator';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'START_RECORDING':
      showCompliancePrompt().then((confirmed) => {
        if (confirmed) {
          showRecordingIndicator();
          sendResponse({ confirmed: true });
        } else {
          sendResponse({ confirmed: false });
        }
      });
      return true;

    case 'STOP_RECORDING':
      hideRecordingIndicator();
      sendResponse({ success: true });
      return false;

    case 'PAUSE_RECORDING':
    case 'RESUME_RECORDING':
      sendResponse({ success: true });
      return false;
  }

  return false;
});

console.log('MeowMeet content script loaded');
