// Pure functions for summary processing, re-exported for testing

export interface SummaryResult {
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
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned) as SummaryResult;

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
