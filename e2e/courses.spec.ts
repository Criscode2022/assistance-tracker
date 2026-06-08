import { test, expect } from '@playwright/test';
import {
  gotoTab,
  openNewCourseForm,
  fillCourseForm,
  saveCourseForm,
  createCourse,
  deleteCourseByName,
} from './helpers/navigation';
import { seedLocalStorage } from './helpers/storage';

test.describe('Courses — Create', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoTab(page, 'courses');
  });

  test('C-001: FAB opens new course form', async ({ page }) => {
    await openNewCourseForm(page);
  });

  test('C-002: create course with valid fields', async ({ page }) => {
    await createCourse(page, {
      name: 'MCP Workflow Test',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
  });

  test('C-020: empty name shows validation error on touch', async ({ page }) => {
    await openNewCourseForm(page);
    await fillCourseForm(page, { startDate: '2026-06-01', endDate: '2026-06-30' });
    const nameInput = page.locator('input.modern-input[type="text"]');
    await nameInput.focus();
    await page.locator('input.modern-input[type="date"]').first().click();
    await expect(page.locator('.field-error').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar curso|save course/i })).toBeDisabled();
  });

  test('C-030: end date before start date shows error', async ({ page }) => {
    await openNewCourseForm(page);
    await fillCourseForm(page, {
      name: 'Rango inválido',
      startDate: '2026-06-30',
      endDate: '2026-06-01',
    });
    await page.locator('input.modern-input[type="date"]').nth(1).blur();
    await expect(page.locator('.field-error').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar curso|save course/i })).toBeDisabled();
  });

  test('C-004: cancel form discards changes', async ({ page }) => {
    await openNewCourseForm(page);
    await fillCourseForm(page, { name: 'Descartado' });
    await page.locator('ion-button').filter({ has: page.locator('ion-icon[name="close-outline"]') }).click();
    await expect(page.getByText('Descartado')).not.toBeVisible();
  });

  test('C-060: delete course via card action', async ({ page }) => {
    await createCourse(page, {
      name: 'MCP Workflow Test',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    await deleteCourseByName(page, 'MCP Workflow Test');
    await expect(page.getByRole('heading', { name: /no courses|sin cursos/i })).toBeVisible();
  });
});

test.describe('Courses — Import validation', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoTab(page, 'courses');
  });

  test('IE-008: invalid JSON shows error toast', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('not json'),
    });
    await expect(page.locator('ion-toast')).toBeVisible({ timeout: 5000 });
  });
});
