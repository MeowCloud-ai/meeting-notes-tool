import { describe, it, expect } from 'vitest';
import {
  formatTimestamp,
  mergeWordsToLines,
  formatTranscript,
  extractSpeakers,
} from './transcribe';
import type { DeepgramWord } from './transcribe';

describe('formatTimestamp', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(15)).toBe('00:15');
    expect(formatTimestamp(65)).toBe('01:05');
    expect(formatTimestamp(3661)).toBe('61:01');
  });

  it('floors fractional seconds', () => {
    expect(formatTimestamp(15.7)).toBe('00:15');
  });
});

describe('mergeWordsToLines', () => {
  it('returns empty array for no words', () => {
    expect(mergeWordsToLines([])).toEqual([]);
  });

  it('groups consecutive words by same speaker', () => {
    const words: DeepgramWord[] = [
      { word: 'hello', start: 0, end: 0.5, speaker: 0, punctuated_word: 'Hello' },
      { word: 'world', start: 0.5, end: 1, speaker: 0, punctuated_word: 'world.' },
      { word: 'hi', start: 1.5, end: 2, speaker: 1, punctuated_word: 'Hi' },
      { word: 'there', start: 2, end: 2.5, speaker: 1, punctuated_word: 'there.' },
    ];

    const lines = mergeWordsToLines(words);
    expect(lines).toEqual([
      { speaker: 0, timestamp: 0, text: 'Hello world.' },
      { speaker: 1, timestamp: 1.5, text: 'Hi there.' },
    ]);
  });

  it('handles speaker changes back and forth', () => {
    const words: DeepgramWord[] = [
      { word: 'a', start: 0, end: 0.5, speaker: 0, punctuated_word: 'A' },
      { word: 'b', start: 1, end: 1.5, speaker: 1, punctuated_word: 'B' },
      { word: 'c', start: 2, end: 2.5, speaker: 0, punctuated_word: 'C' },
    ];

    const lines = mergeWordsToLines(words);
    expect(lines).toHaveLength(3);
    expect(lines[0]!.speaker).toBe(0);
    expect(lines[1]!.speaker).toBe(1);
    expect(lines[2]!.speaker).toBe(0);
  });

  it('handles single word', () => {
    const words: DeepgramWord[] = [
      { word: 'test', start: 5, end: 5.5, speaker: 0, punctuated_word: 'Test.' },
    ];

    const lines = mergeWordsToLines(words);
    expect(lines).toEqual([{ speaker: 0, timestamp: 5, text: 'Test.' }]);
  });
});

describe('formatTranscript', () => {
  it('formats lines with speaker labels and timestamps', () => {
    const lines = [
      { speaker: 0, timestamp: 0, text: 'Hello' },
      { speaker: 1, timestamp: 15, text: 'Hi there' },
    ];

    const result = formatTranscript(lines);
    expect(result).toBe('[Speaker 1] 00:00 - Hello\n[Speaker 2] 00:15 - Hi there');
  });

  it('returns empty string for empty lines', () => {
    expect(formatTranscript([])).toBe('');
  });
});

describe('extractSpeakers', () => {
  it('extracts unique speakers sorted by id', () => {
    const lines = [
      { speaker: 1, timestamp: 0, text: 'A' },
      { speaker: 0, timestamp: 1, text: 'B' },
      { speaker: 1, timestamp: 2, text: 'C' },
      { speaker: 2, timestamp: 3, text: 'D' },
    ];

    const speakers = extractSpeakers(lines);
    expect(speakers).toEqual([
      { id: '0', name: 'Speaker 1' },
      { id: '1', name: 'Speaker 2' },
      { id: '2', name: 'Speaker 3' },
    ]);
  });

  it('returns empty for no lines', () => {
    expect(extractSpeakers([])).toEqual([]);
  });
});
