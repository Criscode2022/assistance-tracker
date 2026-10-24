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

});

test.describe('Attendance Log — future days and holidays', () => {
  test('L-004: a future day can be cancelled or left unlogged', async ({ page }) => {
    await page.goto('about:blank');
    const range = await page.evaluate(() => {
      const today = new Date();
      const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const next = new Date(today);
      next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
      const end = new Date(next.getFullYear(), next.getMonth() + 1, 0);
      return { start: fmt(new Date(next.getFullYear(), next.getMonth(), 1)), end: fmt(end), month: fmt(next).slice(0, 7) };
    });

    const futureCourse = makeCourse({
      id: 'course-future',
      name: 'Curso con días futuros',
      startDate: range.start,
      endDate: range.end,
    });
    await seedLocalStorage(page, { courses: [futureCourse], selectedCourseId: futureCourse.id });
    await page.addInitScript((month) => {
      sessionStorage.setItem('selected_period_v1', JSON.stringify({ 'course-future': month }));
    }, range.month);
    await gotoTab(page, 'log');

    const future = page.locator('app-log .day-card.day-future').first();
    await expect(future).toBeVisible();
    await expect(
      page.locator('app-log ion-item-sliding').filter({ has: page.locator('.day-card.day-future') }).first().locator('ion-item-options'),
    ).toHaveCount(0);
    await future.click();

    const sheet = page.locator('ion-action-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: /^presente$|^present$/i })).toHaveCount(0);
    await expect(sheet.getByRole('button', { name: /^falta$|^absent$/i })).toHaveCount(0);
    await expect(sheet.getByRole('button', { name: /impuntual|late/i })).toHaveCount(0);
    await expect(sheet.getByRole('button', { name: /sin registrar|unlogged/i })).toBeVisible();
    await sheet.getByRole('button', { name: /clase cancelada|class cancelled/i }).click();

    await expect(page.locator('app-log .day-status-label[data-status="cancelled"]').first()).toBeVisible();
  });

  test('a holiday shows its name and is not editable from the log', async ({ page }) => {
    await page.goto('about:blank');
    const range = await page.evaluate(() => {
      const today = new Date();
      const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const holiday = new Date(today);
      holiday.setDate(holiday.getDate() + 1);
      while (holiday.getDay() === 0 || holiday.getDay() === 6) {
        holiday.setDate(holiday.getDate() + 1);
      }
      const end = new Date(holiday.getFullYear(), holiday.getMonth() + 1, 0);
      return {
        start: fmt(new Date(holiday.getFullYear(), holiday.getMonth(), 1)),
        end: fmt(end),
        holiday: fmt(holiday),
        month: fmt(holiday).slice(0, 7),
      };
    });

    const holidayCourse = makeCourse({
      id: 'course-holiday',
      name: 'Curso con festivo',
      startDate: range.start,
      endDate: range.end,
      holidays: [{ id: 'h1', date: range.holiday, name: 'Puente' }],
    });
    await seedLocalStorage(page, { courses: [holidayCourse], selectedCourseId: holidayCourse.id });
    await page.addInitScript((month) => {
      sessionStorage.setItem('selected_period_v1', JSON.stringify({ 'course-holiday': month }));
    }, range.month);
    await gotoTab(page, 'log');

    const card = page.locator('app-log .day-card.day-holiday', { hasText: 'Puente' });
    await expect(card).toBeVisible();
    await expect(card.locator('.day-status-label[data-status="holiday"]')).toHaveText('Puente');
    await card.click({ force: true });
    await expect(page.locator('ion-action-sheet')).toHaveCount(0);
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
    await expect(page.locator('app-log .month-section-label')).toContainText(/mayo|may/i);

    await markFirstPastDayPresent(page);

    await expect(page.locator('app-log .month-section-label')).toContainText(/mayo|may/i);
    await expect(page.locator('app-log ion-select.month-select')).toHaveJSProperty('value', '2026-05');

    await clickTab(page, 'dashboard');
    await expect(page.locator('app-dashboard ion-select.month-select')).toHaveJSProperty('value', '2026-05');
  });
});
