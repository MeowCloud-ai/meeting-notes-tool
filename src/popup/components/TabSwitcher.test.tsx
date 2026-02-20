import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabSwitcher from './TabSwitcher';

describe('TabSwitcher', () => {
  it('renders all tabs', () => {
    render(<TabSwitcher tabs={['逐字稿', '摘要']} activeTab={0} onTabChange={() => {}} />);
    expect(screen.getByText('逐字稿')).toBeInTheDocument();
    expect(screen.getByText('摘要')).toBeInTheDocument();
  });

  it('calls onTabChange when clicking a tab', () => {
    const onChange = vi.fn();
    render(<TabSwitcher tabs={['逐字稿', '摘要']} activeTab={0} onTabChange={onChange} />);
    fireEvent.click(screen.getByText('摘要'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('highlights active tab', () => {
    render(<TabSwitcher tabs={['逐字稿', '摘要']} activeTab={1} onTabChange={() => {}} />);
    const summaryTab = screen.getByText('摘要');
    expect(summaryTab.className).toContain('text-blue-600');
  });
});
