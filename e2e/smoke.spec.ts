import { test, expect } from '@playwright/test';
import { gotoTab, clickTab, expectTabBar } from './helpers/navigation';
import { seedLocalStorage, makeCourse } from './helpers/storage';

test.describe('Global / App Shell', () => {
  test('G-001: app loads and shows tab bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('ion-tab-bar')).toBeVisible();
    await expectTabBar(page, 'es');
  });

  test('G-002: all four tabs are navigable', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('ion-tab-bar')).toBeVisible();

    for (const tab of ['dashboard', 'log', 'history', 'courses'] as const) {
      await clickTab(page, tab);
      await expect(page).toHaveURL(new RegExp(`/${tab}`));
    }
  });

  test('G-004: deep link to /config works', async ({ page }) => {
    await page.goto('/config');
    await expect(page.locator('ion-content')).toBeVisible();
    await expect(page.locator('ion-tab-bar')).not.toBeVisible();
  });

  test('G-005: deep link to /auth works', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('ion-content')).toBeVisible();
  });

  test('G-008: page reload restores localStorage data', async ({ page }) => {
    const course = makeCourse({ name: 'Persistencia E2E' });
    await seedLocalStorage(page, { courses: [course], selectedCourseId: course.id });
    await gotoTab(page, 'courses');
    await expect(page.getByRole('heading', { name: 'Persistencia E2E' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Persistencia E2E' })).toBeVisible();
  });
});

test.describe('First launch & empty state', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, {});
  });

  test('E-004: courses tab shows empty list with FAB', async ({ page }) => {
    await gotoTab(page, 'courses');
    await expect(page.locator('ion-fab-button')).toBeVisible();
    await expect(page.getByRole('heading', { name: /sin cursos|no courses/i })).toBeVisible();
  });

  test('E-002: log tab shows no-courses empty state', async ({ page }) => {
    await gotoTab(page, 'log');
    await expect(page.locator('.empty-state')).toBeVisible();
  });
});
