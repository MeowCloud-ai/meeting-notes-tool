import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SummaryView from './SummaryView';
import type { Summary } from '../../types/database';

const mockSummary: Summary = {
  id: 's1',
  recording_id: 'r1',
  highlights: ['結論一', '結論二'],
  action_items: [
    { text: '準備報告', assignee: 'Speaker 1', due_date: '下週一' },
  ],
  key_dialogues: [
    { speaker: 'Speaker 1', text: '重要發言內容', timestamp_seconds: 15 },
  ],
  raw_summary: '這是會議總結。',
  model: 'gemini-2.0-flash',
  created_at: '2025-01-01T00:00:00Z',
};

describe('SummaryView', () => {
  it('renders highlights', () => {
    render(<SummaryView summary={mockSummary} />);
    expect(screen.getByText('結論一')).toBeInTheDocument();
    expect(screen.getByText('結論二')).toBeInTheDocument();
  });

  it('renders action items', () => {
    render(<SummaryView summary={mockSummary} />);
    expect(screen.getByText('準備報告')).toBeInTheDocument();
    expect(screen.getByText('👤 Speaker 1')).toBeInTheDocument();
    expect(screen.getByText('📅 下週一')).toBeInTheDocument();
  });

  it('renders key dialogues with expand/collapse', () => {
    render(<SummaryView summary={mockSummary} />);
    expect(screen.getByText('Speaker 1')).toBeInTheDocument();
    // Initially collapsed - text not visible
    expect(screen.queryByText('重要發言內容')).not.toBeInTheDocument();
    // Click to expand
    fireEvent.click(screen.getByText('Speaker 1'));
    expect(screen.getByText('重要發言內容')).toBeInTheDocument();
  });

  it('renders raw summary', () => {
    render(<SummaryView summary={mockSummary} />);
    expect(screen.getByText('這是會議總結。')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    const emptySummary: Summary = {
      ...mockSummary,
      highlights: [],
      action_items: [],
      key_dialogues: [],
      raw_summary: null,
    };
    render(<SummaryView summary={emptySummary} />);
    expect(screen.getByText('尚無摘要內容')).toBeInTheDocument();
  });
});
