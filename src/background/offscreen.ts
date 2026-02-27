/**
 * Offscreen document script — handles actual MediaRecorder in a DOM context.
 * Supports mixing tab audio + microphone audio via AudioContext.
 * Emits segments every SEGMENT_DURATION_MS to background for upload.
 */

export const DEFAULT_SEGMENT_DURATION_MS = 3 * 60 * 1000; // 3 minutes

let mediaRecorder: MediaRecorder | null = null;
let tabStream: MediaStream | null = null;
let micStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let segmentIndex = 0;
let micEnabled = false;
let segmentDurationMs = DEFAULT_SEGMENT_DURATION_MS;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  switch (message.type) {
    case 'OFFSCREEN_START_RECORDING':
      handleStart(
        message.streamId,
        message.enableMic as boolean | undefined,
        message.segmentDurationMs as number | undefined,
      )
        .then((result) => sendResponse({ success: true, micEnabled: result.micEnabled }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'OFFSCREEN_PAUSE_RECORDING':
      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.pause();
        sendResponse({ success: true, state: 'paused' });
      } else {
        sendResponse({ success: false, error: `Cannot pause: recorder state is ${mediaRecorder?.state ?? 'null'}` });
      }
      return false;

    case 'OFFSCREEN_RESUME_RECORDING':
      if (mediaRecorder?.state === 'paused') {
        const tabAlive = tabStream?.getTracks().some((t) => t.readyState === 'live') ?? false;
        if (!tabAlive) {
          sendResponse({ success: false, error: 'Tab audio stream ended during pause' });
          return false;
        }
        mediaRecorder.resume();
        sendResponse({ success: true, state: 'recording' });
      } else {
        sendResponse({ success: false, error: `Cannot resume: recorder state is ${mediaRecorder?.state ?? 'null'}` });
      }
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

  const tabSource = ctx.createMediaStreamSource(tab);
  tabSource.connect(destination);

  if (mic) {
    const micSource = ctx.createMediaStreamSource(mic);
    const micGain = ctx.createGain();
    micGain.gain.value = 0.8;
    micSource.connect(micGain);
    micGain.connect(destination);
  }

  return { stream: destination.stream, ctx };
}

/**
 * Send a completed segment blob to the background service worker.
 * Uses base64 encoding since structured clone isn't available across contexts.
 */
async function sendSegmentToBackground(blob: Blob, index: number): Promise<void> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);

  chrome.runtime.sendMessage({
    type: 'SEGMENT_READY',
    segmentIndex: index,
    audioBase64: base64,
    mimeType: 'audio/webm;codecs=opus',
  });
}

async function handleStart(
  streamId: string,
  enableMic?: boolean,
  customSegmentDurationMs?: number,
): Promise<{ micEnabled: boolean }> {
  segmentIndex = 0;
  segmentDurationMs = customSegmentDurationMs ?? DEFAULT_SEGMENT_DURATION_MS;

  tabStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
  });

  const shouldEnableMic = enableMic !== false;
  micStream = shouldEnableMic ? await getMicStream() : null;
  micEnabled = micStream !== null;

  const { stream: mixedStream, ctx } = createMixedStream(tabStream, micStream);
  audioContext = ctx;

  // Accumulate chunks between timeslice boundaries
  let currentChunks: Blob[] = [];

  mediaRecorder = new MediaRecorder(mixedStream, {
    mimeType: 'audio/webm;codecs=opus',
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      currentChunks.push(e.data);
      // When timeslice fires, ondataavailable is called with current data.
      // We treat each timeslice boundary as a segment boundary.
      const segBlob = new Blob(currentChunks, { type: 'audio/webm;codecs=opus' });
      const idx = segmentIndex;
      segmentIndex++;
      currentChunks = [];
      sendSegmentToBackground(segBlob, idx).catch((err) =>
        console.error('Failed to send segment to background:', err),
      );
    }
  };

  mediaRecorder.start(segmentDurationMs);

  return { micEnabled };
}

async function handleStop(): Promise<{ stopped: true; finalSegmentIndex: number }> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No active recorder'));
      return;
    }

    mediaRecorder.onstop = async () => {
      // Cleanup streams
      tabStream?.getTracks().forEach((t) => t.stop());
      micStream?.getTracks().forEach((t) => t.stop());
      await audioContext?.close().catch(() => {});
      tabStream = null;
      micStream = null;
      audioContext = null;

      const finalIdx = segmentIndex;
      mediaRecorder = null;
      micEnabled = false;
      segmentIndex = 0;

      resolve({ stopped: true, finalSegmentIndex: finalIdx });
    };

    // Calling stop() triggers one final ondataavailable with remaining data
    mediaRecorder.stop();
  });
}
