/**
 * Offscreen document script — handles actual MediaRecorder in a DOM context.
 * Supports mixing tab audio + microphone audio via AudioContext.
 */

let mediaRecorder: MediaRecorder | null = null;
let tabStream: MediaStream | null = null;
let micStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let chunks: Blob[] = [];
let micEnabled = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  switch (message.type) {
    case 'OFFSCREEN_START_RECORDING':
      handleStart(message.streamId, message.enableMic as boolean | undefined)
        .then((result) => sendResponse({ success: true, micEnabled: result.micEnabled }))
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

    case 'OFFSCREEN_GET_MIC_STATUS':
      sendResponse({ micEnabled });
      return false;
  }

  return false;
});

async function getMicStream(): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err) {
    console.warn('Microphone access denied or unavailable, recording tab audio only:', err);
    return null;
  }
}

function createMixedStream(tab: MediaStream, mic: MediaStream | null): { stream: MediaStream; ctx: AudioContext } {
  const ctx = new AudioContext();
  const destination = ctx.createMediaStreamDestination();

  // Tab audio source
  const tabSource = ctx.createMediaStreamSource(tab);
  tabSource.connect(destination);

  // Mic audio source (if available)
  if (mic) {
    const micSource = ctx.createMediaStreamSource(mic);
    // Slightly lower mic volume to balance with tab audio
    const micGain = ctx.createGain();
    micGain.gain.value = 0.8;
    micSource.connect(micGain);
    micGain.connect(destination);
  }

  return { stream: destination.stream, ctx };
}

async function handleStart(streamId: string, enableMic?: boolean): Promise<{ micEnabled: boolean }> {
  // Get tab audio stream
  tabStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
  });

  // Attempt to get mic if requested (default: true)
  const shouldEnableMic = enableMic !== false;
  micStream = shouldEnableMic ? await getMicStream() : null;
  micEnabled = micStream !== null;

  // Mix streams via AudioContext
  const { stream: mixedStream, ctx } = createMixedStream(tabStream, micStream);
  audioContext = ctx;

  chunks = [];
  mediaRecorder = new MediaRecorder(mixedStream, {
    mimeType: 'audio/webm;codecs=opus',
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Use 5-minute timeslice for segment uploads
  mediaRecorder.start(5 * 60 * 1000);

  return { micEnabled };
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
      tabStream?.getTracks().forEach((t) => t.stop());
      micStream?.getTracks().forEach((t) => t.stop());
      await audioContext?.close().catch(() => {});
      tabStream = null;
      micStream = null;
      audioContext = null;
      mediaRecorder = null;
      micEnabled = false;
      chunks = [];

      resolve({ audioBase64: base64, mimeType: 'audio/webm;codecs=opus' });
    };

    mediaRecorder.stop();
  });
}
