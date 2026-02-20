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

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function mergeWordsToLines(words: DeepgramWord[]): TranscriptLine[] {
  if (words.length === 0) return [];

  const lines: TranscriptLine[] = [];
  let currentSpeaker = words[0]!.speaker;
  let currentTimestamp = words[0]!.start;
  let currentWords: string[] = [];

  for (const word of words) {
    if (word.speaker !== currentSpeaker) {
      lines.push({
        speaker: currentSpeaker,
        timestamp: currentTimestamp,
        text: currentWords.join(' '),
      });
      currentSpeaker = word.speaker;
      currentTimestamp = word.start;
      currentWords = [];
    }
    currentWords.push(word.punctuated_word);
  }

  if (currentWords.length > 0) {
    lines.push({
      speaker: currentSpeaker,
      timestamp: currentTimestamp,
      text: currentWords.join(' '),
    });
  }

  return lines;
}

export function formatTranscript(lines: TranscriptLine[]): string {
  return lines
    .map((line) => `[Speaker ${line.speaker + 1}] ${formatTimestamp(line.timestamp)} - ${line.text}`)
    .join('\n');
}

export function extractSpeakers(lines: TranscriptLine[]): Array<{ id: string; name: string }> {
  const speakerSet = new Set(lines.map((l) => l.speaker));
  return Array.from(speakerSet)
    .sort((a, b) => a - b)
    .map((s) => ({ id: String(s), name: `Speaker ${s + 1}` }));
}

serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { recordingId } = await req.json();
    if (!recordingId) {
      return new Response(JSON.stringify({ error: 'Missing recordingId' }), { status: 400 });
    }

    // Update status to transcribing
    await supabase
      .from('recordings')
      .update({ status: 'transcribing' })
      .eq('id', recordingId);

    // Get recording to find segments
    const { data: recording, error: recError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recError || !recording) {
      return new Response(JSON.stringify({ error: 'Recording not found' }), { status: 404 });
    }

    // Download and concatenate all segments
    const segmentBlobs: Uint8Array[] = [];
    for (let i = 0; i < recording.segment_count; i++) {
      const path = `recordings/${user.id}/${recordingId}/segment-${i}.webm`;
      const { data, error } = await supabase.storage.from('recordings').download(path);
      if (error || !data) {
        throw new Error(`Failed to download segment ${i}: ${error?.message}`);
      }
      segmentBlobs.push(new Uint8Array(await data.arrayBuffer()));
    }

    // Merge segments into single buffer
    const totalLength = segmentBlobs.reduce((sum, b) => sum + b.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const blob of segmentBlobs) {
      merged.set(blob, offset);
      offset += blob.length;
    }

    // Call Deepgram API
    const dgResponse = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=zh-TW&diarize=true&punctuate=true&smart_format=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${deepgramApiKey}`,
          'Content-Type': 'audio/webm',
        },
        body: merged,
      }
    );

    if (!dgResponse.ok) {
      const errText = await dgResponse.text();
      throw new Error(`Deepgram API error: ${dgResponse.status} ${errText}`);
    }

    const dgResult: DeepgramResponse = await dgResponse.json();
    const words = dgResult.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
    const lines = mergeWordsToLines(words);
    const content = formatTranscript(lines);
    const speakers = extractSpeakers(lines);
    const wordCount = words.length;

    // Save transcript
    const { data: transcript, error: insertError } = await supabase
      .from('transcripts')
      .insert({
        recording_id: recordingId,
        content,
        speakers,
        language: 'zh-TW',
        word_count: wordCount,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save transcript: ${insertError.message}`);
    }

    // Update recording status to summarizing
    await supabase
      .from('recordings')
      .update({ status: 'summarizing' })
      .eq('id', recordingId);

    return new Response(JSON.stringify({ transcript }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
