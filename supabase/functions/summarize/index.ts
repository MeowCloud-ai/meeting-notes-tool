import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface SummaryResult {
  highlights: string[];
  action_items: Array<{
    assignee: string;
    task: string;
    deadline: string;
  }>;
  key_dialogues: Array<{
    speaker: string;
    timestamp: string;
    content: string;
    context: string;
  }>;
  raw_summary: string;
}

export function buildPrompt(transcript: string): string {
  return `你是專業的會議記錄助手。請分析以下會議逐字稿，產出結構化摘要。

## 輸出格式（JSON）
{
  "highlights": ["重點結論1", "重點結論2"],
  "action_items": [
    {"assignee": "講者名稱", "task": "待辦事項", "deadline": "期限（如有提到）"}
  ],
  "key_dialogues": [
    {"speaker": "講者", "timestamp": "時間", "content": "關鍵對話內容", "context": "為什麼重要"}
  ],
  "raw_summary": "3-5句的會議總結"
}

## 逐字稿
${transcript}

請用繁體中文輸出。只輸出 JSON，不要包含 markdown code block。`;
}

export function parseSummaryJSON(text: string): SummaryResult {
  // Strip markdown code block if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned) as SummaryResult;

  // Validate required fields
  if (!Array.isArray(parsed.highlights)) {
    parsed.highlights = [];
  }
  if (!Array.isArray(parsed.action_items)) {
    parsed.action_items = [];
  }
  if (!Array.isArray(parsed.key_dialogues)) {
    parsed.key_dialogues = [];
  }
  if (typeof parsed.raw_summary !== 'string') {
    parsed.raw_summary = '';
  }

  return parsed;
}

serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

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

    // Update status to summarizing
    await supabase
      .from('recordings')
      .update({ status: 'summarizing' })
      .eq('id', recordingId);

    // Get transcript
    const { data: transcript, error: txError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('recording_id', recordingId)
      .single();

    if (txError || !transcript) {
      return new Response(JSON.stringify({ error: 'Transcript not found' }), { status: 404 });
    }

    // Call Gemini API
    const prompt = buildPrompt(transcript.content);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} ${errText}`);
    }

    const geminiResult: GeminiResponse = await geminiResponse.json();
    const responseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    const summaryData = parseSummaryJSON(responseText);

    // Transform key_dialogues to match DB schema
    const keyDialogues = summaryData.key_dialogues.map((d) => ({
      speaker: d.speaker,
      text: `${d.content} (${d.context})`,
      timestamp_seconds: null,
    }));

    const actionItems = summaryData.action_items.map((a) => ({
      text: a.task,
      assignee: a.assignee || null,
      due_date: a.deadline || null,
    }));

    // Save summary
    const { data: summary, error: insertError } = await supabase
      .from('summaries')
      .insert({
        recording_id: recordingId,
        highlights: summaryData.highlights,
        action_items: actionItems,
        key_dialogues: keyDialogues,
        raw_summary: summaryData.raw_summary,
        model: 'gemini-2.0-flash',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save summary: ${insertError.message}`);
    }

    // Update recording status to completed
    await supabase
      .from('recordings')
      .update({ status: 'completed' })
      .eq('id', recordingId);

    return new Response(JSON.stringify({ summary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
