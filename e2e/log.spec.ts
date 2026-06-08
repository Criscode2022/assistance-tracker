import { test, expect } from '@playwright/test';
import { gotoTab, logDayRows, markFirstPastDayPresent } from './helpers/navigation';
import { seedLocalStorage, makeCourse } from './helpers/storage';

const course = makeCourse({
  name: 'MCP Workflow Test',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
});

test.describe('Attendance Log', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page, { courses: [course], selectedCourseId: course.id });
    await gotoTab(page, 'log');
  });

  test('L-001: shows weekday rows within course range', async ({ page }) => {
    await expect(logDayRows(page).first()).toBeVisible();
    await expect(page.locator('.month-section-label')).toBeVisible();
  });

  test('L-020: set day to Present via action sheet', async ({ page }) => {
    await markFirstPastDayPresent(page);
    await expect(page.locator('ion-icon[name="checkmark-circle"]').first()).toBeVisible();
  });

  test('L-004: future days are not tappable', async ({ page }) => {
    const futureDays = page.locator('ion-item-sliding[disabled]');
    const count = await futureDays.count();
    if (count > 0) {
      await futureDays.first().locator('ion-item').click({ force: true });
      await expect(page.locator('ion-action-sheet')).not.toBeVisible();
    }
  });
});
