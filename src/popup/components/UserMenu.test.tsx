import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from './UserMenu';

describe('UserMenu', () => {
  const defaultProps = {
    displayName: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
    usageUsed: 1,
    usageLimit: 3,
    onSignOut: vi.fn(),
  };

  it('renders user info and usage', () => {
    render(<UserMenu {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('1/3 場已用')).toBeInTheDocument();
  });

  it('shows email when no display name', () => {
    render(<UserMenu {...defaultProps} displayName={null} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onSignOut when button clicked', () => {
    const onSignOut = vi.fn();
    render(<UserMenu {...defaultProps} onSignOut={onSignOut} />);
    fireEvent.click(screen.getByTestId('sign-out-button'));
    expect(onSignOut).toHaveBeenCalled();
  });
});
