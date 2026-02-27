import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MicStatus from './MicStatus';

describe('MicStatus', () => {
  it('renders nothing when not recording', () => {
    const { container } = render(<MicStatus isRecording={false} micEnabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows mic enabled status when recording with mic', () => {
    render(<MicStatus isRecording={true} micEnabled={true} />);
    expect(screen.getByText('麥克風開')).toBeInTheDocument();
    expect(screen.getByTestId('mic-status').className).toContain('text-emerald-600');
  });

  it('shows tab-only status when recording without mic', () => {
    render(<MicStatus isRecording={true} micEnabled={false} />);
    expect(screen.getByText('僅錄分頁')).toBeInTheDocument();
    expect(screen.getByTestId('mic-status').className).toContain('text-gray-400');
  });
});
