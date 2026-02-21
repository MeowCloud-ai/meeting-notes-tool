import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UpgradePrompt from './UpgradePrompt';

describe('UpgradePrompt', () => {
  it('renders upgrade message', () => {
    render(<UpgradePrompt />);
    expect(screen.getByText(/免費額度已用完/)).toBeInTheDocument();
    expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
  });

  it('calls onUpgrade when button clicked', () => {
    const onUpgrade = vi.fn();
    render(<UpgradePrompt onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByTestId('upgrade-button'));
    expect(onUpgrade).toHaveBeenCalled();
  });
});
