import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders status label', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('shows spinner for transcribing', () => {
    const { container } = render(<StatusBadge status="transcribing" />);
    expect(screen.getByText('轉錄中')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows spinner for summarizing', () => {
    const { container } = render(<StatusBadge status="summarizing" />);
    expect(screen.getByText('摘要中')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('no spinner for completed', () => {
    const { container } = render(<StatusBadge status="completed" />);
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });
});
