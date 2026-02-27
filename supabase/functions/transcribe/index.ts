import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  speaker: number;
  punctuated_word: string;
}

interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        words: DeepgramWord[];
        transcript: string;
      }>;
    }>;
  };
}

interface TranscriptLine {
  speaker: number;
  timestamp: number;
  text: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function groupBySpeaker(words: DeepgramWord[], timeOffsetSeconds = 0): {
  lines: TranscriptLine[];
  lastSpeakerId: number;
} {
  const lines: TranscriptLine[] = [];
  let currentSpeaker = -1;
  let currentText = '';
  let currentTimestamp = 0;

  for (const word of words) {
    if (word.speaker !== currentSpeaker) {
      if (currentText) {
        lines.push({
          speaker: currentSpeaker,
          timestamp: currentTimestamp + timeOffsetSeconds,
          text: currentText.trim(),
        });
      }
      currentSpeaker = word.speaker;
      currentTimestamp = word.start;
      currentText = word.punctuated_word + ' ';
    } else {
      currentText += word.punctuated_word + ' ';
    }
  }
  if (currentText) {
    lines.push({
      speaker: currentSpeaker,
      timestamp: currentTimestamp + timeOffsetSeconds,
      text: currentText.trim(),
    });
  }

  return { lines, lastSpeakerId: currentSpeaker };
}

async function transcribeAudio(
  audioData: Uint8Array,
  deepgramApiKey: string,
): Promise<DeepgramResponse> {
  const dgResponse = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&language=zh-TW&diarize=true&punctuate=true&smart_format=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        'Content-Type': 'audio/webm',
      },
      body: audioData,
    },
  );

  if (!dgResponse.ok) {
    const errText = await dgResponse.text();
    throw new Error('Deepgram error: ' + errText);
  }

  return dgResponse.json();
}

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recordingId, segmentIndex, mode } = await req.json();
    if (!recordingId) {
      return new Response(JSON.stringify({ error: 'Missing recordingId' }), { status: 400 });
    }

    // ─── Mode: segment — transcribe a single segment ───
    if (mode === 'segment' && segmentIndex !== undefined) {
      return await handleSegmentTranscription(
        supabase,
        deepgramApiKey,
        recordingId,
        segmentIndex,
      );
    }

    // ─── Mode: stitch — merge all segment transcripts ───
    if (mode === 'stitch') {
      return await handleStitch(supabase, supabaseUrl, supabaseServiceKey, recordingId);
    }

    // ─── Legacy mode — full recording transcription ───
    return await handleLegacyTranscription(
      supabase,
      supabaseUrl,
      supabaseServiceKey,
      deepgramApiKey,
      recordingId,
    );
  } catch (err) {
    console.error('Transcribe error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

async function handleSegmentTranscription(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  deepgramApiKey: string,
  recordingId: string,
  segmentIndex: number,
): Promise<Response> {
  // Get segment info
  const { data: segment, error: segErr } = await supabase
    .from('recording_segments')
    .select('*')
    .eq('recording_id', recordingId)
    .eq('segment_index', segmentIndex)
    .single();

  if (segErr || !segment) {
    return new Response(JSON.stringify({ error: 'Segment not found' }), { status: 404 });
  }

  // Update status
  await supabase
    .from('recording_segments')
    .update({ status: 'transcribing' })
    .eq('id', segment.id);

  // Download audio
  const { data: audioData, error: dlErr } = await supabase.storage
    .from('recordings')
    .download(segment.storage_path);

  if (dlErr || !audioData) {
    await supabase.from('recording_segments').update({ status: 'failed' }).eq('id', segment.id);
    return new Response(JSON.stringify({ error: 'Failed to download segment audio' }), {
      status: 500,
    });
  }

  const audioBytes = new Uint8Array(await audioData.arrayBuffer());

  try {
    const dgResult = await transcribeAudio(audioBytes, deepgramApiKey);
    const words = dgResult.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
    const { lines, lastSpeakerId } = groupBySpeaker(words);

    const content = lines
      .map((l) => `[${formatTimestamp(l.timestamp)}] Speaker ${l.speaker}: ${l.text}`)
      .join('\n');

    const speakers = [...new Set(words.map((w) => w.speaker))].map((s) => ({
      id: s,
      label: `Speaker ${s}`,
    }));

    await supabase
      .from('recording_segments')
      .update({
        status: 'transcribed',
        transcript_content: content,
        speakers,
        word_count: words.length,
        last_speaker_id: lastSpeakerId,
        transcribed_at: new Date().toISOString(),
      })
      .eq('id', segment.id);

    return new Response(JSON.stringify({ success: true, segmentIndex }), { status: 200 });
  } catch (err) {
    await supabase.from('recording_segments').update({ status: 'failed' }).eq('id', segment.id);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

async function handleStitch(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  recordingId: string,
): Promise<Response> {
  await supabase
    .from('recordings')
    .update({ status: 'transcribing' })
    .eq('id', recordingId);

  // Wait for all segments to be transcribed (poll with backoff, max 5 min)
  const maxWaitMs = 5 * 60 * 1000;
  const startTime = Date.now();
  let allDone = false;

  while (Date.now() - startTime < maxWaitMs) {
    const { data: segments } = await supabase
      .from('recording_segments')
      .select('status, segment_index, transcript_content, speakers, last_speaker_id')
      .eq('recording_id', recordingId)
      .order('segment_index', { ascending: true });

    if (!segments || segments.length === 0) {
      // No segments — nothing to stitch
      break;
    }

    const pending = segments.filter(
      // deno-lint-ignore no-explicit-any
      (s: any) => s.status !== 'transcribed' && s.status !== 'failed',
    );

    if (pending.length === 0) {
      allDone = true;

      // Stitch transcripts
      // deno-lint-ignore no-explicit-any
      const transcribed = segments.filter((s: any) => s.status === 'transcribed');
      // deno-lint-ignore no-explicit-any
      const fullContent = transcribed.map((s: any) => s.transcript_content).join('\n');

      // Collect all unique speakers across segments
      const allSpeakers = new Map<number, string>();
      // deno-lint-ignore no-explicit-any
      for (const seg of transcribed) {
        if (seg.speakers) {
          // deno-lint-ignore no-explicit-any
          for (const sp of seg.speakers as any[]) {
            if (!allSpeakers.has(sp.id)) {
              allSpeakers.set(sp.id, sp.label);
            }
          }
        }
      }
      const speakers = Array.from(allSpeakers.entries()).map(([id, label]) => ({ id, label }));

      // deno-lint-ignore no-explicit-any
      const totalWords = transcribed.reduce((sum: number, s: any) => sum + (s.word_count || 0), 0);

      // Save stitched transcript
      await supabase.from('transcripts').insert({
        recording_id: recordingId,
        content: fullContent,
        speakers,
        language: 'zh-TW',
        word_count: totalWords,
      });

      // Update to summarizing
      await supabase
        .from('recordings')
        .update({ status: 'summarizing' })
        .eq('id', recordingId);

      // Trigger summarization
      const sumResponse = await fetch(`${supabaseUrl}/functions/v1/summarize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordingId }),
      });

      if (!sumResponse.ok) {
        console.error('Summarize trigger failed:', await sumResponse.text());
      }

      break;
    }

    // Wait before polling again
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (!allDone) {
    console.error('Stitch timed out or no segments found');
    await supabase.from('recordings').update({ status: 'failed' }).eq('id', recordingId);
    return new Response(JSON.stringify({ error: 'Stitch timed out' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

async function handleLegacyTranscription(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  deepgramApiKey: string,
  recordingId: string,
): Promise<Response> {
  const { data: recording, error: recError } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', recordingId)
    .single();

  if (recError || !recording) {
    return new Response(JSON.stringify({ error: 'Recording not found' }), { status: 404 });
  }

  await supabase.from('recordings').update({ status: 'transcribing' }).eq('id', recordingId);

  const segments: Uint8Array[] = [];
  for (let i = 0; i < (recording.segment_count || 1); i++) {
    const path = `${recording.user_id}/${recordingId}/segment_${i}.webm`;
    const { data, error } = await supabase.storage.from('recordings').download(path);
    if (error) {
      console.error(`Failed to download segment ${i}:`, error);
      continue;
    }
    segments.push(new Uint8Array(await data.arrayBuffer()));
  }

  if (segments.length === 0) {
    await supabase.from('recordings').update({ status: 'failed' }).eq('id', recordingId);
    return new Response(JSON.stringify({ error: 'No audio segments found' }), { status: 400 });
  }

  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const seg of segments) {
    merged.set(seg, offset);
    offset += seg.length;
  }

  try {
    const dgResult = await transcribeAudio(merged, deepgramApiKey);
    const words = dgResult.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
    const fullTranscript = dgResult.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
    const { lines } = groupBySpeaker(words);

    const content = lines
      .map((l) => `[${formatTimestamp(l.timestamp)}] Speaker ${l.speaker}: ${l.text}`)
      .join('\n');

    const speakers = [...new Set(words.map((w) => w.speaker))].map((s) => ({
      id: s,
      label: `Speaker ${s}`,
    }));

    await supabase.from('transcripts').insert({
      recording_id: recordingId,
      content: content || fullTranscript,
      speakers,
      language: 'zh-TW',
      word_count: words.length,
    });

    await supabase.from('recordings').update({ status: 'summarizing' }).eq('id', recordingId);

    const sumResponse = await fetch(`${supabaseUrl}/functions/v1/summarize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recordingId }),
    });

    if (!sumResponse.ok) {
      console.error('Summarize trigger failed:', await sumResponse.text());
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    await supabase.from('recordings').update({ status: 'failed' }).eq('id', recordingId);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
