import { useState, useMemo } from 'react';
import type { Transcript } from '../../types/database';

interface TranscriptViewProps {
  transcript: Transcript;
}

const SPEAKER_COLORS = [
  'text-blue-700',
  'text-green-700',
  'text-purple-700',
  'text-orange-700',
  'text-pink-700',
  'text-teal-700',
];

interface ParsedLine {
  speaker: string;
  timestamp: string;
  text: string;
}

function parseTranscriptLine(line: string): ParsedLine | null {
  const match = line.match(/^\[(.+?)\]\s+(\d{2}:\d{2})\s+-\s+(.+)$/);
  if (!match) return null;
  return { speaker: match[1]!, timestamp: match[2]!, text: match[3]! };
}

function getSpeakerColor(speaker: string, speakerMap: Map<string, number>): string {
  if (!speakerMap.has(speaker)) {
    speakerMap.set(speaker, speakerMap.size);
  }
  const index = speakerMap.get(speaker)!;
  return SPEAKER_COLORS[index % SPEAKER_COLORS.length]!;
}

export default function TranscriptView({ transcript }: TranscriptViewProps) {
  const [search, setSearch] = useState('');

  const lines = useMemo(() => {
    return transcript.content
      .split('\n')
      .map(parseTranscriptLine)
      .filter((l): l is ParsedLine => l !== null);
  }, [transcript.content]);

  const filteredLines = useMemo(() => {
    if (!search.trim()) return lines;
    const query = search.toLowerCase();
    return lines.filter(
      (l) =>
        l.text.toLowerCase().includes(query) ||
        l.speaker.toLowerCase().includes(query)
    );
  }, [lines, search]);

  const speakerMap = useMemo(() => new Map<string, number>(), []);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="搜尋逐字稿..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
      />

      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
        {filteredLines.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {search ? '無搜尋結果' : '尚無逐字稿內容'}
          </p>
        ) : (
          filteredLines.map((line, i) => (
            <div key={i} className="text-sm py-1">
              <span className={`font-medium ${getSpeakerColor(line.speaker, speakerMap)}`}>
                [{line.speaker}]
              </span>{' '}
              <span className="text-gray-400 text-xs">{line.timestamp}</span>
              <p className="text-gray-800 mt-0.5">{line.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
