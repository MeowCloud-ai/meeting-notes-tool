import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock chrome.runtime
const mockSendMessage = vi.fn();
vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: mockSendMessage,
  },
});

// Mock supabase for RecordingList
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMessage.mockResolvedValue({
      success: true,
      state: {
        isRecording: false,
        isPaused: false,
        startTime: null,
        tabId: null,
      },
    });
  });

  it('renders title', async () => {
    render(<App />);
    expect(screen.getByText('🐱 MeowMeet')).toBeInTheDocument();
  });

  it('shows start button in idle state', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText('開始錄音')).toBeInTheDocument();
    });
  });

  it('sends START_RECORDING on click', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText('開始錄音')).toBeInTheDocument();
    });

    mockSendMessage.mockResolvedValueOnce({
      success: true,
      state: { isRecording: true, isPaused: false, startTime: Date.now(), tabId: 1 },
    });

    fireEvent.click(screen.getByLabelText('開始錄音'));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({ type: 'START_RECORDING' });
    });
  });

  it('shows pause and stop buttons when recording', async () => {
    mockSendMessage.mockResolvedValue({
      success: true,
      state: { isRecording: true, isPaused: false, startTime: Date.now(), tabId: 1 },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('暫停錄音')).toBeInTheDocument();
      expect(screen.getByLabelText('停止錄音')).toBeInTheDocument();
    });
  });

  it('shows resume button when paused', async () => {
    mockSendMessage.mockResolvedValue({
      success: true,
      state: { isRecording: true, isPaused: true, startTime: Date.now(), tabId: 1 },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('繼續錄音')).toBeInTheDocument();
    });
  });

  it('shows timer', async () => {
    render(<App />);
    expect(screen.getByTestId('timer')).toBeInTheDocument();
  });

  it('shows empty recording list', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('尚無錄音記錄')).toBeInTheDocument();
    });
  });
});
