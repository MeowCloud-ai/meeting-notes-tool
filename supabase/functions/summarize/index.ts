import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recordingId } = await req.json();
    if (!recordingId) {
      return new Response(JSON.stringify({ error: 'Missing recordingId' }), { status: 400 });
    }

    // Get transcript
    const { data: transcript, error: trError } = await supabase
      .from('transcripts')
      .select('content')
      .eq('recording_id', recordingId)
      .single();

    if (trError || !transcript) {
      return new Response(JSON.stringify({ error: 'Transcript not found' }), { status: 404 });
    }

    // Call Gemini
    const prompt = `你是會議摘要助手。根據以下會議逐字稿，產出：
1. 重點摘要（highlights）- 3-5 個要點
2. 待辦事項（action_items）- 包含負責人和截止日期（如有）
3. 關鍵對話（key_dialogues）- 最重要的 2-3 段對話

逐字稿：
${transcript.content}

請用 JSON 格式回覆：
{
  "raw_summary": "完整摘要文字",
  "highlights": ["重點1", "重點2", ...],
  "action_items": [{"task": "任務", "assignee": "負責人", "due": "截止日期"}],
  "key_dialogues": [{"timestamp": "時間", "speaker": "說話者", "quote": "內容", "significance": "重要性"}]
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini error:', errText);
      await supabase.from('recordings').update({ status: 'completed' }).eq('id', recordingId);
      return new Response(JSON.stringify({ error: 'Summarization failed' }), { status: 500 });
    }

    const geminiResult = await geminiResponse.json();
    const summaryText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    let summary;
    try {
      summary = JSON.parse(summaryText);
    } catch {
      summary = { raw_summary: summaryText, highlights: [], action_items: [], key_dialogues: [] };
    }

    // Save summary
    await supabase.from('summaries').insert({
      recording_id: recordingId,
      raw_summary: summary.raw_summary || summaryText,
      highlights: summary.highlights || [],
      action_items: summary.action_items || [],
      key_dialogues: summary.key_dialogues || [],
      model: 'gemini-2.0-flash',
    });

    // Mark completed
    await supabase.from('recordings').update({ status: 'completed' }).eq('id', recordingId);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Summarize error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
