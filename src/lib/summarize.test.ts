import { describe, it, expect } from 'vitest';
import { buildPrompt, parseSummaryJSON } from './summarize';

describe('buildPrompt', () => {
  it('includes transcript in prompt', () => {
    const prompt = buildPrompt('[Speaker 1] 00:00 - 大家好');
    expect(prompt).toContain('[Speaker 1] 00:00 - 大家好');
    expect(prompt).toContain('繁體中文');
    expect(prompt).toContain('highlights');
    expect(prompt).toContain('action_items');
  });

  it('handles empty transcript', () => {
    const prompt = buildPrompt('');
    expect(prompt).toContain('逐字稿');
  });
});

describe('parseSummaryJSON', () => {
  it('parses valid JSON', () => {
    const json = JSON.stringify({
      highlights: ['結論1', '結論2'],
      action_items: [{ assignee: 'Speaker 1', task: '準備報告', deadline: '下週一' }],
      key_dialogues: [
        { speaker: 'Speaker 1', timestamp: '00:15', content: '重要發言', context: '決策' },
      ],
      raw_summary: '這是一次重要的會議。',
    });

    const result = parseSummaryJSON(json);
    expect(result.highlights).toHaveLength(2);
    expect(result.action_items).toHaveLength(1);
    expect(result.action_items[0]!.task).toBe('準備報告');
    expect(result.key_dialogues).toHaveLength(1);
    expect(result.raw_summary).toBe('這是一次重要的會議。');
  });

  it('strips markdown code block', () => {
    const json = '```json\n{"highlights":["test"],"action_items":[],"key_dialogues":[],"raw_summary":"ok"}\n```';
    const result = parseSummaryJSON(json);
    expect(result.highlights).toEqual(['test']);
  });

  it('strips code block without language tag', () => {
    const json = '```\n{"highlights":[],"action_items":[],"key_dialogues":[],"raw_summary":"ok"}\n```';
    const result = parseSummaryJSON(json);
    expect(result.raw_summary).toBe('ok');
  });

  it('defaults missing fields to empty', () => {
    const json = '{}';
    const result = parseSummaryJSON(json);
    expect(result.highlights).toEqual([]);
    expect(result.action_items).toEqual([]);
    expect(result.key_dialogues).toEqual([]);
    expect(result.raw_summary).toBe('');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseSummaryJSON('not json')).toThrow();
  });
});
