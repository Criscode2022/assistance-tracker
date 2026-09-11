import { test, expect } from '@playwright/test';
import { clickTab, gotoTab, logDayRows, markFirstPastDayPresent, selectMonthPeriod } from './helpers/navigation';
import { seedLocalStorage, makeCourse } from './helpers/storage';

const course = makeCourse({
  name: 'MCP Workflow Test',
  startDate: '2026-05-01',
  endDate: '2026-05-31',
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
    const futureDays = page.locator('app-log .days-sliding-list ion-item-sliding[disabled]');
    const count = await futureDays.count();
    if (count > 0) {
      await futureDays.first().locator('ion-item').click({ force: true });
      await expect(page.locator('ion-action-sheet')).not.toBeVisible();
    }
  });
});

test.describe('Attendance Log — selected month', () => {
  test('L-040: marking a day keeps the selected month', async ({ page }) => {
    const multiMonth = makeCourse({
      name: 'Curso varios meses',
      startDate: '2026-05-01',
      endDate: '2026-09-30',
    });
    await seedLocalStorage(page, { courses: [multiMonth], selectedCourseId: multiMonth.id });
    await gotoTab(page, 'log');

    await selectMonthPeriod(page, /mayo de 2026|may 2026/i);
    await expect(page.locator('.month-section-label')).toContainText(/mayo|may/i);

    await markFirstPastDayPresent(page);

    await expect(page.locator('.month-section-label')).toContainText(/mayo|may/i);
    await expect(page.locator('ion-select.month-select')).toContainText(/mayo|may/i);

    await clickTab(page, 'dashboard');
    await expect(page.locator('ion-select.month-select')).toContainText(/mayo|may/i);
  });
});
