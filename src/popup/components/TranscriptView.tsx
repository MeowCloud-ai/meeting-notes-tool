import { useState, useMemo } from 'react';
import type { Transcript } from '../../types/database';

interface TranscriptViewProps {
  transcript: Transcript;
}

const SPEAKER_COLORS = [
  'text-[#7C3AED]',
  'text-emerald-600',
  'text-[#EC4899]',
  'text-[#F59E0B]',
  'text-blue-600',
  'text-teal-600',
];

interface ParsedLine {
  speaker: string;
  timestamp: string;
  text: string;
}

function parseTranscriptLine(line: string): ParsedLine | null {
  // Format from Deepgram: [0:00] Speaker 0: text
  const match1 = line.match(/^\[(\d+:\d{2})\]\s+(Speaker \d+):\s+(.+)$/);
  if (match1) return { timestamp: match1[1]!, speaker: match1[2]!, text: match1[3]! };
  // Alternate format: [Speaker] 00:00 - text
  const match2 = line.match(/^\[(.+?)\]\s+(\d{2}:\d{2})\s+-\s+(.+)$/);
  if (match2) return { speaker: match2[1]!, timestamp: match2[2]!, text: match2[3]! };
  // Plain text line
  if (line.trim()) return { speaker: '', timestamp: '', text: line.trim() };
  return null;
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
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/50 transition-all"
      />

      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
        {filteredLines.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-4">
            {search ? '無搜尋結果' : '尚無逐字稿內容'}
          </p>
        ) : (
          filteredLines.map((line, i) => (
            <div key={i} className="text-sm py-1">
              <span className={`font-medium ${getSpeakerColor(line.speaker, speakerMap)}`}>
                [{line.speaker}]
              </span>{' '}
              <span className="text-gray-300 text-xs font-mono">{line.timestamp}</span>
              <p className="text-gray-700 mt-0.5">{line.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
