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

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recordingId } = await req.json();
    if (!recordingId) {
      return new Response(JSON.stringify({ error: 'Missing recordingId' }), { status: 400 });
    }

    // Get recording
    const { data: recording, error: recError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recError || !recording) {
      return new Response(JSON.stringify({ error: 'Recording not found' }), { status: 404 });
    }

    // Update status
    await supabase.from('recordings').update({ status: 'transcribing' }).eq('id', recordingId);

    // Get audio from storage
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

    // Merge segments
    const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const seg of segments) {
      merged.set(seg, offset);
      offset += seg.length;
    }

    // Send to Deepgram
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
      console.error('Deepgram error:', errText);
      await supabase.from('recordings').update({ status: 'failed' }).eq('id', recordingId);
      return new Response(JSON.stringify({ error: 'Transcription failed: ' + errText }), { status: 500 });
    }

    const dgResult: DeepgramResponse = await dgResponse.json();

    // Format transcript
    const words = dgResult.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
    const fullTranscript = dgResult.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';

    // Group by speaker
    const lines: TranscriptLine[] = [];
    let currentSpeaker = -1;
    let currentText = '';
    let currentTimestamp = 0;

    for (const word of words) {
      if (word.speaker !== currentSpeaker) {
        if (currentText) {
          lines.push({ speaker: currentSpeaker, timestamp: currentTimestamp, text: currentText.trim() });
        }
        currentSpeaker = word.speaker;
        currentTimestamp = word.start;
        currentText = word.punctuated_word + ' ';
      } else {
        currentText += word.punctuated_word + ' ';
      }
    }
    if (currentText) {
      lines.push({ speaker: currentSpeaker, timestamp: currentTimestamp, text: currentText.trim() });
    }

    // Format content
    const content = lines
      .map((l) => `[${formatTimestamp(l.timestamp)}] Speaker ${l.speaker}: ${l.text}`)
      .join('\n');

    // Get unique speakers
    const speakers = [...new Set(words.map((w) => w.speaker))].map((s) => ({
      id: s,
      label: `Speaker ${s}`,
    }));

    // Save transcript
    await supabase.from('transcripts').insert({
      recording_id: recordingId,
      content: content || fullTranscript,
      speakers,
      language: 'zh-TW',
      word_count: words.length,
    });

    // Update status to summarizing
    await supabase.from('recordings').update({ status: 'summarizing' }).eq('id', recordingId);

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

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Transcribe error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
