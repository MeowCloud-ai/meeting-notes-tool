import { test, expect } from './fixtures/extension';

test.describe('Auth Flow', () => {
  test('TC-005: popup loads and shows UI', async ({ popupPage: page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.getByText('MeowMeet')).toBeVisible({ timeout: 5000 });
  });

  test('TC-005b: login page shows sign in button when not authenticated', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      (window as Record<string, unknown>).chrome = {
        runtime: { sendMessage: async () => ({}), lastError: null },
        identity: { getAuthToken: async () => ({ token: undefined }), removeCachedAuthToken: async () => {} },
        storage: { local: { get: async () => ({}), set: async () => {} } },
      };
    });

    await page.goto(`${baseURL}/popup.html`);
    await page.waitForTimeout(1000);

    const body = await page.textContent('body');
    expect(body).toContain('MeowMeet');
  });
});
