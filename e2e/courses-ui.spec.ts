import { test, expect } from '@playwright/test';
import {
  gotoTab,
  createCourse,
  enterCourseSelectMode,
  deleteCourseByName,
} from './helpers/navigation';
import { seedLocalStorage } from './helpers/storage';

test.describe('Courses — UI', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoTab(page, 'courses');
  });

  test('CU-001: import card shows folder icon without chevron', async ({ page }) => {
    await createCourse(page, {
      name: 'Select UI Course',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    await expect(page.locator('.import-card ion-icon[name="folder-open-outline"]')).toBeVisible();
    await expect(page.locator('.import-card ion-icon[name="chevron-forward-outline"]')).toHaveCount(0);
  });

  test('CU-002: select mode shows actions without center title', async ({ page }) => {
    await createCourse(page, {
      name: 'Select UI Course',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    await enterCourseSelectMode(page);

    await expect(page.getByRole('button', { name: /cancelar|cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /acciones|actions/i })).toBeVisible();
    await expect(page.locator('ion-title')).not.toContainText(/seleccionar|select/i);
  });

  test('CU-003: bulk actions button stays disabled with no selection', async ({ page }) => {
    await createCourse(page, {
      name: 'Select UI Course',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    await enterCourseSelectMode(page);
    await expect(page.getByRole('button', { name: /acciones|actions/i })).toBeDisabled();
  });
});

test.describe('Courses — tablet layout', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('CU-010: tablet shows inline action buttons on course card', async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoTab(page, 'courses');
    await createCourse(page, {
      name: 'Tablet Course',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });

    const actions = page.locator('.course-actions');
    await expect(actions).toBeVisible();
    await expect(actions.locator('ion-icon[name="share-outline"]')).toBeVisible();
    await expect(actions.locator('ion-icon[name="pencil-outline"]')).toBeVisible();
    await expect(actions.locator('ion-icon[name="trash-outline"]')).toBeVisible();
  });

  test('CU-011: tablet delete uses inline button', async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoTab(page, 'courses');
    await createCourse(page, {
      name: 'Tablet Delete Me',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    await deleteCourseByName(page, 'Tablet Delete Me');
    await expect(page.getByRole('heading', { name: 'Tablet Delete Me' })).not.toBeVisible();
  });
});
