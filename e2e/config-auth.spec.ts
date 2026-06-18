import { test, expect } from '@playwright/test';
import { gotoConfig, gotoAuth, goBackFromHeader, gotoTab } from './helpers/navigation';
import { seedLocalStorage } from './helpers/storage';

test.describe('Config & auth navigation', () => {
  test('CA-001: config back returns to dashboard', async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoConfig(page);
    await goBackFromHeader(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('CA-002: auth back returns to dashboard without looping through config', async ({ page }) => {
    await seedLocalStorage(page, { appMode: 'online', onlineIntent: true });
    await gotoAuth(page);
    await goBackFromHeader(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('ion-tab-bar')).toBeVisible();
  });

  test('CA-003: config back clears stale online mode without session', async ({ page }) => {
    await seedLocalStorage(page, { appMode: 'online' });
    await gotoConfig(page);
    await goBackFromHeader(page);
    await expect(page).toHaveURL(/\/dashboard/);

    const mode = await page.evaluate(() => localStorage.getItem('app_mode_v1'));
    expect(mode).toBe('offline');
  });

  test('CA-004: dashboard gear still opens config', async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoTab(page, 'dashboard');
    await page
      .locator('ion-button')
      .filter({ has: page.locator('ion-icon[name="settings-outline"]') })
      .click();
    await expect(page).toHaveURL(/\/config/);
  });
});
