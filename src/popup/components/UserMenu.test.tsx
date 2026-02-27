import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from './UserMenu';

describe('UserMenu', () => {
  const defaultProps = {
    displayName: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
    orgName: null as string | null,
    usageUsed: 1,
    usageLimit: 3,
    onSignOut: vi.fn(),
  };

  it('renders user info and usage', () => {
    render(<UserMenu {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('1/3 分鐘已用')).toBeInTheDocument();
  });

  it('shows email when no display name', () => {
    render(<UserMenu {...defaultProps} displayName={null} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows org name when provided', () => {
    render(<UserMenu {...defaultProps} orgName="MeowCloud" />);
    expect(screen.getByTestId('org-name')).toHaveTextContent('MeowCloud');
  });

  it('hides org name when null', () => {
    render(<UserMenu {...defaultProps} />);
    expect(screen.queryByTestId('org-name')).not.toBeInTheDocument();
  });

  it('calls onSignOut when button clicked', () => {
    const onSignOut = vi.fn();
    render(<UserMenu {...defaultProps} onSignOut={onSignOut} />);
    fireEvent.click(screen.getByTestId('sign-out-button'));
    expect(onSignOut).toHaveBeenCalled();
  });
});
