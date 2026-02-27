import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UsageBar from './UsageBar';

describe('UsageBar', () => {
  it('shows usage text', () => {
    render(<UsageBar used={1} limit={3} />);
    expect(screen.getByText('1/3 場')).toBeInTheDocument();
  });

  it('shows red when full', () => {
    render(<UsageBar used={3} limit={3} />);
    const fill = screen.getByTestId('usage-bar-fill');
    expect(fill.className).toContain('bg-red-500');
  });

  it('shows yellow when warning', () => {
    render(<UsageBar used={2} limit={3} />);
    const fill = screen.getByTestId('usage-bar-fill');
    expect(fill.className).toContain('bg-[#F59E0B]');
  });

  it('shows blue when normal', () => {
    render(<UsageBar used={1} limit={3} />);
    const fill = screen.getByTestId('usage-bar-fill');
    expect(fill.className).toContain('bg-[#7C3AED]');
  });
});
