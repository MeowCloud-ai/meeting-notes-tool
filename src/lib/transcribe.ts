// Re-export pure functions from the edge function for testing
// These are duplicated here since we can't import Deno modules in the browser

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  speaker: number;
  punctuated_word: string;
}

export interface TranscriptLine {
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
