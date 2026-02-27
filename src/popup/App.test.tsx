import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock chrome.runtime
const mockSendMessage = vi.fn();
vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: mockSendMessage,
  },
  identity: {
    getRedirectURL: vi.fn().mockReturnValue('https://redirect.test'),
    launchWebAuthFlow: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
    },
  },
});

// Mock auth - simulate logged-in user
vi.mock('../lib/auth', () => ({
  authManager: {
    getSession: vi.fn().mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    }),
    onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock plan manager
vi.mock('../lib/plan', () => ({
  planManager: {
    getUsage: vi.fn().mockResolvedValue({ minutesUsed: 5, minutesLimit: 30, recordingCount: 1, resetAt: new Date() }),
    canRecord: vi.fn().mockResolvedValue({ allowed: true }),
  },
}));

// Mock supabase for RecordingList
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [] }),
          }),
        }),
      }),
    }),
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
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

  it('renders title after auth', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('MeowMeet')).toBeInTheDocument();
    });
  });

  it('shows user menu when authenticated', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
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

  it('shows empty recording list', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('尚無錄音記錄')).toBeInTheDocument();
    });
  });
});

// Need to import after mocks
import App from './App';
