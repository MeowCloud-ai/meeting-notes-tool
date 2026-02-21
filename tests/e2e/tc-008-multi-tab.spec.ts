import { test, expect } from './fixtures/extension';

test.describe('Multi-Tab', () => {
  test('TC-008: multiple popup instances load independently', async ({ popupPage: page, context, baseURL }) => {
    await expect(page.getByText('MeowMeet')).toBeVisible({ timeout: 5000 });

    // Open a second popup page
    const page2 = await context.newPage();
    await page2.addInitScript(() => {
      (window as Record<string, unknown>).chrome = {
        runtime: {
          sendMessage: async () => ({
            success: true,
            state: { isRecording: true, isPaused: false, startTime: Date.now(), tabId: 1 },
          }),
          lastError: null,
        },
        identity: { getAuthToken: async () => ({ token: 'mock', grantedScopes: [] }), removeCachedAuthToken: async () => {} },
        storage: { local: { get: async () => ({}), set: async () => {} } },
      };
    });

    await page2.goto(`${baseURL}/popup.html`);
    await page2.waitForTimeout(1000);
    await expect(page2.getByText('MeowMeet')).toBeVisible({ timeout: 5000 });
  });
});
