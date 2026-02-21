import { test as base, type Page } from '@playwright/test';

/**
 * Extension test fixture.
 * Tests the popup HTML served via local server with mocked chrome APIs.
 */
export const test = base.extend<{ popupPage: Page }>({
  popupPage: async ({ page, baseURL }, use) => {
    // Inject chrome API mocks before navigating
    await page.addInitScript(() => {
      (window as Record<string, unknown>).chrome = {
        runtime: {
          sendMessage: async (msg: { type: string }) => {
            const states: Record<string, unknown> = {
              GET_STATE: {
                success: true,
                state: { isRecording: false, isPaused: false, startTime: null, tabId: null },
              },
              START_RECORDING: {
                success: true,
                state: { isRecording: true, isPaused: false, startTime: Date.now(), tabId: 1 },
              },
              PAUSE_RECORDING: {
                success: true,
                state: { isRecording: true, isPaused: true, startTime: Date.now(), tabId: 1 },
              },
              RESUME_RECORDING: {
                success: true,
                state: { isRecording: true, isPaused: false, startTime: Date.now(), tabId: 1 },
              },
              STOP_RECORDING: {
                success: true,
                state: { isRecording: false, isPaused: false, startTime: null, tabId: null },
              },
            };
            return states[msg.type] ?? { success: false };
          },
          lastError: null,
        },
        identity: {
          getAuthToken: async () => ({ token: 'mock-token', grantedScopes: [] }),
          removeCachedAuthToken: async () => {},
        },
        storage: {
          local: {
            get: async () => ({}),
            set: async () => {},
          },
        },
      };
    });

    await page.goto(`${baseURL}/popup.html`);
    await page.waitForTimeout(1000); // Wait for React to render
    await use(page);
  },
});

export { expect } from '@playwright/test';
