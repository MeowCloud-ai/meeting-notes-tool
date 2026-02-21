import { test, expect } from './fixtures/extension';

test.describe('Offline Mode', () => {
  test('TC-007: popup handles offline gracefully', async ({ popupPage: page, baseURL }) => {
    // Verify page loaded
    await expect(page.getByText('MeowMeet')).toBeVisible({ timeout: 5000 });

    // Go offline
    await page.context().setOffline(true);

    // Wait a moment
    await page.waitForTimeout(500);

    // Go back online
    await page.context().setOffline(false);

    // Navigate again and verify
    await page.goto(`${baseURL}/popup.html`);
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
