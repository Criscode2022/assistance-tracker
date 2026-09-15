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
    await expect(page.getByRole('heading', { name: /sin cursos|no courses/i })).toBeVisible();
    await expect(page.getByText(/crea tu primer curso para comenzar|create your first course to get started/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /crear curso|create course/i })).toBeVisible();
  });

  test('E-001: every tab shares the same no-courses empty state', async ({ page }) => {
    for (const tab of ['dashboard', 'log', 'history', 'courses'] as const) {
      await gotoTab(page, tab);
      await expect(page.getByRole('heading', { name: /sin cursos|no courses/i })).toBeVisible();
      await expect(page.getByText(/crea tu primer curso para comenzar|create your first course to get started/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /crear curso|create course/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /importar curso|import course/i })).toBeVisible();
      await expect(page.getByText(/ya tienes cursos en la nube|already have courses in the cloud/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /iniciar sesión|sign in/i })).toBeVisible();
    }
  });

  test('E-005: empty-state button opens the new course form', async ({ page }) => {
    await gotoTab(page, 'dashboard');
    await page.getByRole('button', { name: /crear curso|create course/i }).click();
    await expect(page).toHaveURL(/\/courses/);
    await expect(page.locator('.form-wrap')).toBeVisible();
  });

  test('E-006: empty-state sign-in opens the auth page on the sign-in tab', async ({ page }) => {
    await gotoTab(page, 'dashboard');
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page).toHaveURL(/tab=signin/);
    await expect(page.locator('.tab-btn.active')).toHaveText(/iniciar sesión|sign in/i);
  });

  test('E-007: empty-state import confirms a course from any tab', async ({ page }) => {
    const course = makeCourse({ name: 'Curso importado E2E' });
    await gotoTab(page, 'dashboard');
    await page.locator('app-empty-courses input[type="file"]').setInputFiles({
      name: 'cursos.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        version: 2,
        exported: '2026-09-11T00:00:00.000Z',
        courses: [course],
        records: {},
      })),
    });
    const confirm = page.locator('ion-alert, [role="alertdialog"]').last();
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /^importar$|^import$/i }).click();
    await expect(page.locator('app-empty-courses')).toHaveCount(0);
    await expect(page.locator('.dashboard-page')).toBeVisible();
  });
});
