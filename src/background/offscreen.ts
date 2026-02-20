/**
 * Offscreen document script — handles actual MediaRecorder in a DOM context.
 */

let mediaRecorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let chunks: Blob[] = [];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  switch (message.type) {
    case 'OFFSCREEN_START_RECORDING':
      handleStart(message.streamId)
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'OFFSCREEN_PAUSE_RECORDING':
      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.pause();
      }
      sendResponse({ success: true });
      return false;

    case 'OFFSCREEN_RESUME_RECORDING':
      if (mediaRecorder?.state === 'paused') {
        mediaRecorder.resume();
      }
      sendResponse({ success: true });
      return false;

    case 'OFFSCREEN_STOP_RECORDING':
      handleStop()
        .then((result) => sendResponse(result))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;
  }

  return false;
});

async function handleStart(streamId: string): Promise<void> {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
  });

  chunks = [];
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus',
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Use 5-minute timeslice for segment uploads
  mediaRecorder.start(5 * 60 * 1000);
}

async function handleStop(): Promise<{ audioBase64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No active recorder'));
      return;
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });

      // Convert to base64 for transfer back to SW
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      const base64 = btoa(binary);

      // Cleanup
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      mediaRecorder = null;
      chunks = [];

      resolve({ audioBase64: base64, mimeType: 'audio/webm;codecs=opus' });
    };

    mediaRecorder.stop();
  });
}
