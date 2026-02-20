import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TranscriptView from './TranscriptView';
import type { Transcript } from '../../types/database';

const mockTranscript: Transcript = {
  id: 't1',
  recording_id: 'r1',
  content: '[Speaker 1] 00:00 - 大家好\n[Speaker 2] 00:15 - 你好',
  speakers: [
    { id: '0', name: 'Speaker 1' },
    { id: '1', name: 'Speaker 2' },
  ],
  language: 'zh-TW',
  word_count: 4,
  created_at: '2025-01-01T00:00:00Z',
};

describe('TranscriptView', () => {
  it('renders transcript lines', () => {
    render(<TranscriptView transcript={mockTranscript} />);
    expect(screen.getByText('大家好')).toBeInTheDocument();
    expect(screen.getByText('你好')).toBeInTheDocument();
  });

  it('shows speaker labels', () => {
    render(<TranscriptView transcript={mockTranscript} />);
    expect(screen.getByText('[Speaker 1]')).toBeInTheDocument();
    expect(screen.getByText('[Speaker 2]')).toBeInTheDocument();
  });

  it('filters by search query', () => {
    render(<TranscriptView transcript={mockTranscript} />);
    const input = screen.getByPlaceholderText('搜尋逐字稿...');
    fireEvent.change(input, { target: { value: '大家' } });
    expect(screen.getByText('大家好')).toBeInTheDocument();
    expect(screen.queryByText('你好')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no match', () => {
    render(<TranscriptView transcript={mockTranscript} />);
    const input = screen.getByPlaceholderText('搜尋逐字稿...');
    fireEvent.change(input, { target: { value: 'xyz' } });
    expect(screen.getByText('無搜尋結果')).toBeInTheDocument();
  });
});
