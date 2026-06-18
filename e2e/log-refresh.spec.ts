import { test, expect } from '@playwright/test';
import { gotoTab, logDayRows, markFirstPastDayAbsent, markFirstPastDayPresent } from './helpers/navigation';
import { seedLocalStorage, makeCourse } from './helpers/storage';

const course = makeCourse({
  name: 'Log Refresh Course',
  startDate: '2026-05-01',
  endDate: '2026-05-31',
});

test.describe('Log — live refresh', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, { courses: [course], selectedCourseId: course.id });
    await gotoTab(page, 'log');
  });

  test('L-030: day status updates immediately after action sheet closes', async ({ page }) => {
    const firstRow = logDayRows(page).first();
    await expect(firstRow.locator('ion-icon[name="ellipse-outline"]').first()).toBeVisible();

    await markFirstPastDayPresent(page);

    await expect(firstRow.locator('ion-icon[name="checkmark-circle"]').first()).toBeVisible();
    await expect(firstRow.locator('.day-status-label[data-status="present"]')).toBeVisible();
  });

  test('L-031: marking absent updates card without extra interaction', async ({ page }) => {
    const firstRow = logDayRows(page).first();
    await markFirstPastDayAbsent(page);

    await expect(firstRow.locator('ion-icon[name="close-circle"]').first()).toBeVisible();
    await expect(firstRow.locator('.day-status-label[data-status="absent"]')).toBeVisible();
  });
});
